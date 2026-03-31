const express    = require('express');
const router     = express.Router();
const Anthropic  = require('@anthropic-ai/sdk');
const twilio     = require('twilio');
const sgMail     = require('@sendgrid/mail');
const { v4: uuidv4 } = require('uuid');

const supabase                 = require('../database/supabase');
const { checkContactAllowed }  = require('../middleware/compliance');
const { decrypt }              = require('../utils/encryption');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// TODO: restore requireAuth on all endpoints once frontend and backend share the same Supabase project.

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function resolveCompanyId(bodyCompanyId) {
  if (bodyCompanyId) return bodyCompanyId;
  const { data: firstCompany } = await supabase
    .from('client_companies')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();
  return firstCompany?.id ?? null;
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
    vapi_api_key:      data.vapi_api_key      ? decrypt(data.vapi_api_key)      : null,
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

function buildSmsBody({ debtorName, amount, companyName, agentName, tier }) {
  const first   = debtorName?.split(' ')[0] ?? 'there';
  const amtStr  = amount ? `$${Number(amount).toFixed(2)}` : 'an outstanding balance';
  const urgency = tier >= 3 ? 'urgent ' : '';
  return (
    `Hi ${first}, this is ${agentName ?? 'Alex'} from ${companyName}. ` +
    `You have an ${urgency}outstanding balance of ${amtStr}. ` +
    `Please reply to discuss your repayment options. Reply STOP to opt out.`
  );
}

function buildEmailContent({ debtorName, amount, companyName, agentName, tier }) {
  const first   = debtorName?.split(' ')[0] ?? 'there';
  const amtStr  = amount ? `$${Number(amount).toFixed(2)}` : 'your outstanding balance';
  const urgency = tier >= 3 ? 'URGENT: ' : '';
  const subject = `${urgency}Account Notice — ${companyName}`;
  const text =
    `Hi ${first},\n\n` +
    `My name is ${agentName ?? 'Alex'} from ${companyName}. ` +
    `We are reaching out regarding your outstanding balance of ${amtStr}.\n\n` +
    `We want to work with you to find a resolution. Please reply to this email ` +
    `or contact us directly to discuss your repayment options.\n\n` +
    `Sincerely,\n${agentName ?? 'Alex'}\n${companyName}`;
  const html =
    `<p>Hi ${first},</p>` +
    `<p>My name is <strong>${agentName ?? 'Alex'}</strong> from <strong>${companyName}</strong>. ` +
    `We are reaching out regarding your outstanding balance of <strong>${amtStr}</strong>.</p>` +
    `<p>We want to work with you to find a resolution. Please reply to this email ` +
    `or contact us directly to discuss your repayment options.</p>` +
    `<p>Sincerely,<br>${agentName ?? 'Alex'}<br>${companyName}</p>`;
  return { subject, text, html };
}

// ─── POST /agents/outreach/send ───────────────────────────────────────────────

router.post('/outreach/send', async (req, res) => {
  const { debtorId, debtorName, phone, email, channel, amount, tier, companyName, agentName, companyId } = req.body;

  if (!debtorId || !channel) {
    return res.status(400).json({ error: 'debtorId and channel are required' });
  }

  const compliance = await checkContactAllowed(debtorId, channel);
  if (!compliance.allowed) {
    return res.status(403).json({ error: compliance.reason, code: 'COMPLIANCE_BLOCK' });
  }

  try {
    const resolvedCompanyId = await resolveCompanyId(companyId);
    if (!resolvedCompanyId) {
      return res.status(400).json({ error: 'No companyId provided and no companies exist yet' });
    }

    const creds     = await getCompanyCreds(resolvedCompanyId);
    const attemptId = uuidv4();
    let   deliveryMeta = {};

    if (channel === 'sms') {
      if (!phone) return res.status(400).json({ error: 'phone is required for SMS' });

      const fromNumber = process.env.TWILIO_DEFAULT_NUMBER ?? await getCompanyTwilioNumber(resolvedCompanyId);
      if (!fromNumber) return res.status(400).json({ error: 'No Twilio number configured — set TWILIO_DEFAULT_NUMBER' });

      const sid    = creds.twilio_account_sid ?? process.env.TWILIO_ACCOUNT_SID;
      const token  = creds.twilio_auth_token  ?? process.env.TWILIO_AUTH_TOKEN;
      const client = twilio(sid, token);

      const msg = await client.messages.create({
        body: buildSmsBody({ debtorName, amount, companyName, agentName, tier }),
        from: fromNumber,
        to:   phone,
      });
      deliveryMeta = { sid: msg.sid, status: msg.status };

    } else if (channel === 'email') {
      if (!email) return res.status(400).json({ error: 'email is required for email outreach' });

      const apiKey   = creds.sendgrid_api_key   ?? process.env.SENDGRID_API_KEY;
      const fromAddr = creds.sendgrid_from_email ?? process.env.SENDGRID_FROM_EMAIL;
      sgMail.setApiKey(apiKey);

      const content = buildEmailContent({ debtorName, amount, companyName, agentName, tier });
      const [result] = await sgMail.send({
        to:      email,
        from:    fromAddr,
        subject: content.subject,
        text:    content.text,
        html:    content.html,
      });
      deliveryMeta = { statusCode: result.statusCode };

    } else {
      return res.status(400).json({ error: `Unsupported channel: ${channel}` });
    }

    await supabase.from('contact_attempts').insert({
      id:         attemptId,
      debtor_id:  debtorId,
      company_id: resolvedCompanyId,
      channel,
      direction:  'outbound',
      status:     'sent',
      metadata:   deliveryMeta,
    });

    res.json({ success: true, attemptId, channel, result: deliveryMeta });
  } catch (err) {
    console.error('Outreach send error:', err);
    res.status(500).json({ error: err.message ?? 'Outreach failed' });
  }
});

// ─── POST /agents/negotiation/suggest ─────────────────────────────────────────

router.post('/negotiation/suggest', async (req, res) => {
  const {
    debtorId,
    debtorPhone,
    conversationHistory = [],
    tier    = 1,
    amount,
    floor,
    companyName,
    agentName = 'Alex',
    companyId,
    paymentLinkUrl,
  } = req.body;

  if (!debtorId || amount === undefined || amount === null) {
    return res.status(400).json({ error: 'debtorId and amount are required' });
  }

  const resolvedCompanyId = await resolveCompanyId(companyId);
  if (!resolvedCompanyId) {
    return res.status(400).json({ error: 'No companyId provided and no companies exist yet' });
  }

  // Fetch company details
  const { data: companyRecord } = await supabase
    .from('client_companies')
    .select('business_phone, company_name, voice_agent_name')
    .eq('id', resolvedCompanyId)
    .single();

  // Fetch debtor for name details
  const { data: debtorRecord } = await supabase
    .from('debtors')
    .select('name, first_name')
    .eq('id', debtorId)
    .single();

  const floorAmount = floor ?? amount * 0.3;
  const clientCompanyName = companyName ?? companyRecord?.company_name ?? 'a collections agency';
  const resolvedAgentName = companyRecord?.voice_agent_name ?? agentName;
  const debtorFirstName = debtorRecord?.first_name ?? debtorRecord?.name?.split(' ')[0] ?? 'Client';
  const debtorLastName = debtorRecord?.name?.split(' ').slice(1).join(' ') ?? '';

  // Detect language from debtor phone area code
  const FRENCH_AREA_CODES = ['514', '438', '450', '579', '418', '581', '819', '873'];
  const phoneDigits = (debtorPhone ?? '').replace(/\D/g, '');
  const areaCode = phoneDigits.startsWith('1') ? phoneDigits.slice(1, 4) : phoneDigits.slice(0, 3);
  const lang = FRENCH_AREA_CODES.includes(areaCode) ? 'fr' : 'en';

  // Stage-based settlement ranges matching partner strategy
  const RANGES = {
    1: { offer: amount * 0.70, min: amount * 0.50, max: amount },
    2: { offer: amount * 0.50, min: amount * 0.40, max: amount * 0.70 },
    3: { offer: amount * 0.40, min: floorAmount,   max: amount * 0.50 },
    4: { offer: amount * 0.40, min: floorAmount,   max: amount * 0.50 },
  };
  const range = RANGES[Math.min(tier, 4)];

  const systemPrompt = `You are ${resolvedAgentName}, a real person working for ${clientCompanyName}. You're texting a debtor to help them resolve their balance. Write like a real human having an SMS conversation — casual, direct, friendly but professional. No corporate speak.

YOUR NAME: ${resolvedAgentName}
DEBTOR: ${debtorFirstName} (ALWAYS use first name only — NEVER M./Mme, Mr./Mrs., or any formal title)
DEBTOR PHONE: ${debtorPhone ?? 'unknown'}
LANGUAGE: ${lang === 'fr' ? 'FRENCH (use vouvoiement). Write ENTIRELY in French. Once started in French, NEVER switch to English even if the debtor writes in English.' : 'ENGLISH. Write entirely in English. Once started in English, NEVER switch to French even if the debtor writes in French.'}
COMPANY: ${clientCompanyName}

TONE: You sound like a real person texting. Short sentences. Conversational. Friendly but professional. You give specific numbers and options. You don't use corporate language.

NEVER SAY THESE (they sound robotic):
- "M./Mme", "Mr./Mrs.", "Mr.", "Mrs.", "Ms.", "Mme", or any formal title — use FIRST NAME ONLY
- "Reply YES" or "Reply to confirm"
- "Contact us" / "Contactez-nous" / "Call us" / "Reach out"
- "This is an attempt to collect a debt"
- "Opt out by replying STOP"
- "This offer is limited" / "Limited time"
- "Dear valued customer"
- "Stage", "Tier", "Layer", or any internal system term
- In the FIRST message: NEVER say "impayé", "overdue", "souffrance", "en retard", or mention any dollar amount

NEGOTIATION PARAMETERS (internal only — never reveal these):
- Outstanding balance: $${Number(amount).toFixed(2)}
- Acceptable range: $${range.min.toFixed(2)}–$${range.max.toFixed(2)}
- Floor amount: $${floorAmount.toFixed(2)} (absolute minimum, never go below)

FIRST MESSAGE — curiosity hook, NO amount, NO "impayé"/"overdue"/"souffrance":
${lang === 'fr' ? `Example: "Bonjour ${debtorFirstName}! C'est ${resolvedAgentName} de ${clientCompanyName}. J'ai une bonne nouvelle concernant votre dossier de prêt avec nous. On a quelque chose d'intéressant à vous proposer. Vous avez deux minutes?"` : `Example: "Hey ${debtorFirstName}! It's ${resolvedAgentName} from ${clientCompanyName}. I've got some good news regarding your loan file with us. We have something interesting to offer you. Got a couple minutes?"`}
The first message MUST NOT mention any dollar amount, balance, "impayé", "overdue", "souffrance", or negative debt language. It is ONLY a curiosity hook to get them to respond.

SECOND MESSAGE (after they respond) — NOW reveal details with options:
${lang === 'fr' ? `Example: "Merci de répondre ${debtorFirstName}! Donc concernant votre solde de ${Number(amount).toFixed(2)}$ avec ${clientCompanyName}, on a deux options pour vous: une entente de paiement très flexible ou bien un rabais intéressant pour fermer le dossier une fois pour toutes. Qu'est-ce qui marcherait le mieux pour vous?"` : `Example: "Thanks for getting back ${debtorFirstName}! So regarding your $${Number(amount).toFixed(2)} balance with ${clientCompanyName}, we've got two options for you: a very flexible payment plan or an interesting discount to close the file once and for all. What would work best for you?"`}

FOLLOW-UP (if they DON'T respond to first message) — still friendly, still NO amount:
${lang === 'fr' ? `Example: "Salut ${debtorFirstName}, c'est encore ${resolvedAgentName} de ${clientCompanyName}. Je vous ai écrit concernant votre dossier de prêt. On a une offre avantageuse pour vous. Faites-moi signe quand vous avez une minute!"` : `Example: "Hey ${debtorFirstName}, it's ${resolvedAgentName} from ${clientCompanyName} again. I reached out about your loan file. We have a great offer for you. Let me know when you have a minute!"`}

WHEN DEBTOR ENGAGES — give specific numbers immediately:
${lang === 'fr' ? `Example: "Parfait! Pour votre solde de ${Number(amount).toFixed(2)}$, on peut faire ${Math.round(amount * 0.7 / 8)}$ aux deux semaines. Ou si vous préférez fermer le dossier tout de suite, on peut faire ${Number(range.offer).toFixed(2)}$ (${Math.round((1 - range.offer / amount) * 100)}% de rabais). Qu'est-ce qui marche le mieux pour vous?"` : `Example: "Great! For your $${Number(amount).toFixed(2)} balance, we can do $${Math.round(amount * 0.7 / 8)} every two weeks. Or if you'd rather close it out now, we can do $${Number(range.offer).toFixed(2)} (${Math.round((1 - range.offer / amount) * 100)}% discount). What works best for you?"`}

NEGOTIATION STRATEGY (internal — never mention to debtor):

EARLY (Days 0-14):
- Present two options: payment plan OR 30% discount to close
- Payment plan: ~50% of original weekly amount, spread over reasonable period
- Be warm and solution-oriented

ESCALATED (Days 14+):
- Reference previous attempts naturally ("I've been trying to reach you")
- Offer 50% discount to close TODAY
- Can split into max 2 payments within 14 days
- More direct tone but still human

FINAL (2+ broken promises OR 60+ days):
- Mention file transfer/consequences naturally
- One final chance with deadline
- If they respond: immediately de-escalate and negotiate like a normal person

PAYMENT LINKS:
- NEVER include a payment link in the first contact or follow-up outreach
- Payment links are ONLY sent after the debtor explicitly agrees to a specific amount or plan
- When they agree: set generatePaymentLink=true and paymentLinkAmount to the agreed amount

PROMISE-TO-PAY SIGNALS:
- "What's my balance?" = high intent — present best offer immediately
- "What kind of arrangement?" = very high intent — give specific numbers
- "I've had difficulty because..." = ready to pay — be empathetic, then present offer
- When they agree: set generatePaymentLink=true

INSULTS:
Stay calm. Something like: "Je comprends que c'est frustrant, mais ça change pas le solde. On essaie juste de trouver un arrangement réduit avec vous. Si on arrive pas à s'entendre, le dossier va être transféré. C'est à vous de décider." (adapt to language)

CEASE AND DESIST:
If debtor says "stop contacting me" or mentions OPC/complaint: stop immediately, set shouldEscalate=true.

KEEP IT SHORT: Under 300 characters when possible. Write like you're texting.

Always respond with a valid JSON object — no markdown, no extra text:
{
  "message": "<your SMS message>",
  "intent": "<one of: PAYMENT_INTENT | CANNOT_PAY_FULL | HARDSHIP | DISPUTE | LEGAL_THREAT | CEASE_DESIST | CALLBACK_REQUEST | PROMISE_TO_PAY | INSULT | BALANCE_INQUIRY | NO_RESPONSE | UNCLASSIFIED>",
  "suggestedOffer": <null or number>,
  "shouldEscalate": <true|false>,
  "escalationReason": <null or string>,
  "generatePaymentLink": <true|false>,
  "paymentLinkAmount": <null or number>
}`;

  // Map conversation history to Anthropic message format
  const messages = conversationHistory.map(m => ({
    role:    m.role === 'agent' ? 'assistant' : 'user',
    content: m.content,
  }));

  if (messages.length === 0) {
    messages.push({
      role:    'user',
      content: `[System: Generate a FIRST MESSAGE using the curiosity hook strategy. Use first name "${debtorFirstName}" only. Do NOT mention any dollar amount, balance, "impayé", "overdue", or negative debt language. Frame it as good news about their loan file. Make them want to respond.]`,
    });
  }

  try {
    const response = await anthropic.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system:     systemPrompt,
      messages,
    });

    const raw = response.content[0]?.text ?? '';
    let parsed;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      parsed = {
        message:            raw,
        intent:             'UNCLASSIFIED',
        suggestedOffer:     null,
        shouldEscalate:     false,
        escalationReason:   null,
        generatePaymentLink: false,
        paymentLinkAmount:  null,
      };
    }

    // Log AI message
    await supabase.from('conversations').insert({
      debtor_id:  debtorId,
      company_id: resolvedCompanyId,
      channel:    'ai',
      direction:  'outbound',
      content:    parsed.message,
      intent:     parsed.intent,
      metadata:   { tier, amount, suggestedOffer: parsed.suggestedOffer },
    });

    res.json(parsed);
  } catch (err) {
    console.error('Negotiation suggest error:', err);
    res.status(500).json({ error: err.message ?? 'AI negotiation failed' });
  }
});

