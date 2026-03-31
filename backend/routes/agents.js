const express    = require('express');
const router     = express.Router();
const Anthropic  = require('@anthropic-ai/sdk');
const twilio     = require('twilio');
const sgMail     = require('@sendgrid/mail');
const { v4: uuidv4 } = require('uuid');

const supabase                 = require('../database/supabase');
const { requireAuth }          = require('../middleware/auth');
const { checkContactAllowed }  = require('../middleware/compliance');
const { decrypt }              = require('../utils/encryption');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function extractFirstName(debtor) {
  if (debtor?.first_name) return debtor.first_name;
  const name = debtor?.name ?? debtor?.debtorName ?? '';
  return name.split(' ')[0] || 'there';
}

function buildSmsBody({ debtorName, firstName, amount, companyName, agentName, tier, language = 'fr', isFirstMessage = true }) {
  const first = firstName ?? debtorName?.split(' ')[0] ?? 'there';
  const agent = agentName ?? 'Alex';

  if (isFirstMessage) {
    // FIRST MESSAGE: Curiosity hook only — NO amount, NO "impayé"/"overdue"
    if (language === 'fr') {
      return (
        `Bonjour ${first}! C'est ${agent} de ${companyName}. ` +
        `J'ai une bonne nouvelle concernant votre dossier de prêt avec nous. ` +
        `On a quelque chose d'intéressant à vous proposer. Vous avez deux minutes? ` +
        `Répondez STOP pour ne plus recevoir de messages.`
      );
    }
    return (
      `Hey ${first}! It's ${agent} from ${companyName}. ` +
      `I've got some good news about your loan file with us. ` +
      `We have something interesting to offer you. Got a couple minutes? ` +
      `Reply STOP to opt out.`
    );
  }

  // SECOND MESSAGE (or later): reveal details with options
  const amtStr = amount ? `$${Number(amount).toFixed(2)}` : 'votre solde';
  if (language === 'fr') {
    return (
      `Merci de répondre! Donc concernant votre solde de ${amtStr} avec ${companyName}, ` +
      `on a deux options pour vous: une entente de paiement très flexible ou bien ` +
      `un rabais intéressant pour fermer le dossier une fois pour toutes. ` +
      `Qu'est-ce qui marcherait le mieux pour vous?`
    );
  }
  return (
    `Thanks for getting back! So regarding your balance of ${amtStr} with ${companyName}, ` +
    `we've got two options for you: a very flexible payment plan or an interesting ` +
    `discount to close the file once and for all. What would work best for you?`
  );
}

function buildFollowUpSms({ firstName, debtorName, companyName, agentName, language = 'fr' }) {
  const first = firstName ?? debtorName?.split(' ')[0] ?? 'there';
  const agent = agentName ?? 'Alex';

  if (language === 'fr') {
    return (
      `Salut ${first}, c'est encore ${agent} de ${companyName}. ` +
      `Je vous ai écrit concernant votre dossier de prêt. ` +
      `On a une offre avantageuse pour vous. ` +
      `Faites-moi signe quand vous avez une minute!`
    );
  }
  return (
    `Hey ${first}, it's ${agent} from ${companyName} again. ` +
    `I reached out about your loan file. ` +
    `We have a great offer for you. ` +
    `Let me know when you have a minute!`
  );
}

