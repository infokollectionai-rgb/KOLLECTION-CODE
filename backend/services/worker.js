/**
 * Cron worker — processes scheduled_contacts every 15 minutes.
 *
 * Called via GET /cron/process (Railway cron or n8n).
 * Picks up pending contacts, sends SMS/email/call, updates status.
 */

const Anthropic = require('@anthropic-ai/sdk');
const Stripe    = require('stripe');
const twilio    = require('twilio');
const sgMail    = require('@sendgrid/mail');

const supabase   = require('../database/supabase');
const { decrypt } = require('../utils/encryption');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const stripe    = new Stripe(process.env.STRIPE_SECRET_KEY);

const BATCH_SIZE = 50;

const FRENCH_AREA_CODES = ['514', '438', '450', '579', '418', '581', '819', '873'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectLanguage(phone) {
  if (!phone) return 'en';
  // Strip +1 prefix to get area code
  const digits = phone.replace(/\D/g, '');
  const areaCode = digits.startsWith('1') ? digits.slice(1, 4) : digits.slice(0, 3);
  return FRENCH_AREA_CODES.includes(areaCode) ? 'fr' : 'en';
}

function getStage(daysOverdue, brokenPromiseCount) {
  if (brokenPromiseCount >= 2 || daysOverdue >= 60) return 3;
  if (daysOverdue >= 14) return 2;
  return 1;
}

async function generatePaymentLink(debtor, companyId) {
  try {
    const amount     = debtor.amount ?? 0;
    if (amount <= 0) return null;

    const amountCents = Math.round(amount * 100);
    const debtorName  = debtor.name ?? debtor.first_name ?? 'Client';

    // Check for connected account
    const { data: company } = await supabase
      .from('client_companies')
      .select('stripe_account_id')
      .eq('id', companyId)
      .single();

    const stripeOpts = company?.stripe_account_id
      ? { stripeAccount: company.stripe_account_id }
      : undefined;

    const product = await stripe.products.create({
      name:     `Payment — ${debtorName}`,
      metadata: { debtor_id: debtor.id, debtor_name: debtorName },
    }, stripeOpts);

    const price = await stripe.prices.create({
      product:     product.id,
      unit_amount: amountCents,
      currency:    'cad',
    }, stripeOpts);

    const platformFeeCents = Math.round(amountCents * 0.50);

    const linkParams = {
      line_items: [{ price: price.id, quantity: 1 }],
      metadata:   { debtor_id: debtor.id, company_id: companyId },
      after_completion: {
        type: 'hosted_confirmation',
        hosted_confirmation: {
          custom_message: 'Thank you. Your payment has been received and your account updated.',
        },
      },
    };

    if (company?.stripe_account_id) {
      linkParams.application_fee_amount = platformFeeCents;
    }

    const paymentLink = await stripe.paymentLinks.create(linkParams, stripeOpts);

    // Persist the link
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    await supabase.from('payment_links').insert({
      debtor_id:              debtor.id,
      company_id:             companyId,
      stripe_payment_link_id: paymentLink.id,
      url:                    paymentLink.url,
      amount,
      description:            `Automated payment — ${debtorName}`,
      status:                 'active',
      expires_at:             expiresAt.toISOString(),
    });

    return paymentLink.url;
  } catch (err) {
    console.error(`[worker] Failed to generate payment link for debtor ${debtor.id}:`, err.message);
    return null;
  }
}

async function generateAiMessage(debtor, company, channel) {
  const stage       = getStage(debtor.days_overdue ?? 0, debtor.broken_promise_count ?? 0);
  const amount      = debtor.amount ?? 0;
  const floor       = debtor.floor_amount ?? amount * 0.3;
  const companyName = company.company_name ?? 'Collections';
  const companyPhone = company.business_phone ?? process.env.TWILIO_DEFAULT_NUMBER ?? '+14389050764';
  const firstName   = debtor.first_name ?? debtor.name?.split(' ')[0] ?? 'Client';
  const lang        = detectLanguage(debtor.phone);

  const RANGES = {
    1: { offer: amount * 0.70, min: amount * 0.50 },
    2: { offer: amount * 0.50, min: amount * 0.40 },
    3: { offer: amount * 0.40, min: floor },
  };
  const range = RANGES[stage];

  const channelNote = channel === 'sms'
    ? 'Keep the message SHORT — under 320 characters total. No greetings like "Dear". Be direct.'
    : 'Write a professional email body with a clear call to action.';

  const ctaFr = `Contactez-nous pour trouver une solution ensemble.`;
  const ctaEn = `Contact us to find a solution together.`;

  const prompt = `You are a professional account resolution specialist for ${companyName}.

DEBTOR FIRST NAME: ${firstName}
DEBTOR PHONE: ${debtor.phone ?? 'unknown'}
LANGUAGE: ${lang === 'fr' ? 'FRENCH (formal/vouvoiement)' : 'ENGLISH'}
COMPANY NAME: ${companyName}
COMPANY PHONE: ${companyPhone}
AMOUNT OWED: $${amount.toFixed(2)}
CHANNEL: ${channel}
INTERNAL STAGE: ${stage} (DO NOT mention stage/tier/layer to debtor)

${channelNote}

CRITICAL RULES:
- NEVER mention "Stage", "Tier", "Layer", or any internal system terminology to the debtor
- NEVER invent phone numbers — the ONLY phone number you may include is: ${companyPhone}
- NEVER include a payment link in outreach messages. Payment links are ONLY sent after the debtor agrees to a specific amount or payment plan during a conversation.
- End the message with a friendly call-to-action: "${lang === 'fr' ? ctaFr : ctaEn}"
- Use the exact language detected (French or English), never mix
- Sign the message with the company name only

${lang === 'fr' ? `FRENCH SMS TEMPLATE (follow this style closely):
"Bonjour ${firstName},
Ici la compagnie ${companyName}.
Ceci est un rappel que le solde de votre compte de ${amount.toFixed(2)}$ demeure impayé.
Contactez-nous pour trouver une solution ensemble.
${companyName}"` : `ENGLISH SMS TEMPLATE (follow this style closely):
"Hi ${firstName},
This is ${companyName}.
This is a reminder that your account balance of $${amount.toFixed(2)} remains unpaid.
Contact us to find a solution together.
${companyName}"`}

Generate a single ${channel} message. Output ONLY the message text — no JSON, no quotes, no explanation.`;

  try {
    const response = await anthropic.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages:   [{ role: 'user', content: prompt }],
    });
    return (response.content[0]?.text ?? '').trim();
  } catch (err) {
    console.error('[worker] AI message generation failed:', err.message);
    // Fallback static messages — no payment links
    if (lang === 'fr') {
      if (channel === 'sms') {
        return `Bonjour ${firstName},\nIci la compagnie ${companyName}.\nCeci est un rappel que le solde de votre compte de ${amount.toFixed(2)}$ demeure impayé.\nContactez-nous pour trouver une solution ensemble.\n${companyName}`;
      }
      return `Bonjour ${firstName},\n\nIci la compagnie ${companyName}.\n\nCeci est un rappel que le solde de votre compte de ${amount.toFixed(2)}$ demeure impayé.\n\nContactez-nous au ${companyPhone} pour trouver une solution ensemble.\n\nCordialement,\n${companyName}`;
    }
    if (channel === 'sms') {
      return `Hi ${firstName},\nThis is ${companyName}.\nYour account balance of $${amount.toFixed(2)} remains unpaid.\nContact us to find a solution together.\n${companyName}`;
    }
    return `Hi ${firstName},\n\nThis is ${companyName}. We are reaching out regarding your outstanding balance of $${amount.toFixed(2)}.\n\nWe'd like to work with you to find a resolution. Please contact us at ${companyPhone} to discuss your options.\n\nSincerely,\n${companyName}`;
  }
}

