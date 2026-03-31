/**
 * Worker service — processes scheduled contacts from the queue.
 *
 * Picks up due items from `scheduled_contacts`, sends via the appropriate
 * channel (SMS / email / call), and updates status.
 */

const Anthropic  = require('@anthropic-ai/sdk');
const twilio     = require('twilio');
const sgMail     = require('@sendgrid/mail');

const supabase              = require('../database/supabase');
const { decrypt }           = require('../utils/encryption');
const { checkContactAllowed } = require('../middleware/compliance');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractFirstName(debtor) {
  if (debtor?.first_name) return debtor.first_name;
  const name = debtor?.name ?? '';
  return name.split(' ')[0] || 'there';
}

const QUEBEC_AREA_CODES = ['514', '438', '450', '579', '418', '581', '819', '873'];

function isQuebecNumber(phone) {
  if (!phone) return true; // Default to French
  const digits = phone.replace(/\D/g, '');
  // Handle +1XXXXXXXXXX or 1XXXXXXXXXX or XXXXXXXXXX
  const areaCode = digits.length === 11 && digits[0] === '1'
    ? digits.substring(1, 4)
    : digits.substring(0, 3);
  return QUEBEC_AREA_CODES.includes(areaCode);
}

function buildFirstContactMessage(firstName, agentName, companyName, phone) {
  if (isQuebecNumber(phone)) {
    return `Bonjour ${firstName}! C'est ${agentName} de ${companyName}. J'ai une bonne nouvelle concernant votre dossier de prêt avec nous. On a quelque chose d'intéressant à vous proposer. Vous avez deux minutes?`;
  }
  return `Hey ${firstName}! It's ${agentName} from ${companyName}. I've got some good news regarding your loan file with us. We have something interesting to offer you. Got a couple minutes?`;
}

function postProcessMessage(text, isFirst) {
  let cleaned = text;
  // Remove formal titles
  cleaned = cleaned.replace(/\bM\.\s*/g, '');
  cleaned = cleaned.replace(/\bMme\s*/g, '');
  cleaned = cleaned.replace(/\bMr\.\s*/g, '');
  cleaned = cleaned.replace(/\bMrs\.\s*/g, '');
  cleaned = cleaned.replace(/\bMs\.\s*/g, '');
  // Clean up double spaces left behind
  cleaned = cleaned.replace(/  +/g, ' ').trim();

  if (isFirst) {
    // Remove dollar amounts: $500, $500.00, 500$, 500.00$
    cleaned = cleaned.replace(/\$\s?\d[\d\s,.]*\d*/g, '');
    cleaned = cleaned.replace(/\d[\d\s,.]*\d*\s?\$/g, '');
    // Remove stray "de  avec" left after amount removal
    cleaned = cleaned.replace(/\bde\s+avec\b/g, 'avec');
    cleaned = cleaned.replace(/  +/g, ' ').trim();
  }

  return cleaned;
}

async function getCompanyCreds(companyId) {
  const { data, error } = await supabase
    .from('client_companies')
    .select('*')
    .eq('id', companyId)
    .single();
  if (error || !data) throw new Error('Company not found');
  return {
    ...data,
    twilio_auth_token: data.twilio_auth_token ? decrypt(data.twilio_auth_token) : null,
    sendgrid_api_key:  data.sendgrid_api_key  ? decrypt(data.sendgrid_api_key)  : null,
  };
}

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

// ─── Determine if this is the first message to a debtor ──────────────────────