// ─── POST /agents/takeover/request ────────────────────────────────────────────

router.post('/takeover/request', async (req, res) => {
  const { debtorId, reason, companyId } = req.body;
  if (!debtorId) return res.status(400).json({ error: 'debtorId is required' });

  // Flag cease_desist if that's the reason (column exists in debtors)
  const update = {};
  if (reason === 'cease_desist') {
    update.cease_desist = true;
  }

  if (Object.keys(update).length) {
    const { error } = await supabase
      .from('debtors')
      .update(update)
      .eq('id', debtorId);
    if (error) return res.status(500).json({ error: error.message });
  }

  // Log the escalation in conversations
  const resolvedCompanyId = await resolveCompanyId(companyId);
  await supabase.from('conversations').insert({
    debtor_id:  debtorId,
    company_id: resolvedCompanyId,
    channel:    'system',
    direction:  'internal',
    content:    `Escalated to human queue. Reason: ${reason ?? 'not specified'}`,
    metadata:   { type: 'takeover_request', reason },
  });

  res.json({ success: true, message: 'Debtor escalated to human queue' });
});

// ─── POST /agents/takeover/return ─────────────────────────────────────────────

router.post('/takeover/return', async (req, res) => {
  const { debtorId, notes, companyId } = req.body;
  if (!debtorId) return res.status(400).json({ error: 'debtorId is required' });

  // Log the return in conversations
  const resolvedCompanyId = await resolveCompanyId(companyId);
  await supabase.from('conversations').insert({
    debtor_id:  debtorId,
    company_id: resolvedCompanyId,
    channel:    'system',
    direction:  'internal',
    content:    `Returned to AI queue.${notes ? ` Notes: ${notes}` : ''}`,
    metadata:   { type: 'takeover_return', notes },
  });

  res.json({ success: true, message: 'Debtor returned to AI queue' });
});