// ─── Channel Handlers ─────────────────────────────────────────────────────────

async function sendSms(debtor, company, message) {
  const sid   = company.twilio_account_sid ?? process.env.TWILIO_ACCOUNT_SID;
  const token = company._decrypted_twilio_auth_token ?? process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    console.error(`[worker:sms] Twilio credentials missing — sid=${!!sid}, token=${!!token}, company=${company.id}`);
    throw new Error('Twilio credentials not configured');
  }

  const fromNumber = process.env.TWILIO_DEFAULT_NUMBER || '+14389050764';

  try {
    const client = twilio(sid, token);
    const msg = await client.messages.create({
      body: message,
      from: fromNumber,
      to:   debtor.phone,
    });
    return { sid: msg.sid, status: msg.status };
  } catch (err) {
    console.error(`[worker:sms] Twilio send failed — debtor=${debtor.id}, to=${debtor.phone}, from=${fromNumber}`);
    console.error(`[worker:sms] Error: ${err.message}`);
    console.error(`[worker:sms] Stack: ${err.stack}`);
    if (err.code) console.error(`[worker:sms] Twilio error code: ${err.code}, moreInfo: ${err.moreInfo ?? 'n/a'}`);
    throw err;
  }
}

async function sendEmail(debtor, company, message) {
  const apiKey   = company._decrypted_sendgrid_api_key ?? process.env.SENDGRID_API_KEY;
  const fromAddr = company.sendgrid_from_email ?? process.env.SENDGRID_FROM_EMAIL;
  const fromName = company.sendgrid_from_name ?? company.company_name ?? 'Collections';
  if (!apiKey || !fromAddr) throw new Error('SendGrid credentials not configured');

  sgMail.setApiKey(apiKey);

  const companyName = company.company_name ?? 'Collections';
  const subject     = `Account Notice — ${companyName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>${message.replace(/\n/g, '<br>')}</p>
    </div>
  `.trim();

  const [result] = await sgMail.send({
    to:      debtor.email,
    from:    { email: fromAddr, name: fromName },
    subject,
    text:    message,
    html,
  });
  return { statusCode: result.statusCode };
}