function buildEmailContent({ debtorName, firstName, amount, companyName, agentName, tier, language = 'fr', isFirstMessage = true }) {
  const first = firstName ?? debtorName?.split(' ')[0] ?? 'there';
  const agent = agentName ?? 'Alex';

  if (isFirstMessage) {
    // FIRST EMAIL: Curiosity hook only — NO amount, NO "impayé"/"overdue"
    const subject = language === 'fr'
      ? `Bonne nouvelle — ${companyName}`
      : `Good news — ${companyName}`;

    const text = language === 'fr'
      ? `Bonjour ${first},\n\n` +
        `C'est ${agent} de ${companyName}. J'ai une bonne nouvelle concernant votre dossier de prêt avec nous. ` +
        `On a quelque chose d'intéressant à vous proposer.\n\n` +
        `Répondez à ce courriel quand vous avez deux minutes!\n\n` +
        `${agent}\n${companyName}`
      : `Hey ${first},\n\n` +
        `It's ${agent} from ${companyName}. I've got some good news about your loan file with us. ` +
        `We have something interesting to offer you.\n\n` +
        `Reply to this email when you've got a couple minutes!\n\n` +
        `${agent}\n${companyName}`;

    const html = language === 'fr'
      ? `<p>Bonjour ${first},</p>` +
        `<p>C'est <strong>${agent}</strong> de <strong>${companyName}</strong>. ` +
        `J'ai une bonne nouvelle concernant votre dossier de prêt avec nous. ` +
        `On a quelque chose d'intéressant à vous proposer.</p>` +
        `<p>Répondez à ce courriel quand vous avez deux minutes!</p>` +
        `<p>${agent}<br>${companyName}</p>`
      : `<p>Hey ${first},</p>` +
        `<p>It's <strong>${agent}</strong> from <strong>${companyName}</strong>. ` +
        `I've got some good news about your loan file with us. ` +
        `We have something interesting to offer you.</p>` +
        `<p>Reply to this email when you've got a couple minutes!</p>` +
        `<p>${agent}<br>${companyName}</p>`;

    return { subject, text, html };
  }

  // SECOND EMAIL (or later): reveal details with options
  const amtStr = amount ? `$${Number(amount).toFixed(2)}` : 'votre solde';
  const subject = language === 'fr'
    ? `Vos options — ${companyName}`
    : `Your options — ${companyName}`;

  const text = language === 'fr'
    ? `Bonjour ${first},\n\n` +
      `Merci de répondre! Concernant votre solde de ${amtStr} avec ${companyName}, ` +
      `on a deux options pour vous: une entente de paiement très flexible ou bien ` +
      `un rabais intéressant pour fermer le dossier une fois pour toutes.\n\n` +
      `Qu'est-ce qui marcherait le mieux pour vous?\n\n` +
      `${agent}\n${companyName}`
    : `Hey ${first},\n\n` +
      `Thanks for getting back! Regarding your balance of ${amtStr} with ${companyName}, ` +
      `we've got two options for you: a very flexible payment plan or an interesting ` +
      `discount to close the file once and for all.\n\n` +
      `What would work best for you?\n\n` +
      `${agent}\n${companyName}`;

  const html = language === 'fr'
    ? `<p>Bonjour ${first},</p>` +
      `<p>Merci de répondre! Concernant votre solde de <strong>${amtStr}</strong> avec <strong>${companyName}</strong>, ` +
      `on a deux options pour vous: une entente de paiement très flexible ou bien ` +
      `un rabais intéressant pour fermer le dossier une fois pour toutes.</p>` +
      `<p>Qu'est-ce qui marcherait le mieux pour vous?</p>` +
      `<p>${agent}<br>${companyName}</p>`
    : `<p>Hey ${first},</p>` +
      `<p>Thanks for getting back! Regarding your balance of <strong>${amtStr}</strong> with <strong>${companyName}</strong>, ` +
      `we've got two options for you: a very flexible payment plan or an interesting ` +
      `discount to close the file once and for all.</p>` +
      `<p>What would work best for you?</p>` +
      `<p>${agent}<br>${companyName}</p>`;

  return { subject, text, html };
}

// ─── POST /agents/outreach/send ───────────────────────────────────────────────