async function isFirstContact(debtorId, companyId) {
  const { count } = await supabase
    .from('contact_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('debtor_id', debtorId)
    .eq('company_id', companyId)
    .eq('direction', 'outbound');
  return (count ?? 0) === 0;
}

// ─── Check if debtor responded to the first message ─────────────────────────

async function debtorHasResponded(debtorId, companyId) {
  const { count } = await supabase
    .from('contact_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('debtor_id', debtorId)
    .eq('company_id', companyId)
    .eq('direction', 'inbound');
  return (count ?? 0) > 0;
}

// ─── Build the AI system prompt for the worker ──────────────────────────────

function buildWorkerPrompt({ debtor, company, isFirst, hasResponded }) {
  const firstName   = extractFirstName(debtor);
  const agentName   = company.agent_name ?? 'Alex';
  const companyName = company.name ?? company.company_name ?? 'our company';
  const balance     = debtor.balance ?? debtor.amount ?? 0;
  const tier        = Math.min(Math.max(parseInt(debtor.tier ?? 1, 10), 1), 4);

  if (isFirst) {
    // FIRST MESSAGE: Curiosity hook — NO amount, NO negative debt language
    return `You are ${agentName}, a friendly debt resolution specialist at ${companyName}.

TASK: Write the FIRST outreach message to ${firstName}. This is a curiosity hook to get them to respond.

STRICT RULES FOR THIS FIRST MESSAGE:
- Use FIRST NAME only: "${firstName}" — NEVER use M./Mme, Mr./Mrs., or any formal title
- Frame as GOOD NEWS about their "dossier de prêt" / "loan file"
- NEVER mention: the amount, balance, "impayé", "overdue", "souffrance", "en retard", "dette", "debt", or any negative language
- Keep it conversational — like texting someone about something they'd want to hear
- Make them curious and want to respond

Example (French):
"Bonjour ${firstName}! C'est ${agentName} de ${companyName}. J'ai une bonne nouvelle concernant votre dossier de prêt avec nous. On a quelque chose d'intéressant à vous proposer. Vous avez deux minutes?"

Example (English):
"Hey ${firstName}! It's ${agentName} from ${companyName}. I've got some good news about your loan file with us. We have something interesting to offer you. Got a couple minutes?"

Write the message in French by default. Keep it short and casual.`;
  }

  if (!hasResponded) {
    // FOLLOW-UP when debtor hasn't responded — still friendly, no amount
    return `You are ${agentName}, a friendly debt resolution specialist at ${companyName}.

TASK: Write a friendly follow-up to ${firstName} who hasn't responded to your first message.

RULES:
- Use FIRST NAME only: "${firstName}" — NEVER use M./Mme, Mr./Mrs., or any formal title
- Stay friendly and casual — not pushy
- Mention you reached out about their "dossier de prêt" / "loan file"
- DO NOT mention the amount, "impayé", "overdue", or any negative language
- Offer that you have something advantageous for them

Example (French):
"Salut ${firstName}, c'est encore ${agentName} de ${companyName}. Je vous ai écrit concernant votre dossier de prêt. On a une offre avantageuse pour vous. Faites-moi signe quand vous avez une minute!"

Write in French by default. Keep it short and warm.`;
  }

  // MESSAGE 2+: Debtor has responded — now reveal details with options
  const amtStr = `$${Number(balance).toFixed(2)}`;
  const floorAmount = debtor.floor ?? balance * 0.3;
  const RANGES = {
    1: { min: balance * 0.85, max: balance },
    2: { min: balance * 0.65, max: balance * 0.90 },
    3: { min: balance * 0.50, max: balance * 0.75 },
    4: { min: floorAmount,    max: balance * 0.60 },
  };
  const range = RANGES[tier];

  return `You are ${agentName}, a friendly debt resolution specialist at ${companyName}.

TASK: The debtor ${firstName} has responded. Now present the details and options.

Negotiation parameters:
- Outstanding balance: ${amtStr}
- Acceptable settlement range: $${range.min.toFixed(2)}–$${range.max.toFixed(2)} (DO NOT disclose this range)
- Collection stage: Tier ${tier}

RULES:
- Use FIRST NAME only: "${firstName}" — NEVER use M./Mme, Mr./Mrs., or any formal title
- Thank them for responding
- Present two options: flexible payment plan OR a discount to close the file
- Be conversational and warm
- Never threaten, harass, or use aggressive language
- Comply with FDCPA and Canadian collection regulations
- If they invoke cease and desist, acknowledge immediately and stop
- Do not accept offers below $${range.min.toFixed(2)}
- Do not reveal the floor or range

Example (French):
"Merci de répondre! Donc concernant votre solde de ${amtStr} avec ${companyName}, on a deux options pour vous: une entente de paiement très flexible ou bien un rabais intéressant pour fermer le dossier une fois pour toutes. Qu'est-ce qui marcherait le mieux pour vous?"

Write in French by default.`;
}

// ─── Process a single scheduled contact ─────────────────────────────────────

async function processScheduledContact(contact) {
  const { debtor_id, company_id, channel, metadata } = contact;

  // Load debtor and company
  const { data: debtor } = await supabase
    .from('debtors')
    .select('*')
    .eq('id', debtor_id)
    .single();
  if (!debtor) {
    console.error(`Worker: debtor ${debtor_id} not found`);
    return;
  }

  if (debtor.ai_paused || debtor.human_takeover) {
    console.log(`Worker: debtor ${debtor_id} is paused or in human takeover, skipping`);
    return;
  }

  const compliance = await checkContactAllowed(debtor_id, channel);
  if (!compliance.allowed) {
    console.log(`Worker: compliance block for ${debtor_id}: ${compliance.reason}`);
    return;
  }

  const creds       = await getCompanyCreds(company_id);
  const firstName   = extractFirstName(debtor);
  const agentName   = creds.agent_name ?? 'Alex';
  const companyName = creds.name ?? creds.company_name ?? '';
  const hasResponded = await debtorHasResponded(debtor_id, company_id);

  console.log('[worker] Using', contact.layer === 1 ? 'HARDCODED template' : 'AI generation', 'for debtor', debtor_id);

  let messageText;

  if (contact.layer === 1) {
    // ALWAYS use hardcoded template for layer 1 (first contact) — NO AI generation
    messageText = buildFirstContactMessage(firstName, agentName, companyName, debtor.phone);
  } else {
    // Layer 2+: Use AI for follow-ups and negotiations
    const systemPrompt = buildWorkerPrompt({
      debtor,
      company: creds,
      isFirst: false,
      hasResponded,
    });

    const aiResponse = await anthropic.messages.create({
      model:      'claude-sonnet-4-6-20250514',
      max_tokens: 512,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: 'Write the message now.' }],
    });

    messageText = postProcessMessage(aiResponse.content[0]?.text ?? '', false);
  }

  // Send via the appropriate channel
  if (channel === 'sms') {
    const fromNumber = await getCompanyTwilioNumber(company_id);
    if (!fromNumber) {
      console.error(`Worker: no Twilio number for company ${company_id}`);
      return;
    }

    const sid    = creds.twilio_account_sid ?? process.env.TWILIO_ACCOUNT_SID;
    const token  = creds.twilio_auth_token  ?? process.env.TWILIO_AUTH_TOKEN;
    const client = twilio(sid, token);

    await client.messages.create({
      body: messageText,
      from: fromNumber,
      to:   debtor.phone,
    });
  } else if (channel === 'email') {
    const apiKey   = creds.sendgrid_api_key ?? process.env.SENDGRID_API_KEY;
    const fromAddr = creds.sendgrid_from_email ?? process.env.SENDGRID_FROM_EMAIL;
    sgMail.setApiKey(apiKey);

    const subject = contact.layer === 1
      ? `Bonne nouvelle — ${companyName}`
      : `Vos options — ${companyName}`;

    await sgMail.send({
      to:      debtor.email,
      from:    fromAddr,
      subject,
      text:    messageText,
    });
  }

  // Log the contact attempt
  await supabase.from('contact_attempts').insert({
    debtor_id,
    company_id,
    channel,
    direction: 'outbound',
    status:    'sent',
    metadata:  { ai_generated: contact.layer !== 1, layer: contact.layer, template: contact.layer === 1 ? 'hardcoded_hook' : 'ai' },
  });

  // Update debtor last contact
  await supabase.from('debtors').update({
    last_contact_at:      new Date().toISOString(),
    last_contact_channel: channel,
  }).eq('id', debtor_id);

  console.log(`Worker: sent ${channel} to debtor ${debtor_id} (layer: ${contact.layer})`);
}

