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

/**
 * Safely decrypt a value — only if it looks encrypted (ivHex:ciphertextHex format).
 * Returns raw value if it's already plaintext (e.g. a VAPI key starting with a normal prefix).
 */
function safeDecrypt(value) {
  if (!value) return null;
  // Encrypted format is "hexIV:hexCiphertext" — both parts are hex strings
  if (/^[0-9a-fA-F]{32}:[0-9a-fA-F]+$/.test(value)) {
    try { return decrypt(value); } catch { return value; }
  }
  return value;
}

/**
 * Check if current time is within contact hours (8AM–8PM Eastern).
 * Returns { allowed, nextWindow } where nextWindow is the next 10AM ET if outside hours.
 */
function isWithinContactHours() {
  const nowET = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const hour = nowET.getHours();
  // TODO: restore 8-20 before go-live
  if (hour >= 0 && hour < 23) return { allowed: true };
  // Next 10AM ET
  const next = new Date(nowET);
  if (hour >= 20) next.setDate(next.getDate() + 1);
  next.setHours(10, 0, 0, 0);
  return { allowed: false, nextWindow: next };
}

const FRENCH_AREA_CODES = ['514', '438', '450', '579', '418', '581', '819', '873'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildVoiceSystemPrompt({ firstName, agentName, companyName, amount, discountAmount, paymentAmount, lang }) {
  const transferNumber = process.env.TRANSFER_NUMBER || '+14502046168';

  // Bilingual prompt — the first message greets in both languages.
  // The AI detects which language the debtor responds in and continues in that language.
  return `Tu es ${agentName} de ${companyName}. Tu appelles ${firstName} par téléphone pour régler son solde de ${Number(amount).toFixed(2)}$.
You are ${agentName} from ${companyName}. You are calling ${firstName} by phone to settle their balance of $${Number(amount).toFixed(2)}.

LANGUE / LANGUAGE:
- Le premier message est bilingue. Le débiteur va répondre dans SA langue.
- Si le débiteur répond en FRANÇAIS → continue ENTIÈREMENT en français.
- Si le débiteur répond en ANGLAIS → continue ENTIÈREMENT en anglais.
- Ne mélange JAMAIS les deux langues après la première réponse du débiteur.
- Langue attendue selon le numéro: ${lang === 'fr' ? 'FRANÇAIS' : 'ENGLISH'}

FLOW DE L'APPEL / CALL FLOW:
1. Confirme l'identité / Confirm identity:
   FR: "Est-ce que je parle bien à ${firstName}?" — Si oui, continue. Si non, demande poliment de parler à ${firstName}.
   EN: "Am I speaking with ${firstName}?" — If yes, continue. If no, politely ask to speak with ${firstName}.

2. Présentation / Introduction:
   FR: "C'est ${agentName} de ${companyName}. On vous appelle parce qu'on a une offre intéressante concernant votre dossier de prêt avec nous."
   EN: "This is ${agentName} from ${companyName}. We're calling because we have an interesting offer regarding your loan file with us."

3. Options:
   FR: "On peut régler votre solde avec un rabais de ${Math.round((1 - discountAmount / Number(amount)) * 100)}%, soit ${discountAmount}$ au lieu de ${Number(amount).toFixed(2)}$. Sinon on peut organiser des paiements de ${paymentAmount}$ aux deux semaines sur le montant complet. Qu'est-ce qui vous conviendrait?"
   EN: "We can settle your balance at ${Math.round((1 - discountAmount / Number(amount)) * 100)}% off, which is $${discountAmount} instead of $${Number(amount).toFixed(2)}. Or we can set up payments of $${paymentAmount} every two weeks on the full amount. What would work best?"

4. Si accepte / If accepts:
   FR: "Parfait! Je vous envoie un lien de paiement par texto tout de suite pendant qu'on est ensemble au téléphone."
   EN: "Perfect! I'll send you a payment link by text right now while we're on the phone together."

5. Si veut réfléchir / Wants to think:
   FR: "Pas de problème! On peut vous rappeler. Quel moment serait le mieux pour vous?"
   EN: "No problem! We can call you back. What time would work best for you?"

6. Si préfère par texto / Prefers text:
   FR: "Bien sûr! Je vous envoie un message texto avec toutes les options."
   EN: "Of course! I'll send you a text message with all the options."

7. Si agressif / If aggressive:
   FR: Reste calme. "Je comprends. On essaie simplement de trouver une solution. Voici vos options..."
   EN: Stay calm. "I understand. We're simply trying to find a solution. Here are your options..."

8. Si nie la dette / If denies debt:
   FR: "On a votre dossier complet — preuves de notifications, informations bancaires, termes acceptés. Voici les options qui s'offrent à vous."
   EN: "We have your complete file — proof of notifications, banking information, accepted terms. Here are the options available to you."

RÈGLES / RULES:
- Appel de MAX 3 minutes / Call MAX 3 minutes
- Toujours rester calme et professionnel / Always stay calm and professional
- Confirmer l'identité au début / Confirm identity at the start
- Offrir les deux options (rabais OU plan) / Offer both options (discount OR plan)
- Si entente: envoyer le lien par SMS PENDANT l'appel / If agreement: send payment link by SMS DURING the call
- Si le client veut raccrocher: proposer de continuer par texto / If client wants to hang up: offer to continue by text
- Si aucune entente: "On va vous envoyer un message avec les détails. Bonne journée!" / "We'll send you a message with the details. Have a great day!"
- JAMAIS menacer pendant un appel (saisie de salaire = seulement par SMS au Stage 3) / NEVER threaten during a call
- JAMAIS utiliser M./Mme ou Mr./Mrs., utilise le PRÉNOM seulement / NEVER use formal titles, FIRST NAME only
- En dernier recours: transférer au / Last resort: transfer to ${transferNumber}`;
}

function detectLanguage(debtor) {
  // Use explicit language field if set on debtor record
  if (debtor?.language === 'fr' || debtor?.language === 'en') return debtor.language;
  // Fallback to phone area code detection
  const phone = typeof debtor === 'string' ? debtor : debtor?.phone;
  if (!phone) return 'en';
  const digits = phone.replace(/\D/g, '');
  const areaCode = digits.startsWith('1') ? digits.slice(1, 4) : digits.slice(0, 3);
  return FRENCH_AREA_CODES.includes(areaCode) ? 'fr' : 'en';
}

function buildFirstContactMessage(debtor, company) {
  const firstName   = debtor.first_name ?? debtor.name?.split(' ')[0] ?? 'Client';
  const agentName   = company.voice_agent_name ?? company.company_name ?? 'Sophie';
  const companyName = company.company_name ?? 'Collections';
  const lang        = detectLanguage(debtor);

  if (lang === 'fr') {
    return `Bonjour ${firstName}! C'est ${agentName} de ${companyName}. J'ai une bonne nouvelle concernant votre dossier de prêt avec nous. On a quelque chose d'intéressant à vous proposer. Vous avez deux minutes?`;
  }
  return `Hey ${firstName}! It's ${agentName} from ${companyName}. I've got some good news regarding your loan file with us. We have something interesting to offer you. Got a couple minutes?`;
}

function postProcessMessage(text) {
  let cleaned = text;
  // Remove formal titles
  cleaned = cleaned.replace(/\bM\.\/?Mme\s*/g, '');
  cleaned = cleaned.replace(/\bMr\.\/?Mrs\.\s*/g, '');
  cleaned = cleaned.replace(/\bM\.\s+/g, '');
  cleaned = cleaned.replace(/\bMme\s+/g, '');
  cleaned = cleaned.replace(/\bMr\.\s+/g, '');
  cleaned = cleaned.replace(/\bMrs\.\s+/g, '');
  cleaned = cleaned.replace(/\bMs\.\s+/g, '');
  // Clean up double spaces
  cleaned = cleaned.replace(/  +/g, ' ').trim();
  return cleaned;
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
  const amount      = debtor.amount ?? 0;
  const companyName = company.company_name ?? 'Collections';
  const agentName   = company.voice_agent_name ?? 'Sophie';
  const firstName   = debtor.first_name ?? debtor.name?.split(' ')[0] ?? 'Client';
  const lang        = detectLanguage(debtor);
  const discountPct = company.discount_percent ?? 50;
  const discountAmt = Number(amount * (1 - discountPct / 100)).toFixed(2);

  // NOTE: This function is ONLY called for layer 2+ messages.
  // Layer 1 uses the hardcoded template via buildFirstContactMessage().

  const systemPrompt = lang === 'fr'
    ? `Tu es ${agentName}, un spécialiste de résolution de dettes chez ${companyName}. Tu écris des SMS conversationnels et courts. Tu ne parles jamais comme un robot corporatif. Tu utilises TOUJOURS le PRÉNOM seulement — JAMAIS M./Mme, Mr./Mrs., ou tout titre formel.`
    : `You are ${agentName}, a debt resolution specialist at ${companyName}. You write short, conversational SMS messages. You never sound like a corporate robot. You ALWAYS use FIRST NAME only — NEVER M./Mme, Mr./Mrs., or any formal title.`;

  let userPrompt;

  if (lang === 'fr') {
    userPrompt = `Tu es ${agentName} de ${companyName}. Tu fais un suivi avec ${firstName} par ${channel === 'sms' ? 'SMS' : 'courriel'}. Son solde est de ${amount.toFixed(2)}$.

Écris UN SEUL ${channel === 'sms' ? 'SMS' : 'courriel'} de suivi. Le message DOIT:
- Utiliser le PRÉNOM "${firstName}" seulement — JAMAIS M./Mme ou tout titre formel
- Mentionner le solde de ${amount.toFixed(2)}$
- Offrir deux options: rabais de ${discountPct}% (${discountAmt}$ au lieu de ${amount.toFixed(2)}$) OU entente de paiement flexible sur le montant complet
- Être conversationnel et chaleureux
- Être entièrement en FRANÇAIS
- Faire MOINS de 300 caractères
- Ne JAMAIS dire "contactez-nous", "répondez à ce message", "Reply YES", "Répondez OUI", "impayé", "souffrance"

Exemple: "${firstName}, concernant votre solde de ${amount.toFixed(2)}$ avec ${companyName}, on peut régler avec ${discountPct}% de rabais (${discountAmt}$ au lieu de ${amount.toFixed(2)}$) ou des paiements réduits sur le montant complet. Qu'est-ce qui marcherait le mieux?"

Écris SEULEMENT le ${channel === 'sms' ? 'SMS' : 'courriel'}, rien d'autre.`;
  } else {
    userPrompt = `You are ${agentName} from ${companyName}. You are following up with ${firstName} by ${channel === 'sms' ? 'SMS' : 'email'}. Their balance is $${amount.toFixed(2)}.

Write ONE ${channel === 'sms' ? 'SMS' : 'email'} follow-up message. The message MUST:
- Use FIRST NAME "${firstName}" only — NEVER Mr./Mrs. or any formal title
- Mention the balance of $${amount.toFixed(2)}
- Offer two options: ${discountPct}% discount ($${discountAmt} instead of $${amount.toFixed(2)}) OR flexible payment plan on the full amount
- Be conversational and warm
- Be entirely in ENGLISH
- Be UNDER 300 characters
- NEVER say "contact us", "call us", "Reply YES", "opt out", "overdue", "unpaid"

Example: "${firstName}, regarding your $${amount.toFixed(2)} balance with ${companyName}, we can settle at ${discountPct}% off ($${discountAmt} instead of $${amount.toFixed(2)}) or set up reduced payments on the full amount. What would work best?"

Write ONLY the ${channel === 'sms' ? 'SMS' : 'email'}, nothing else.`;
  }

  try {
    const response = await anthropic.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 300,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
    });
    return postProcessMessage((response.content[0]?.text ?? '').trim());
  } catch (err) {
    console.error('[worker] AI message generation failed:', err.message);
    // Fallback static messages — first name only, no formal titles
    if (lang === 'fr') {
      if (channel === 'sms') {
        return `Salut ${firstName}, c'est ${agentName} de ${companyName}. Concernant votre solde de ${amount.toFixed(2)}$, on peut régler avec ${discountPct}% de rabais (${discountAmt}$) ou des paiements flexibles. Qu'est-ce qui marcherait le mieux?`;
      }
      return `Bonjour ${firstName},\n\nC'est ${agentName} de ${companyName}. Concernant votre solde de ${amount.toFixed(2)}$, on peut régler avec ${discountPct}% de rabais (${discountAmt}$ au lieu de ${amount.toFixed(2)}$) ou des paiements flexibles sur le montant complet.\n\nQu'est-ce qui marcherait le mieux?\n\n${agentName}\n${companyName}`;
    }
    if (channel === 'sms') {
      return `Hey ${firstName}, it's ${agentName} from ${companyName}. Regarding your $${amount.toFixed(2)} balance, we can settle at ${discountPct}% off ($${discountAmt}) or set up flexible payments. What works best?`;
    }
    return `Hey ${firstName},\n\nIt's ${agentName} from ${companyName}. Regarding your $${amount.toFixed(2)} balance, we can settle at ${discountPct}% off ($${discountAmt} instead of $${amount.toFixed(2)}) or set up flexible payments on the full amount.\n\nWhat would work best?\n\n${agentName}\n${companyName}`;
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

async function sendEmail(debtor, company, message, { paymentLinkUrl, layer } = {}) {
  // TODO: revert to company._decrypted_sendgrid_api_key once encryption is fixed
  const apiKey   = process.env.SENDGRID_API_KEY;
  const fromAddr = company.sendgrid_from_email ?? process.env.SENDGRID_FROM_EMAIL;
  const fromName = company.sendgrid_from_name ?? company.company_name ?? 'Collections';
  if (!apiKey || !fromAddr) throw new Error('SendGrid credentials not configured');

  sgMail.setApiKey(apiKey);

  const companyName = company.company_name ?? 'Collections';
  const lang        = detectLanguage(debtor);

  const subject = lang === 'fr'
    ? `${companyName} - Information importante concernant votre dossier`
    : `${companyName} - Important information regarding your file`;

  // Build payment button HTML (only for layer > 1 when a link is available)
  const paymentButton = (layer > 1 && paymentLinkUrl)
    ? `<div style="text-align:center;margin:24px 0;">
        <a href="${paymentLinkUrl}" style="display:inline-block;background:#2563EB;color:#ffffff;font-size:16px;font-weight:bold;padding:14px 32px;border-radius:8px;text-decoration:none;">
          ${lang === 'fr' ? 'PAYER MAINTENANT' : 'PAY NOW'}
        </a>
      </div>`
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;">
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;margin-top:24px;margin-bottom:24px;">
    <div style="background:#1e293b;padding:24px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:22px;">${companyName}</h1>
    </div>
    <div style="padding:32px 24px;">
      <p style="font-size:15px;line-height:1.6;color:#374151;margin:0 0 16px;">
        ${message.replace(/\n/g, '<br>')}
      </p>
      ${paymentButton}
    </div>
    <div style="background:#f8fafc;padding:16px 24px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="font-size:12px;color:#94a3b8;margin:0;">${companyName}</p>
    </div>
  </div>
</body>
</html>`.trim();

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
  // Contact hours check: only call 8AM–8PM Eastern
  const hours = isWithinContactHours();
  if (!hours.allowed) {
    console.log(`[worker:call] Outside contact hours for debtor ${debtor.id}, rescheduling to ${hours.nextWindow.toISOString()}`);
    return { status: 'rescheduled', scheduledFor: hours.nextWindow.toISOString() };
  }

  const vapiKey     = company._decrypted_vapi_api_key ?? process.env.VAPI_API_KEY;
  const assistantId = company._decrypted_vapi_assistant_id ?? process.env.VAPI_ASSISTANT_ID;

  if (!vapiKey) {
    console.error(`[worker:call] VAPI API key not configured for company ${company.id}`);
    throw new Error('VAPI API key not configured');
  }

  const firstName   = debtor.first_name || debtor.name?.split(' ')[0] || 'Client';
  const companyName = company.company_name || 'Collections';
  const agentName   = company.voice_agent_name || 'Sophie';
  const lang        = detectLanguage(debtor);
  const amount      = debtor.amount ?? 0;
  const discountAmount = Number(amount * 0.70).toFixed(2);
  const paymentAmount  = Math.round(amount * 0.7 / 8);

  const payload = {
    assistantId,
    customer: { number: debtor.phone },
    assistantOverrides: {
      firstMessage: `Bonjour, est-ce que je parle bien à ${firstName}? Hi, am I speaking with ${firstName}?`,
      model: {
        provider: 'anthropic',
        model:    'claude-sonnet-4-20250514',
        systemPrompt: buildVoiceSystemPrompt({ firstName, agentName, companyName, amount, discountAmount, paymentAmount, lang }),
      },
      variableValues: {
        debtorFirstName: firstName,
        companyName,
        amountOwed:      amount,
        agentName,
        language:        lang === 'fr' ? 'French' : 'English',
      },
    },
    metadata: {
      debtorId:  debtor.id,
      companyId: company.id,
    },
  };

  // Only include phoneNumberId if set in env
  if (process.env.VAPI_PHONE_NUMBER_ID) {
    payload.phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
  }

  console.log(`[worker:call] Initiating VAPI call — debtor=${debtor.id}, phone=${debtor.phone}, assistant=${assistantId}`);

  const vapiRes = await fetch('https://api.vapi.ai/call/phone', {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${vapiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!vapiRes.ok) {
    const errBody = await vapiRes.text().catch(() => '');
    console.error(`[worker:call] VAPI error ${vapiRes.status}: ${errBody}`);
    throw new Error(`VAPI call failed (${vapiRes.status}): ${errBody}`);
  }

  const callData = await vapiRes.json();
  console.log(`[worker:call] VAPI call initiated — callId=${callData.id}, status=${callData.status}`);
  return { status: 'initiated', call_id: callData.id, vapi_status: callData.status };
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
        .select('id, name, first_name, phone, email, amount, floor_amount, tier, days_overdue, cease_desist, broken_promise_count, language')
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
          .select('id, company_name, business_phone, voice_agent_name, twilio_account_sid, twilio_auth_token, sendgrid_api_key, sendgrid_from_email, sendgrid_from_name, vapi_api_key, vapi_assistant_id, discount_percent')
          .eq('id', contact.company_id)
          .single();

        if (companyError || !company) {
          console.warn(`[worker] Company ${contact.company_id} not found, skipping`);
          await markContact(contact.id, 'failed');
          failed++;
          continue;
        }

        // 4. Decrypt credentials (safeDecrypt handles already-plaintext values)
        companyCache[contact.company_id] = {
          ...company,
          _decrypted_twilio_auth_token: safeDecrypt(company.twilio_auth_token),
          _decrypted_sendgrid_api_key:  safeDecrypt(company.sendgrid_api_key),
          _decrypted_vapi_api_key:      safeDecrypt(company.vapi_api_key),
          _decrypted_vapi_assistant_id:  safeDecrypt(company.vapi_assistant_id),
        };
      }

      const company = companyCache[contact.company_id];

      // 6. Generate message and send
      // Layer 1 = hardcoded curiosity hook (NO AI). Layer 2+ = AI generation.
      // Payment links are NOT generated for outreach messages.
      let result;

      console.log('[worker] Using', contact.layer === 1 ? 'HARDCODED template' : 'AI generation', 'for debtor', debtor.id, 'layer', contact.layer);

      if (contact.channel === 'sms') {
        const message = contact.layer === 1
          ? buildFirstContactMessage(debtor, company)
          : await generateAiMessage(debtor, company, 'sms');
        result = await sendSms(debtor, company, message);

      } else if (contact.channel === 'email') {
        const message = contact.layer === 1
          ? buildFirstContactMessage(debtor, company)
          : await generateAiMessage(debtor, company, 'email');
        result = await sendEmail(debtor, company, message, { layer: contact.layer });

      } else if (contact.channel === 'call') {
        result = await initiateCall(debtor, company);

        // If call was rescheduled due to contact hours, update the scheduled_for and skip
        if (result.status === 'rescheduled') {
          await supabase
            .from('scheduled_contacts')
            .update({ scheduled_for: result.scheduledFor })
            .eq('id', contact.id);
          skipped++;
          continue;
        }

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

  // ─── Total Loss Check ─────────────────────────────────────────────────────
  // Debtors with no payment AND no response after 45 days → mark as total loss.
  // BUT if they made at least 1 payment (any amount) → NEVER mark as total loss.
  try {
    const cutoff45 = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();
    const { data: lossEligible } = await supabase
      .from('debtors')
      .select('id')
      .eq('total_loss_eligible', false)
      .eq('cease_desist', false)
      .lte('created_at', cutoff45)
      .gt('amount', 0);

    if (lossEligible?.length) {
      for (const d of lossEligible) {
        // Check if any payment exists
        const { count: paymentCount } = await supabase
          .from('payments')
          .select('id', { count: 'exact', head: true })
          .eq('debtor_id', d.id);

        if (paymentCount > 0) continue; // Has payment — never mark as total loss

        // Check if any inbound conversation (debtor responded)
        const { count: responseCount } = await supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .eq('debtor_id', d.id)
          .eq('direction', 'inbound');

        if (responseCount > 0) continue; // Debtor responded — not total loss

        // No payment + no response after 45 days → total loss
        await supabase.from('debtors').update({ total_loss_eligible: true }).eq('id', d.id);
        console.log(`[worker] Debtor ${d.id} marked as total loss (45 days, no payment, no response)`);
      }
    }
  } catch (lossErr) {
    console.error('[worker] Total loss check error:', lossErr.message);
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

module.exports = { processScheduledContacts, generatePaymentLink, buildVoiceSystemPrompt };
// force redeploy