router.post('/outreach/send', requireAuth, async (req, res) => {
  const { debtorId, debtorName, phone, email, channel, amount, tier, companyName, agentName } = req.body;

  if (!debtorId || !channel) {
    return res.status(400).json({ error: 'debtorId and channel are required' });
  }

  const compliance = await checkContactAllowed(debtorId, channel);
  if (!compliance.allowed) {
    return res.status(403).json({ error: compliance.reason, code: 'COMPLIANCE_BLOCK' });
  }

  try {
    const creds     = await getCompanyCreds(req.company.id);
    const attemptId = uuidv4();
    let   deliveryMeta = {};

    if (channel === 'sms') {
      if (!phone) return res.status(400).json({ error: 'phone is required for SMS' });

      const fromNumber = await getCompanyTwilioNumber(req.company.id);
      if (!fromNumber) return res.status(400).json({ error: 'No active Twilio number configured' });

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

      const apiKey  = creds.sendgrid_api_key ?? process.env.SENDGRID_API_KEY;
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
      company_id: req.company.id,
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

router.post('/negotiation/suggest', requireAuth, async (req, res) => {
  const {
    debtorId,
    conversationHistory = [],
    tier    = 1,
    balance,
    floor,
    companyName,
  } = req.body;

  if (!debtorId || balance === undefined || balance === null) {
    return res.status(400).json({ error: 'debtorId and balance are required' });
  }

  const floorAmount = floor ?? balance * 0.3;

  // Tier-based settlement ranges (never reveal floor to debtor)
  const RANGES = {
    1: { min: balance * 0.85, max: balance },
    2: { min: balance * 0.65, max: balance * 0.90 },
    3: { min: balance * 0.50, max: balance * 0.75 },
    4: { min: floorAmount,    max: balance * 0.60 },
  };
  const range      = RANGES[Math.min(tier, 4)];
  const tierLabels = { 1: 'early stage', 2: 'mid stage', 3: 'late stage', 4: 'final stage' };

  const systemPrompt = `You are ${req.body.agentName ?? 'Alex'}, a friendly and conversational debt resolution specialist working for ${companyName ?? 'a collections agency'}. You text like a real person — warm, casual, helpful.

CRITICAL MESSAGING STRATEGY:
- Message 1 (FIRST contact): Use a CURIOSITY HOOK with good news. Make the debtor WANT to respond.
  * Use FIRST NAME only (never M./Mme, Mr./Mrs., or formal titles)
  * NEVER mention the amount, balance, "impayé", "overdue", "souffrance", "en retard", or any negative debt language
  * Frame it as good news about their "dossier de prêt" / "loan file"
  * Example FR: "Bonjour {firstName}! C'est {agentName} de {companyName}. J'ai une bonne nouvelle concernant votre dossier de prêt avec nous. On a quelque chose d'intéressant à vous proposer. Vous avez deux minutes?"
  * Example EN: "Hey {firstName}! It's {agentName} from {companyName}. I've got some good news about your loan file with us. We have something interesting to offer you. Got a couple minutes?"

- Message 2 (AFTER they respond): Now reveal the details with options.
  * "Merci de répondre! Donc concernant votre solde de {amount}$ avec {companyName}, on a deux options pour vous: une entente de paiement très flexible ou bien un rabais intéressant pour fermer le dossier une fois pour toutes. Qu'est-ce qui marcherait le mieux pour vous?"

- Message 2 (if they DID NOT respond): Stay friendly, add context but still no amount.
  * "Salut {firstName}, c'est encore {agentName} de {companyName}. Je vous ai écrit concernant votre dossier de prêt. On a une offre avantageuse pour vous. Faites-moi signe quand vous avez une minute!"

Negotiation parameters (use ONLY in message 2 or later, NEVER in message 1):
- Outstanding balance: $${Number(balance).toFixed(2)}
- Acceptable settlement range: $${range.min.toFixed(2)}–$${range.max.toFixed(2)} (DO NOT disclose this range)
- Collection stage: Tier ${tier} (${tierLabels[Math.min(tier, 4)]})

Rules:
- Use FIRST NAME only — never M./Mme, Mr./Mrs., or formal titles
- Be conversational, warm, and empathetic — like texting someone about something they'd want to hear
- Offer payment plans if the debtor cannot pay in full
- Never threaten, harass, or use aggressive language
- Comply fully with FDCPA and Canadian collection regulations
- If the debtor invokes cease and desist, acknowledge it immediately and stop negotiating
- Do not accept offers below the minimum settlement amount
- Do not reveal the floor amount or settlement range

Always respond with a valid JSON object — no markdown, no extra text:
{
  "message": "<your response to the debtor>",
  "intent": "<one of: PROMISE_TO_PAY | PARTIAL_PAYMENT | DISPUTE | HARDSHIP | CALLBACK_REQUEST | CEASE_DESIST | UNRESPONSIVE | GENERAL_INQUIRY>",
  "suggestedOffer": <null or number>,
  "shouldEscalate": <true|false>,
  "escalationReason": <null or string>
}`;

  // Map conversation history to Anthropic message format
  const messages = conversationHistory.map(m => ({
    role:    m.role === 'agent' ? 'assistant' : 'user',
    content: m.content,
  }));

  if (messages.length === 0) {
    messages.push({
      role:    'user',
      content: `[System: Generate a friendly FIRST MESSAGE using the curiosity hook strategy. Use first name only. Do NOT mention the amount, balance, or any negative debt language. Make them want to respond with good news about their loan file.]`,
    });
  }

  try {
    const response = await anthropic.messages.create({
      model:      'claude-opus-4-6',
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
        message:          raw,
        intent:           'GENERAL_INQUIRY',
        suggestedOffer:   null,
        shouldEscalate:   false,
        escalationReason: null,
      };
    }

    // Log AI message
    await supabase.from('conversations').insert({
      debtor_id:  debtorId,
      company_id: req.company.id,
      channel:    'ai',
      direction:  'outbound',
      content:    parsed.message,
      intent:     parsed.intent,
      metadata:   { tier, balance, suggestedOffer: parsed.suggestedOffer },
    });

    res.json(parsed);
  } catch (err) {
    console.error('Negotiation suggest error:', err);
    res.status(500).json({ error: err.message ?? 'AI negotiation failed' });
  }
});

// ─── POST /agents/takeover/request ────────────────────────────────────────────

router.post('/takeover/request', requireAuth, async (req, res) => {
  const { debtorId, requestedBy, reason } = req.body;
  if (!debtorId) return res.status(400).json({ error: 'debtorId is required' });

  const { error } = await supabase
    .from('debtors')
    .update({
      ai_paused:              true,
      human_takeover:         true,
      human_takeover_reason:  reason       ?? null,
      human_takeover_by:      requestedBy  ?? req.user.id,
      human_takeover_at:      new Date().toISOString(),
    })
    .eq('id', debtorId);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, message: 'Debtor escalated to human queue' });
});

// ─── POST /agents/takeover/return ─────────────────────────────────────────────

router.post('/takeover/return', requireAuth, async (req, res) => {
  const { debtorId, notes } = req.body;
  if (!debtorId) return res.status(400).json({ error: 'debtorId is required' });

  const { error } = await supabase
    .from('debtors')
    .update({
      ai_paused:             false,
      human_takeover:        false,
      human_takeover_reason: null,
      human_takeover_at:     null,
      human_notes:           notes ?? null,
      returned_to_ai_at:     new Date().toISOString(),
    })
    .eq('id', debtorId);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, message: 'Debtor returned to AI queue' });
});

