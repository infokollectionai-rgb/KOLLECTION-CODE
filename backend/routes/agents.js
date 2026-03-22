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

      const fromNumber = await getCompanyTwilioNumber(resolvedCompanyId);
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
    conversationHistory = [],
    tier    = 1,
    amount,
    floor,
    companyName,
    agentName = 'Alex',
    companyId,
  } = req.body;

  if (!debtorId || amount === undefined || amount === null) {
    return res.status(400).json({ error: 'debtorId and amount are required' });
  }

  const resolvedCompanyId = await resolveCompanyId(companyId);
  if (!resolvedCompanyId) {
    return res.status(400).json({ error: 'No companyId provided and no companies exist yet' });
  }

  const floorAmount = floor ?? amount * 0.3;

  // Stage-based settlement ranges matching partner strategy
  const RANGES = {
    1: { offer: amount * 0.70, min: amount * 0.50, max: amount },         // Stage 1: 30% discount, accept down to 50%
    2: { offer: amount * 0.50, min: amount * 0.40, max: amount * 0.70 },  // Stage 2: 50% discount, accept down to 40%
    3: { offer: amount * 0.40, min: floorAmount,   max: amount * 0.50 },  // Stage 3: 60% discount, accept down to floor
    4: { offer: amount * 0.40, min: floorAmount,   max: amount * 0.50 },  // Stage 3+ (same as 3)
  };
  const range = RANGES[Math.min(tier, 4)];

  const clientCompanyName = companyName ?? 'a collections agency';

  const systemPrompt = `You are a professional account resolution specialist working on behalf of ${clientCompanyName}. Your name is ${agentName}.

LANGUAGE: Detect debtor language from their message or phone area code. Quebec codes (514, 438, 450, 579, 418, 581, 819, 873) = French. Ontario codes (416, 647, 437, 905, 289, 365, 343, 613, 705, 249) = English. If debtor writes in a specific language, ALWAYS continue in that language. Never mix languages. Use formal/vouvoiement in French.

PERSONALITY: You are persistent, calm, respectful, and solution-oriented. You never get angry. You adapt to each client type:
- Stressed client: Stay calm and reassuring. Explain that finding an arrangement avoids bigger problems.
- Liar client: Ignore their stories. Focus on "we need a payment now or a precise date for resuming payments."
- Cooperative client: Follow their lead, close the deal, thank them for cooperation.
- Aggressive client: Stay calm, don't match their energy. Remind them calmly that their aggression doesn't change the balance owed. Offer solutions.
- Silent client: "We need your collaboration. We're not here to harm you, just to find an arrangement together."

NEGOTIATION PARAMETERS:
- Outstanding balance: $${Number(amount).toFixed(2)}
- Initial offer: $${range.offer.toFixed(2)} (${Math.round((1 - range.offer / amount) * 100)}% discount)
- Acceptable range: $${range.min.toFixed(2)}–$${range.max.toFixed(2)} (DO NOT disclose this range)
- Floor amount: $${floorAmount.toFixed(2)} (NEVER go below this, NEVER reveal it)
- Collection stage: ${tier <= 1 ? 'Stage 1 (friendly/professional, days 0-14)' : tier <= 2 ? 'Stage 2 (direct/consequences, days 14+)' : 'Stage 3 (urgent/final, 60+ days or 2+ broken promises)'}

NEGOTIATION STRATEGY — 3 STAGES:

STAGE 1 (Days 0-14, friendly/professional):
- Mention the full balance and client company name
- Offer a discount of 30% to close the file immediately
- Or offer a payment plan: reduce weekly payments by 50% of original contract amount
- Payment plan examples: $500 debt = $67/2weeks, $1000 debt = $98/week, $2000 debt = $80/week
- If they agree: generate payment link IMMEDIATELY in the same message
- Minimum acceptable: $25/week for small debts, proportional for larger
- Tone: "We'd like to work with you to find a solution"

STAGE 2 (Days 14+, direct/consequences):
- Reference that multiple attempts have been made
- Mention that the file is about to be transferred to collections/legal
- Offer 50% discount to close the file TODAY
- The 50% offer can be split into max 2 payments within 14 days
- Tone: "This is a final offer before additional procedures are initiated"

STAGE 3 (After 2 broken promises OR 60+ days, urgent/threatening):
- Use ONLY as last resort
- Message about file transfer, wage garnishment, employer contact
- Offer one final chance with a strict deadline
- If they respond: immediately de-escalate and negotiate
- Tone: "Immediate action required to avoid consequences"

PAYMENT RULES:
- ALWAYS generate and include a Stripe payment link when any amount is agreed
- Payment link must be in the SAME message as the agreement
- For 50% discount deals: payment within 7-14 days max
- For payment plans: first payment immediately, then weekly/biweekly
- After a payment is received, send confirmation and next payment date
- After 2 broken promises: escalate to Stage 3 immediately

PROMISE-TO-PAY SIGNALS (the "magic moments"):
- Debtor asks "what is my balance?" = high intent
- Debtor asks "what kind of arrangement can we make?" = very high intent
- Debtor says "sorry I've had difficulty because of X, what arrangement?" = ready to pay
- When you detect these signals: immediately present the best offer with payment link

RESPONSE TO INSULTS:
"This doesn't change the outstanding balance. You signed an agreement and we're simply trying to find a reduced payment arrangement with you. If no payment plan can be arranged, your file will be transferred for further action. It's up to you to act accordingly."

CEASE AND DESIST:
If debtor says "stop contacting me" or mentions OPC/complaint: immediately stop, flag for human review.

NEVER:
- Claim to be human if directly asked
- Go below the configured floor amount
- Send a message without a payment link when agreement is reached
- Be rude or match aggressive energy

Always respond with a valid JSON object — no markdown, no extra text:
{
  "message": "<your response to the debtor>",
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
      content: `[System: Generate a professional opening message to begin contact with this debtor about their $${Number(amount).toFixed(2)} outstanding balance.]`,
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