async function initiateCall(debtor, company) {
  // VAPI call initiation — placeholder for now, logs the attempt
  console.log(`[worker] CALL placeholder: debtor=${debtor.id}, phone=${debtor.phone}, company=${company.id}`);
  return { status: 'logged', note: 'VAPI call integration pending' };
}

// ─── Main Worker ──────────────────────────────────────────────────────────────

async function processScheduledContacts() {
  const startedAt = new Date();
  console.log(`[worker] Starting at ${startedAt.toISOString()}`);

  // 1. Fetch pending contacts that are due
  const { data: contacts, error: fetchError } = await supabase
    .from('scheduled_contacts')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(BATCH_SIZE);

  if (fetchError) {
    console.error('[worker] Failed to fetch scheduled contacts:', fetchError.message);
    return { error: fetchError.message, processed: 0, sent: 0, skipped: 0, failed: 0 };
  }

  if (!contacts?.length) {
    console.log('[worker] No pending contacts to process');
    return { processed: 0, sent: 0, skipped: 0, failed: 0 };
  }

  console.log(`[worker] Found ${contacts.length} pending contacts`);

  // Cache company data to avoid repeated lookups
  const companyCache = {};
  let sent    = 0;
  let skipped = 0;
  let failed  = 0;

  for (const contact of contacts) {
    try {
      // 2. Fetch debtor
      const { data: debtor, error: debtorError } = await supabase
        .from('debtors')
        .select('id, name, first_name, phone, email, amount, floor_amount, tier, days_overdue, cease_desist, broken_promise_count')
        .eq('id', contact.debtor_id)
        .single();

      if (debtorError || !debtor) {
        console.warn(`[worker] Debtor ${contact.debtor_id} not found, skipping`);
        await markContact(contact.id, 'failed');
        failed++;
        continue;
      }

      // 3. Skip checks
      if (debtor.cease_desist === true) {
        console.log(`[worker] Debtor ${debtor.id} has cease_desist, skipping`);
        await markContact(contact.id, 'skipped');
        skipped++;
        continue;
      }

      if ((debtor.amount ?? 0) <= 0) {
        console.log(`[worker] Debtor ${debtor.id} has zero/negative balance, skipping`);
        await markContact(contact.id, 'skipped');
        skipped++;
        continue;
      }

      if (contact.channel === 'sms' && !debtor.phone) {
        console.log(`[worker] Debtor ${debtor.id} has no phone for SMS, skipping`);
        await markContact(contact.id, 'skipped');
        skipped++;
        continue;
      }

      if (contact.channel === 'email' && !debtor.email) {
        console.log(`[worker] Debtor ${debtor.id} has no email, skipping`);
        await markContact(contact.id, 'skipped');
        skipped++;
        continue;
      }

      if (contact.channel === 'call' && !debtor.phone) {
        console.log(`[worker] Debtor ${debtor.id} has no phone for call, skipping`);
        await markContact(contact.id, 'skipped');
        skipped++;
        continue;
      }

      // 2b. Fetch company (cached)
      if (!companyCache[contact.company_id]) {
        const { data: company, error: companyError } = await supabase
          .from('client_companies')
          .select('id, company_name, business_phone, twilio_account_sid, twilio_auth_token, sendgrid_api_key, sendgrid_from_email, sendgrid_from_name')
          .eq('id', contact.company_id)
          .single();

        if (companyError || !company) {
          console.warn(`[worker] Company ${contact.company_id} not found, skipping`);
          await markContact(contact.id, 'failed');
          failed++;
          continue;
        }

        // 4. Decrypt credentials
        companyCache[contact.company_id] = {
          ...company,
          _decrypted_twilio_auth_token: company.twilio_auth_token ? decrypt(company.twilio_auth_token) : null,
          _decrypted_sendgrid_api_key:  company.sendgrid_api_key  ? decrypt(company.sendgrid_api_key)  : null,
        };
      }

      const company = companyCache[contact.company_id];

      // 6. Generate message and send
      // Payment links are NOT generated for outreach messages.
      // They are only created when the debtor agrees to an amount during conversation.
      let result;

      if (contact.channel === 'sms') {
        const message = contact.message_template ?? await generateAiMessage(debtor, company, 'sms');
        result = await sendSms(debtor, company, message);

      } else if (contact.channel === 'email') {
        const message = contact.message_template ?? await generateAiMessage(debtor, company, 'email');
        result = await sendEmail(debtor, company, message);

      } else if (contact.channel === 'call') {
        result = await initiateCall(debtor, company);

      } else {
        console.warn(`[worker] Unknown channel "${contact.channel}", skipping`);
        await markContact(contact.id, 'skipped');
        skipped++;
        continue;
      }

      // 7. Mark as sent
      await markContact(contact.id, 'sent');
      sent++;

      // Log to contact_attempts
      await supabase.from('contact_attempts').insert({
        debtor_id:  debtor.id,
        company_id: contact.company_id,
        channel:    contact.channel,
        direction:  'outbound',
        status:     'sent',
        metadata:   { ...result, layer: contact.layer, worker: true },
      });

      console.log(`[worker] Sent ${contact.channel} to debtor ${debtor.id}`);

    } catch (err) {
      console.error(`[worker] Error processing contact ${contact.id} (channel=${contact.channel}, debtor=${contact.debtor_id}):`);
      console.error(`[worker] Message: ${err.message}`);
      console.error(`[worker] Stack: ${err.stack}`);
      // 8. Mark as failed
      await markContact(contact.id, 'failed');
      failed++;
    }
  }

  const summary = {
    processed: contacts.length,
    sent,
    skipped,
    failed,
    duration: Date.now() - startedAt.getTime(),
  };
  console.log('[worker] Complete:', summary);
  return summary;
}

async function markContact(contactId, status) {
  await supabase
    .from('scheduled_contacts')
    .update({ status })
    .eq('id', contactId);
}

module.exports = { processScheduledContacts };