// ─── POST /agents/promises/log ────────────────────────────────────────────────

router.post('/promises/log', async (req, res) => {
  const { debtorId, amount, promisedDate, channel, companyId } = req.body;

  if (!debtorId || !amount || !promisedDate) {
    return res.status(400).json({ error: 'debtorId, amount, and promisedDate are required' });
  }

  try {
    const resolvedCompanyId = await resolveCompanyId(companyId);
    if (!resolvedCompanyId) {
      return res.status(400).json({ error: 'No companyId provided and no companies exist yet' });
    }

    const promiseId = uuidv4();

    const { error: promiseError } = await supabase.from('promises').insert({
      id:            promiseId,
      debtor_id:     debtorId,
      company_id:    resolvedCompanyId,
      amount,
      promised_date: promisedDate,
      channel:       channel ?? 'sms',
      status:        'pending',
    });
    if (promiseError) throw promiseError;

    // Increment broken_promise_count is handled when a promise expires/breaks,
    // not here — broken_promise_count is a real column in debtors.

    // Schedule a reminder 1 day before the promised date
    const reminderDate = new Date(promisedDate);
    reminderDate.setDate(reminderDate.getDate() - 1);
    reminderDate.setHours(10, 0, 0, 0);

    await supabase.from('scheduled_contacts').insert({
      debtor_id:        debtorId,
      company_id:       resolvedCompanyId,
      channel:          channel ?? 'sms',
      scheduled_for:    reminderDate.toISOString(),
      layer:            'promise_reminder',
      status:           'pending',
      message_template: `Reminder: your payment of $${Number(amount).toFixed(2)} is due tomorrow.`,
    });

    res.json({ success: true, promiseId });
  } catch (err) {
    console.error('Log promise error:', err);
    res.status(500).json({ error: err.message ?? 'Failed to log promise' });
  }
});