// ─── POST /agents/promises/log ────────────────────────────────────────────────

router.post('/promises/log', requireAuth, async (req, res) => {
  const { debtorId, amount, promisedDate, channel } = req.body;

  if (!debtorId || !amount || !promisedDate) {
    return res.status(400).json({ error: 'debtorId, amount, and promisedDate are required' });
  }

  try {
    const promiseId = uuidv4();

    const { error: promiseError } = await supabase.from('promises').insert({
      id:            promiseId,
      debtor_id:     debtorId,
      company_id:    req.company.id,
      amount,
      promised_date: promisedDate,
      channel:       channel ?? 'sms',
      status:        'pending',
    });
    if (promiseError) throw promiseError;

    // Update debtor record with promise info
    await supabase.from('debtors').update({
      last_promise_amount: amount,
      last_promise_date:   promisedDate,
      has_active_promise:  true,
    }).eq('id', debtorId);

    // Schedule a reminder 1 day before the promised date
    const reminderDate = new Date(promisedDate);
    reminderDate.setDate(reminderDate.getDate() - 1);
    reminderDate.setHours(10, 0, 0, 0);

    await supabase.from('scheduled_contacts').insert({
      debtor_id:   debtorId,
      company_id:  req.company.id,
      channel:     channel ?? 'sms',
      scheduled_at: reminderDate.toISOString(),
      type:        'promise_reminder',
      metadata:    { promise_id: promiseId, amount, promised_date: promisedDate },
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
  } = req.body;

  if (!debtorId || !phone) {
    return res.status(400).json({ error: 'debtorId and phone are required' });
  }

  const compliance = await checkContactAllowed(debtorId, 'call');
  if (!compliance.allowed) {
    return res.status(403).json({ error: compliance.reason, code: 'COMPLIANCE_BLOCK' });
  }

  try {
    const creds       = await getCompanyCreds(req.company.id);
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
            balance:         amount ? `$${Number(amount).toFixed(2)}` : 'your outstanding balance',
            companyName:     companyName ?? '',
            agentName,
            tier:            String(tier),
          },
        },
        metadata: {
          debtorId,
          companyId: req.company.id,
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
      company_id: req.company.id,
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
router.post('/voice/call', requireAuth, initiateVoiceCall);

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

        await supabase.from('debtors').update({
          last_contact_at:      new Date().toISOString(),
          last_contact_channel: 'call',
        }).eq('id', debtorId);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Voice webhook error:', err);
    res.sendStatus(200); // Always 200 to VAPI
  }
});

// ─── GET /agents/voice/result/:callId ─────────────────────────────────────────

router.get('/voice/result/:callId', requireAuth, async (req, res) => {
  const { callId } = req.params;

  try {
    // Check local DB first
    const { data: transcript } = await supabase
      .from('call_transcripts')
      .select('*')
      .eq('call_id', callId)
      .single();

    if (transcript) return res.json(transcript);

    // Fallback: fetch live from VAPI
    const creds  = await getCompanyCreds(req.company.id);
    const vapiKey = creds.vapi_api_key ?? process.env.VAPI_API_KEY;

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
