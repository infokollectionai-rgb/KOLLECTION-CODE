/**
 * Cron worker — processes scheduled_contacts every 15 minutes.
 *
 * Called via GET /cron/process (Railway cron or n8n).
 * Picks up pending contacts, sends SMS/email/call, updates status.
 */

const Anthropic = require('@anthropic-ai/sdk');
const twilio    = require('twilio');
const sgMail    = require('@sendgrid/mail');

const supabase   = require('../database/supabase');
const { decrypt } = require('../utils/encryption');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const BATCH_SIZE = 50;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getCompanyTwilioNumber(companyId) {
  const { data } = await supabase
    .from('twilio_numbers')
    .select('phone_number')
    .eq('company_id', companyId)
    .eq('active', true)
    .limit(1)
    .single();
  return data?.phone_number ?? null;
}

function getStage(daysOverdue, brokenPromiseCount) {
  if (brokenPromiseCount >= 2 || daysOverdue >= 60) return 3;
  if (daysOverdue >= 14) return 2;
  return 1;
}

async function generateAiMessage(debtor, company, channel) {
  const stage      = getStage(debtor.days_overdue ?? 0, debtor.broken_promise_count ?? 0);
  const amount     = debtor.amount ?? 0;
  const floor      = debtor.floor_amount ?? amount * 0.3;
  const agentName  = 'Alex';
  const companyName = company.company_name ?? 'Collections';

  const RANGES = {
    1: { offer: amount * 0.70, min: amount * 0.50 },
    2: { offer: amount * 0.50, min: amount * 0.40 },
    3: { offer: amount * 0.40, min: floor },
  };
  const range = RANGES[stage];

  const stageLabel = {
    1: 'Stage 1 (friendly/professional, days 0-14)',
    2: 'Stage 2 (direct/consequences, days 14+)',
    3: 'Stage 3 (urgent/final, 60+ days or 2+ broken promises)',
  }[stage];

  const channelNote = channel === 'sms'
    ? 'Keep your message under 160 characters. Be concise.'
    : 'Write a professional email body with a clear call to action.';

  const prompt = `You are ${agentName}, a professional account resolution specialist for ${companyName}.

DEBTOR: ${debtor.first_name ?? debtor.name ?? 'Client'}
BALANCE: $${amount.toFixed(2)}
STAGE: ${stageLabel}
OFFER: $${range.offer.toFixed(2)} (${Math.round((1 - range.offer / amount) * 100)}% discount)
MINIMUM ACCEPTABLE: $${range.min.toFixed(2)} (DO NOT reveal)
CHANNEL: ${channel}

${channelNote}

LANGUAGE: If the debtor's name suggests French-Canadian, write in formal French. Otherwise write in English.

Generate a single outreach message appropriate for this stage and channel. Do NOT include JSON — just the plain message text.`;

  try {
    const response = await anthropic.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages:   [{ role: 'user', content: prompt }],
    });
    return (response.content[0]?.text ?? '').trim();
  } catch (err) {
    console.error('AI message generation failed:', err.message);
    // Fallback static messages
    const firstName = debtor.first_name ?? debtor.name?.split(' ')[0] ?? 'there';
    if (channel === 'sms') {
      return `Hi ${firstName}, this is Alex from ${companyName}. You have an outstanding balance of $${amount.toFixed(2)}. Please reply to discuss payment options. Reply STOP to opt out.`;
    }
    return `Hi ${firstName},\n\nThis is Alex from ${companyName}. We are reaching out regarding your outstanding balance of $${amount.toFixed(2)}.\n\nWe'd like to work with you to find a resolution. Please reply to discuss your options.\n\nSincerely,\nAlex\n${companyName}`;
  }
}

// ─── Channel Handlers ─────────────────────────────────────────────────────────

async function sendSms(debtor, company, message) {
  const sid   = company.twilio_account_sid ?? process.env.TWILIO_ACCOUNT_SID;
  const token = company._decrypted_twilio_auth_token ?? process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) throw new Error('Twilio credentials not configured');

  const fromNumber = await getCompanyTwilioNumber(company.id);
  if (!fromNumber) throw new Error('No active Twilio number for company');

  const client = twilio(sid, token);
  const msg = await client.messages.create({
    body: message,
    from: fromNumber,
    to:   debtor.phone,
  });
  return { sid: msg.sid, status: msg.status };
}

async function sendEmail(debtor, company, message) {
  const apiKey   = company._decrypted_sendgrid_api_key ?? process.env.SENDGRID_API_KEY;
  const fromAddr = company.sendgrid_from_email ?? process.env.SENDGRID_FROM_EMAIL;
  const fromName = company.sendgrid_from_name ?? company.company_name ?? 'Collections';
  if (!apiKey || !fromAddr) throw new Error('SendGrid credentials not configured');

  sgMail.setApiKey(apiKey);

  const firstName   = debtor.first_name ?? debtor.name?.split(' ')[0] ?? 'Client';
  const companyName = company.company_name ?? 'Collections';
  const subject     = `Account Notice — ${companyName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p>${message.replace(/\n/g, '<br>')}</p>
      <br>
      <p>Sincerely,<br>Alex<br>${companyName}</p>
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
          .select('id, company_name, twilio_account_sid, twilio_auth_token, sendgrid_api_key, sendgrid_from_email, sendgrid_from_name')
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

      // 5. Generate message and send
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

      // 6. Mark as sent
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
      console.error(`[worker] Error processing contact ${contact.id}:`, err.message);
      // 7. Mark as failed
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