// ─── Voice call handler (shared between /agents/voice/call and /calls/initiate)

async function initiateVoiceCall(req, res) {
  const {
    debtorId,
    debtorName,
    phone,
    amount,
    companyName,
    agentName = 'Alex',
    tier      = 1,
    companyId,
  } = req.body;

  if (!debtorId || !phone) {
    return res.status(400).json({ error: 'debtorId and phone are required' });
  }

  const compliance = await checkContactAllowed(debtorId, 'call');
  if (!compliance.allowed) {
    return res.status(403).json({ error: compliance.reason, code: 'COMPLIANCE_BLOCK' });
  }

  try {
    const resolvedCompanyId = await resolveCompanyId(companyId);
    if (!resolvedCompanyId) {
      return res.status(400).json({ error: 'No companyId provided and no companies exist yet' });
    }

    const creds       = await getCompanyCreds(resolvedCompanyId);
    const vapiKey     = creds.vapi_api_key     ?? process.env.VAPI_API_KEY;
    const assistantId = creds.vapi_assistant_id ?? process.env.VAPI_ASSISTANT_ID;

    if (!vapiKey) return res.status(400).json({ error: 'VAPI not configured for this company' });

    const vapiRes = await fetch('https://api.vapi.ai/call/phone', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${vapiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assistantId,
        customer: { number: phone, name: debtorName },
        assistantOverrides: {
          variableValues: {
            debtorName,
            debtorFirstName: debtorName?.split(' ')[0] ?? '',
            amount:          amount ? `$${Number(amount).toFixed(2)}` : 'your outstanding balance',
            companyName:     companyName ?? '',
            agentName,
            tier:            String(tier),
          },
        },
        metadata: {
          debtorId,
          companyId: resolvedCompanyId,
          tier,
        },
      }),
    });

    if (!vapiRes.ok) {
      const vapiErr = await vapiRes.json().catch(() => ({}));
      return res.status(400).json({ error: vapiErr?.message ?? 'VAPI call initiation failed' });
    }

    const callData = await vapiRes.json();

    await supabase.from('contact_attempts').insert({
      debtor_id:  debtorId,
      company_id: resolvedCompanyId,
      channel:    'call',
      direction:  'outbound',
      status:     'initiated',
      metadata:   { call_id: callData.id },
    });

    res.json({ success: true, callId: callData.id, status: callData.status });
  } catch (err) {
    console.error('Voice call error:', err);
    res.status(500).json({ error: err.message ?? 'Voice call failed' });
  }
}

