const express    = require('express');
const router     = express.Router();
const Stripe     = require('stripe');
const Anthropic  = require('@anthropic-ai/sdk');
const supabase   = require('../database/supabase');

// NOTE: No requireAuth on any webhook route — these are called by external services.

const stripe    = new Stripe(process.env.STRIPE_SECRET_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── POST /webhooks/inbound/sms  (Twilio inbound) ─────────────────────────────

router.post('/inbound/sms', async (req, res) => {
  try {
    const { From: fromPhone, Body: body, To: toPhone } = req.body;

    // Resolve company from the receiving Twilio number
    const { data: twilioNumber } = await supabase
      .from('twilio_numbers')
      .select('company_id, client_companies(*)')
      .eq('phone_number', toPhone)
      .single();

    const companyId = twilioNumber?.company_id ?? null;

    // Resolve debtor by phone + company
    let debtorQuery = supabase.from('debtors').select('*').eq('phone', fromPhone);
    if (companyId) debtorQuery = debtorQuery.eq('company_id', companyId);
    const { data: debtor } = await debtorQuery.limit(1).single();

    // Log every inbound attempt
    await supabase.from('contact_attempts').insert({
      debtor_id:  debtor?.id ?? null,
      company_id: companyId,
      channel:    'sms',
      direction:  'inbound',
      status:     'received',
      metadata:   { from: fromPhone, body, to: toPhone },
    });

    const xmlReply = (msg) =>
      `<?xml version="1.0" encoding="UTF-8"?><Response>${msg ? `<Message>${msg}</Message>` : ''}</Response>`;

    if (!debtor) {
      return res.type('text/xml').send(xmlReply(''));
    }

    // Store inbound message
    await supabase.from('conversations').insert({
      debtor_id:  debtor.id,
      company_id: companyId,
      channel:    'sms',
      direction:  'inbound',
      content:    body,
    });

    // Opt-out keywords
    const OPT_OUT = ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'];
    if (OPT_OUT.includes(body.trim().toUpperCase())) {
      await supabase.from('debtors').update({ sms_opted_out: true }).eq('id', debtor.id);
      return res.type('text/xml').send(
        xmlReply('You have been unsubscribed and will no longer receive SMS messages from us.')
      );
    }

    // Auto-reply via AI if debtor is still in AI queue
    if (!debtor.ai_paused && !debtor.cease_desist && !debtor.human_takeover) {
      const { data: recentConvos } = await supabase
        .from('conversations')
        .select('direction, content')
        .eq('debtor_id', debtor.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const history = (recentConvos ?? []).reverse().map(c => ({
        role:    c.direction === 'outbound' ? 'assistant' : 'user',
        content: c.content,
      }));

      const aiRes = await anthropic.messages.create({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system:
          `You are a professional debt collection assistant. ` +
          `Respond concisely (under 160 characters for SMS) about a $${debtor.amount ?? 0} outstanding balance. ` +
          `Be empathetic, professional, and helpful.`,
        messages: [
          ...history,
          { role: 'user', content: body },
        ],
      });

      const replyText = (aiRes.content[0]?.text ?? '').slice(0, 160).trim() ||
        'Thank you for your message. An agent will follow up with you shortly.';

      await supabase.from('conversations').insert({
        debtor_id:  debtor.id,
        company_id: companyId,
        channel:    'sms',
        direction:  'outbound',
        content:    replyText,
      });

      return res.type('text/xml').send(xmlReply(replyText));
    }

    // AI is paused — send no auto-reply
    res.type('text/xml').send(xmlReply(''));
  } catch (err) {
    console.error('Inbound SMS webhook error:', err);
    res.type('text/xml').send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  }
});

// ─── POST /webhooks/inbound/email  (SendGrid Inbound Parse) ───────────────────

router.post('/inbound/email', async (req, res) => {
  try {
    const { from, to, subject, text, html } = req.body;

    // Extract the sender's plain email address
    const fromEmail = from?.match(/<(.+)>/)?.[1] ?? from;

    const { data: debtor } = await supabase
      .from('debtors')
      .select('*')
      .eq('email', fromEmail)
      .limit(1)
      .single();

    if (debtor) {
      await supabase.from('conversations').insert({
        debtor_id:  debtor.id,
        company_id: debtor.company_id,
        channel:    'email',
        direction:  'inbound',
        content:    text ?? html ?? '',
        metadata:   { subject, from, to },
      });

      // last_contact_at and last_contact_channel don't exist in debtors table
      // Contact tracking is done via the conversations table instead
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Inbound email webhook error:', err);
    res.sendStatus(200);
  }
});

// ─── POST /webhooks/stripe ────────────────────────────────────────────────────
// Body must be raw Buffer — set up in server.js before JSON middleware

router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Stripe signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session   = event.data.object;
        const { debtor_id, company_id } = session.metadata ?? {};
        const amountPaid = (session.amount_total ?? 0) / 100;

        if (debtor_id) {
          await supabase.from('payments').insert({
            debtor_id,
            company_id,
            amount:             amountPaid,
            stripe_session_id:  session.id,
            payment_method:     session.payment_method_types?.[0] ?? 'card',
            status:             'completed',
          });

          const { data: debtor } = await supabase
            .from('debtors')
            .select('amount')
            .eq('id', debtor_id)
            .single();

          if (debtor) {
            const newAmount = Math.max(0, (debtor.amount ?? 0) - amountPaid);
            await supabase.from('debtors').update({
              amount: newAmount,
            }).eq('id', debtor_id);

            await supabase
              .from('payment_links')
              .update({ status: 'paid' })
              .eq('debtor_id', debtor_id)
              .eq('status', 'active');
          }
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const intent    = event.data.object;
        const { debtor_id: piDebtorId, company_id: piCompanyId } = intent.metadata ?? {};
        const piAmountPaid = (intent.amount_received ?? intent.amount ?? 0) / 100;

        if (piDebtorId) {
          await supabase.from('payments').insert({
            debtor_id:          piDebtorId,
            company_id:         piCompanyId,
            amount:             piAmountPaid,
            stripe_payment_intent_id: intent.id,
            payment_method:     intent.payment_method_types?.[0] ?? 'card',
            status:             'completed',
          });

          const { data: piDebtor } = await supabase
            .from('debtors')
            .select('amount')
            .eq('id', piDebtorId)
            .single();

          if (piDebtor) {
            const newAmount = Math.max(0, (piDebtor.amount ?? 0) - piAmountPaid);
            await supabase.from('debtors').update({
              amount: newAmount,
            }).eq('id', piDebtorId);

            await supabase
              .from('payment_links')
              .update({ status: 'paid' })
              .eq('debtor_id', piDebtorId)
              .eq('status', 'active');
          }
        }
        break;
      }

      case 'payment_link.updated': {
        const link = event.data.object;
        if (link.active === false) {
          await supabase
            .from('payment_links')
            .update({ status: 'deactivated' })
            .eq('stripe_payment_link_id', link.id);
        }
        break;
      }

      default:
        // Unhandled event — log and ignore
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook handling error:', err);
    res.status(500).json({ error: 'Webhook handling failed' });
  }
});

module.exports = router;
