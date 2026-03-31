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

    // Opt-out keywords (check before storing — opt-out messages don't need AI history)
    const OPT_OUT = ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'];
    if (OPT_OUT.includes(body.trim().toUpperCase())) {
      await supabase.from('conversations').insert({
        debtor_id: debtor.id, company_id: companyId,
        channel: 'sms', direction: 'inbound', content: body,
      });
      await supabase.from('debtors').update({ sms_opted_out: true }).eq('id', debtor.id);
      return res.type('text/xml').send(
        xmlReply('You have been unsubscribed and will no longer receive SMS messages from us.')
      );
    }

    // Auto-reply via AI if debtor is still in AI queue
    if (!debtor.ai_paused && !debtor.cease_desist && !debtor.human_takeover) {
      // Fetch company record for name + agent name + Stripe account
      const { data: company } = await supabase
        .from('client_companies')
        .select('company_name, voice_agent_name, stripe_account_id')
        .eq('id', debtor.company_id ?? companyId)
        .single();

      const agentName   = company?.voice_agent_name || 'Alex';
      const companyName = company?.company_name || 'a collections agency';
      const firstName   = debtor.first_name || debtor.name?.split(' ')[0] || 'Client';
      const amount      = Number(debtor.amount ?? 0);
      const tier        = Math.min(Math.max(parseInt(debtor.tier ?? 1, 10), 1), 4);

      // Detect language from phone area code
      const FRENCH_AREA_CODES = ['514', '438', '450', '579', '418', '581', '819', '873'];
      const phoneDigits = fromPhone.replace(/\D/g, '');
      const areaCode    = phoneDigits.startsWith('1') ? phoneDigits.slice(1, 4) : phoneDigits.slice(0, 3);
      const lang        = FRENCH_AREA_CODES.includes(areaCode) ? 'fr' : 'en';

      // Stage-based settlement ranges
      const floorAmount = amount * 0.3;
      const RANGES = {
        1: { offer: amount * 0.70, min: amount * 0.50, max: amount },
        2: { offer: amount * 0.50, min: amount * 0.40, max: amount * 0.70 },
        3: { offer: amount * 0.40, min: floorAmount,   max: amount * 0.50 },
        4: { offer: amount * 0.40, min: floorAmount,   max: amount * 0.50 },
      };
      const range = RANGES[tier];

      // Build full negotiation system prompt
      const systemPrompt = lang === 'fr'
        ? `Tu es ${agentName}, une vraie personne qui travaille pour ${companyName}. Tu as une conversation SMS avec ${firstName} à propos de son solde de ${amount.toFixed(2)}$.

TON NOM: ${agentName}
DÉBITEUR: ${firstName} (utilise TOUJOURS le prénom seulement — JAMAIS M./Mme ou titre formel)
LANGUE: FRANÇAIS (vouvoiement). Écris ENTIÈREMENT en français. JAMAIS changer en anglais même si le client écrit en anglais.
COMPAGNIE: ${companyName}

TON: Tu sonnes comme une vraie personne qui texte. Phrases courtes. Conversationnel. Amical mais professionnel. Tu donnes des chiffres précis et des options. Pas de langage corporatif.

NE DIS JAMAIS:
- "M./Mme", "Mr./Mrs." ou tout titre formel — PRÉNOM seulement
- "Répondez OUI" ou "Répondez pour confirmer"
- "Contactez-nous" / "Appelez-nous" — tu ES le contact
- "Ceci est une tentative de recouvrement"
- "Stage", "Tier", "Layer" ou tout terme système interne

PARAMÈTRES DE NÉGOCIATION (interne — ne jamais révéler):
- Solde: ${amount.toFixed(2)}$
- Fourchette acceptable: ${range.min.toFixed(2)}$–${range.max.toFixed(2)}$
- Plancher: ${floorAmount.toFixed(2)}$ (minimum absolu)

RÈGLES:
- Tu CONTINUES la conversation. Ne redis JAMAIS "Bonjour" si tu l'as déjà dit.
- Tu MÈNES la conversation. Tu ne poses PAS de questions ouvertes comme "comment puis-je vous aider".
- Tu dis au débiteur qu'il fait partie d'une liste de personnes qui ont accès à une offre spéciale pour régler leur dossier.
- Tu présentes TOUJOURS deux options concrètes: rabais pour fermer le dossier OU plan de paiement flexible.
- Quand tu présentes les deux options, formule-les comme: "On peut fermer votre dossier à ${Number(range.offer).toFixed(2)}$ ou bien des paiements de ${Math.round(amount * 0.7 / 8)}$ aux deux semaines pour la balance complète de ${amount.toFixed(2)}$. Qu'est-ce qui vous convient?"
- Ne dis JAMAIS "soit...soit mettre en place". Garde ça simple et direct.
- Ne donne JAMAIS trop d'espace au client pour réfléchir. Toujours deux options.
- JAMAIS utiliser M./Mme, utilise le PRÉNOM seulement.
- Messages courts, moins de 300 caractères.
- Quand le client choisit le RABAIS, c'est UN SEUL paiement. Dis: "Parfait! Je vous envoie le lien de ${Number(range.offer).toFixed(2)}$ tout de suite pour fermer le dossier." et génère le lien immédiatement. Ne propose JAMAIS de diviser sauf si le client le demande.
- Offre de diviser le paiement du rabais SEULEMENT si le client le demande explicitement. Maximum 2 versements sur 14 jours.
- Quand le client choisit le PLAN DE PAIEMENT, donne le montant exact par semaine ou 2 semaines et demande de confirmer pour envoyer le lien du premier versement.
- Dès que le client accepte N'IMPORTE QUEL montant, génère le lien immédiatement. Ne pose pas de questions supplémentaires.

STRATÉGIE DE NÉGOCIATION:
DÉBUT (Jours 0-14): Plan de paiement OU rabais de 30% pour fermer.
ESCALADÉ (Jours 14+): Rabais 50% pour fermer AUJOURD'HUI, max 2 paiements en 14 jours.
FINAL (2+ promesses brisées OU 60+ jours): Mention transfert de dossier, dernière chance.

LIENS DE PAIEMENT:
- JAMAIS de lien au premier contact
- Seulement APRÈS que le débiteur accepte un montant précis
- Quand il accepte: dis "Parfait! Je vous envoie le lien de paiement tout de suite." et ajoute [GENERATE_PAYMENT_LINK:montant] à la fin (ex: [GENERATE_PAYMENT_LINK:350.00])

CESSATION:
- Si le client dit STOP ou mentionne l'OPC: réponds "Votre demande a été notée. Nous arrêtons les communications." et ajoute [CEASE_DESIST] à la fin.

INSULTES:
Reste calme. "Je comprends que c'est frustrant, mais ça change pas le solde. On essaie juste de trouver un arrangement réduit avec vous."

SIGNAUX DE PROMESSE DE PAYER:
- "C'est quoi mon solde?" = haute intention — présente la meilleure offre
- "Quel genre d'arrangement?" = très haute intention — donne des chiffres précis
- "J'ai eu des difficultés..." = prêt à payer — empathie puis offre`
        : `You are ${agentName}, a real person working for ${companyName}. You're texting ${firstName} about their $${amount.toFixed(2)} balance.

YOUR NAME: ${agentName}
DEBTOR: ${firstName} (ALWAYS use first name only — NEVER Mr./Mrs. or any formal title)
LANGUAGE: ENGLISH. Write entirely in English. NEVER switch to French even if the debtor writes in French.
COMPANY: ${companyName}

TONE: You sound like a real person texting. Short sentences. Conversational. Friendly but professional. Give specific numbers and options. No corporate speak.

NEVER SAY:
- "Mr./Mrs./Ms." or any formal title — FIRST NAME ONLY
- "Reply YES" or "Reply to confirm"
- "Contact us" / "Call us" — you ARE the contact
- "This is an attempt to collect a debt"
- "Stage", "Tier", "Layer", or any internal system term

NEGOTIATION PARAMETERS (internal — never reveal):
- Outstanding balance: $${amount.toFixed(2)}
- Acceptable range: $${range.min.toFixed(2)}–$${range.max.toFixed(2)}
- Floor amount: $${floorAmount.toFixed(2)} (absolute minimum)

RULES:
- CONTINUE the conversation. NEVER say "Hi" again if you already have.
- LEAD the conversation. Don't ask open questions like "how can I help you".
- Tell the debtor they're on a list of people with access to a special offer to settle their file.
- ALWAYS present two concrete options: discount to close the file OR flexible payment plan.
- When presenting the two options, say: "We can close your file for $${Number(range.offer).toFixed(2)} or set up payments of $${Math.round(amount * 0.7 / 8)} every two weeks for the full balance of $${amount.toFixed(2)}. What works for you?"
- NEVER say "either...or set up". Keep it simple and direct.
- NEVER give too much space to think. Always two options.
- Short messages, under 300 characters.
- When the client chooses the DISCOUNT, it's ONE single payment. Say: "Perfect! I'll send you the link for $${Number(range.offer).toFixed(2)} right now to close the file." and generate the link immediately. NEVER offer to split unless the client asks.
- Offer to split the discount payment ONLY if the client explicitly asks. Maximum 2 payments over 14 days.
- When the client chooses the PAYMENT PLAN, give the exact amount per week or every 2 weeks and ask to confirm so you can send the first payment link.
- As soon as the client accepts ANY amount, generate the link immediately. Do not ask additional questions.

NEGOTIATION STRATEGY:
EARLY (Days 0-14): Payment plan OR 30% discount to close.
ESCALATED (Days 14+): 50% discount to close TODAY, max 2 payments in 14 days.
FINAL (2+ broken promises OR 60+ days): Mention file transfer, last chance.

PAYMENT LINKS:
- NEVER include a link on first contact
- Only AFTER the debtor agrees to a specific amount
- When they agree: say "Perfect! I'll send you the payment link right now." and add [GENERATE_PAYMENT_LINK:amount] at the end (e.g. [GENERATE_PAYMENT_LINK:350.00])

CEASE AND DESIST:
- If debtor says "stop contacting me" or mentions complaints: respond "Your request has been noted. We are stopping communications." and add [CEASE_DESIST] at the end.

INSULTS:
Stay calm. "I understand it's frustrating, but that doesn't change the balance. We're just trying to find a reduced arrangement with you."

PROMISE-TO-PAY SIGNALS:
- "What's my balance?" = high intent — present best offer immediately
- "What kind of arrangement?" = very high intent — give specific numbers
- "I've had difficulty because..." = ready to pay — empathy then offer`;

      // Fetch conversation history BEFORE inserting the new message (avoids duplicate)
      const { data: recentConvos } = await supabase
        .from('conversations')
        .select('direction, content')
        .eq('debtor_id', debtor.id)
        .eq('channel', 'sms')
        .order('created_at', { ascending: false })
        .limit(10);

      const history = (recentConvos ?? []).reverse().map(c => ({
        role:    c.direction === 'outbound' ? 'assistant' : 'user',
        content: c.content,
      }));

      // NOW store the inbound message (after history fetch to avoid duplicate)
      await supabase.from('conversations').insert({
        debtor_id:  debtor.id,
        company_id: companyId,
        channel:    'sms',
        direction:  'inbound',
        content:    body,
      });

      const aiRes = await anthropic.messages.create({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system:     systemPrompt,
        messages: [
          ...history,
          { role: 'user', content: body },
        ],
      });

      let replyText = (aiRes.content[0]?.text ?? '').trim() ||
        (lang === 'fr'
          ? 'Merci pour votre message. Un agent vous contactera sous peu.'
          : 'Thank you for your message. An agent will follow up with you shortly.');

      // Handle [CEASE_DESIST] tag
      if (replyText.includes('[CEASE_DESIST]')) {
        replyText = replyText.replace(/\s*\[CEASE_DESIST\]\s*/g, '').trim();
        await supabase.from('debtors').update({ cease_desist: true }).eq('id', debtor.id);
      }

      // Handle [GENERATE_PAYMENT_LINK:amount] tag
      const paymentMatch = replyText.match(/\[GENERATE_PAYMENT_LINK[:\s]*([\d.]+)?\]/);
      if (paymentMatch) {
        replyText = replyText.replace(/\s*\[GENERATE_PAYMENT_LINK[:\s]*[\d.]*\]\s*/g, '').trim();
        const linkAmount = parseFloat(paymentMatch[1]) || amount;

        try {
          const targetCompanyId = debtor.company_id ?? companyId;
          const stripeOpts = company?.stripe_account_id
            ? { stripeAccount: company.stripe_account_id }
            : undefined;

          const product = await stripe.products.create(
            { name: `Recovery - ${companyName}`, metadata: { debtor_id: debtor.id, debtor_name: firstName } },
            stripeOpts
          );
          const price = await stripe.prices.create(
            { product: product.id, unit_amount: Math.round(linkAmount * 100), currency: 'cad' },
            stripeOpts
          );

          const linkParams = {
            line_items: [{ price: price.id, quantity: 1 }],
            metadata:   { debtor_id: debtor.id, company_id: targetCompanyId },
            after_completion: {
              type: 'hosted_confirmation',
              hosted_confirmation: { custom_message: 'Thank you. Your payment has been received and your account updated.' },
            },
          };
          if (company?.stripe_account_id) {
            linkParams.application_fee_amount = Math.round(linkAmount * 100 * 0.50);
          }

          const paymentLink = await stripe.paymentLinks.create(linkParams, stripeOpts);

          // Persist the link
          const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
          await supabase.from('payment_links').insert({
            debtor_id:              debtor.id,
            company_id:             targetCompanyId,
            stripe_payment_link_id: paymentLink.id,
            url:                    paymentLink.url,
            amount:                 linkAmount,
            description:            `Recovery - ${companyName}`,
            status:                 'active',
            expires_at:             expiresAt.toISOString(),
          });

          replyText += `\n${paymentLink.url}`;
        } catch (linkErr) {
          console.error('SMS payment link generation error:', linkErr);
          // Still send the message without the link; agent can follow up
        }
      }

      // Cap at 480 chars for SMS
      replyText = replyText.slice(0, 480).trim();

      await supabase.from('conversations').insert({
        debtor_id:  debtor.id,
        company_id: companyId,
        channel:    'sms',
        direction:  'outbound',
        content:    replyText,
      });

      return res.type('text/xml').send(xmlReply(replyText));
    }

    // AI is paused — still store the inbound message, but send no auto-reply
    await supabase.from('conversations').insert({
      debtor_id:  debtor.id,
      company_id: companyId,
      channel:    'sms',
      direction:  'inbound',
      content:    body,
    });
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