// ─── Main loop: pick up due scheduled contacts ─────────────────────────────

async function runWorkerCycle() {
  const now = new Date().toISOString();

  const { data: dueContacts, error } = await supabase
    .from('scheduled_contacts')
    .select('*')
    .lte('scheduled_at', now)
    .eq('status', 'pending')
    .order('scheduled_at', { ascending: true })
    .limit(50);

  if (error) {
    console.error('Worker: failed to fetch scheduled contacts', error);
    return;
  }

  if (!dueContacts?.length) return;

  console.log(`Worker: processing ${dueContacts.length} scheduled contacts`);

  for (const contact of dueContacts) {
    try {
      // Mark as processing
      await supabase
        .from('scheduled_contacts')
        .update({ status: 'processing' })
        .eq('id', contact.id);

      await processScheduledContact(contact);

      // Mark as completed
      await supabase
        .from('scheduled_contacts')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', contact.id);
    } catch (err) {
      console.error(`Worker: error processing contact ${contact.id}:`, err);
      await supabase
        .from('scheduled_contacts')
        .update({ status: 'failed', metadata: { ...contact.metadata, error: err.message } })
        .eq('id', contact.id);
    }
  }
}

// ─── Start worker with interval ─────────────────────────────────────────────

function startWorker(intervalMs = 60_000) {
  console.log(`Worker started — polling every ${intervalMs / 1000}s`);
  runWorkerCycle(); // Run immediately on start
  return setInterval(runWorkerCycle, intervalMs);
}

module.exports = { startWorker, runWorkerCycle, processScheduledContact, extractFirstName, buildWorkerPrompt, buildFirstContactMessage, postProcessMessage, isQuebecNumber };