// POST /agents/voice/call
router.post('/voice/call', initiateVoiceCall);

// ─── POST /agents/voice/webhook  (no auth — VAPI calls this) ──────────────────

router.post('/voice/webhook', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.sendStatus(200);

    const { type, call } = message;

    if (type === 'end-of-call-report' && call) {
      const { id: callId, metadata, transcript, summary, analysis, startedAt, endedAt } = call;
      const { debtorId, companyId } = metadata ?? {};

      if (debtorId) {
        const duration =
          startedAt && endedAt
            ? Math.round((new Date(endedAt) - new Date(startedAt)) / 1000)
            : null;

        await supabase.from('call_transcripts').insert({
          call_id:    callId,
          debtor_id:  debtorId,
          company_id: companyId,
          transcript,
          summary,
          outcome:    analysis?.successEvaluation ?? null,
          duration,
        });

        await supabase
          .from('contact_attempts')
          .update({ status: 'completed', metadata: { call_id: callId, summary } })
          .eq('metadata->>call_id', callId);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Voice webhook error:', err);
    res.sendStatus(200); // Always 200 to VAPI
  }
});

// ─── GET /agents/voice/result/:callId ─────────────────────────────────────────

router.get('/voice/result/:callId', async (req, res) => {
  const { callId } = req.params;
  const companyId  = req.query.companyId ?? null;

  try {
    // Check local DB first
    const { data: transcript } = await supabase
      .from('call_transcripts')
      .select('*')
      .eq('call_id', callId)
      .single();

    if (transcript) return res.json(transcript);

    // Fallback: fetch live from VAPI
    const resolvedCompanyId = await resolveCompanyId(companyId);
    let vapiKey = process.env.VAPI_API_KEY;
    if (resolvedCompanyId) {
      const creds = await getCompanyCreds(resolvedCompanyId);
      vapiKey = creds.vapi_api_key ?? vapiKey;
    }

    const vapiRes = await fetch(`https://api.vapi.ai/call/${callId}`, {
      headers: { Authorization: `Bearer ${vapiKey}` },
    });

    if (!vapiRes.ok) return res.status(404).json({ error: 'Call not found' });

    const data = await vapiRes.json();
    res.json({
      callId,
      status:     data.status,
      transcript: data.transcript,
      summary:    data.summary,
      duration:   data.duration,
    });
  } catch (err) {
    console.error('Voice result error:', err);
    res.status(500).json({ error: err.message ?? 'Failed to fetch call result' });
  }
});

// Attach handler so server.js can wire the /calls/initiate alias
router.initiateVoiceCall = initiateVoiceCall;

module.exports = router;
