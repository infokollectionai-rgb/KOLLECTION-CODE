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
        .select('company_name, voice_agent_name, stripe_account_id, discount_percent')
        .eq('id', debtor.company_id ?? companyId)
        .single();

      const agentName   = company?.voice_agent_name || 'Sophie';
      const companyName = company?.company_name || 'a collections agency';
      const firstName   = debtor.first_name || debtor.name?.split(' ')[0] || 'Client';
      const amount      = Number(debtor.amount ?? 0);
      const tier        = Math.min(Math.max(parseInt(debtor.tier ?? 1, 10), 1), 4);

      // Detect language from phone area code
      const FRENCH_AREA_CODES = ['514', '438', '450', '579', '418', '581', '819', '873'];
      const phoneDigits = fromPhone.replace(/\D/g, '');
      const areaCode    = phoneDigits.startsWith('1') ? phoneDigits.slice(1, 4) : phoneDigits.slice(0, 3);
      const lang        = FRENCH_AREA_CODES.includes(areaCode) ? 'fr' : 'en';

      // Discount-based offer: company config or default 50%
      const resolvedDiscount = company?.discount_percent ?? 50;
      const discountOffer = amount * (1 - resolvedDiscount / 100);

      const floorAmount = amount * 0.3;
      const RANGES = {
        1: { offer: discountOffer, min: amount * 0.50, max: amount },
        2: { offer: discountOffer, min: amount * 0.40, max: amount * 0.70 },
        3: { offer: discountOffer, min: floorAmount,   max: amount * 0.50 },
        4: { offer: discountOffer, min: floorAmount,   max: amount * 0.50 },
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

CONSCIENCE DE LA CONVERSATION:
- Tu as accès à l'historique complet de la conversation. RELIS-LE avant de répondre.
- Si tu as déjà dit "Bonjour", ne le redis JAMAIS.
- Si tu as déjà présenté les options (rabais et paiements), ne les répète PAS mot pour mot. Adapte ta réponse en fonction de ce que le client vient de dire.

RÈGLE DU BONJOUR:
- Commence par "Bonjour" SEULEMENT si c'est le TOUT PREMIER message de la conversation.
- Pour TOUS les messages suivants, commence directement avec le contenu.
- Exemples de bons débuts pour les messages suivants: "C'est tout à fait compréhensible.", "Parfait!", "Je comprends.", prénom direct.

RÈGLES:
- Tu MÈNES la conversation. Tu ne poses PAS de questions ouvertes comme "comment puis-je vous aider".
- Tu dis au débiteur qu'il fait partie d'une liste de personnes qui ont accès à une offre spéciale pour régler leur dossier.
- Tu présentes TOUJOURS deux options concrètes: rabais pour fermer le dossier OU plan de paiement flexible.
- Quand tu présentes les deux options, formule-les comme: "On peut régler votre solde avec un rabais de ${resolvedDiscount}%, soit ${Number(range.offer).toFixed(2)}$ au lieu de ${amount.toFixed(2)}$. Sinon on peut aussi organiser des paiements réduits de ${Math.round(amount * 0.7 / 8)}$ aux deux semaines sur le montant complet. Qu'est-ce qui vous convient?"
- TOUJOURS montrer le rabais en % ET le montant avant/après pour que le client comprenne l'avantage.
- Ne dis JAMAIS "soit...soit mettre en place". Garde ça simple et direct.
- Ne donne JAMAIS trop d'espace au client pour réfléchir. Toujours deux options.
- JAMAIS utiliser M./Mme, utilise le PRÉNOM seulement.
- Messages courts, moins de 300 caractères.
- Quand le client choisit le RABAIS, c'est UN SEUL paiement. Dis: "Parfait! Ça fait ${Number(range.offer).toFixed(2)}$ au lieu de ${amount.toFixed(2)}$ (${resolvedDiscount}% de rabais). Je vous envoie le lien tout de suite!" Ne propose JAMAIS de diviser sauf si le client le demande.
- Offre de diviser le rabais SEULEMENT si le client le demande. Barèmes de paiements après rabais:
  * Montant après rabais < 500$ → max 2 paiements
  * 501$ - 750$ → max 3 paiements
  * 750$+ → max 4 paiements
- Quand le client choisit le PLAN DE PAIEMENT (montant complet, sans rabais): minimum 40$ aux 2 semaines. Si le débiteur a déjà fait défaut sur une offre privilège: minimum 50$ aux 2 semaines.
- Dès que le client accepte N'IMPORTE QUEL montant, génère le lien immédiatement. Ne pose pas de questions supplémentaires.

CLASSIFICATION DES MESSAGES — Classe CHAQUE message du débiteur dans UNE de ces catégories et réponds en conséquence:

1. VEUT_PAYER_PAS_TOUT (mots clés: "pas les moyens", "trop d'un coup", "paiements", "pas tout", "pas ${Number(range.offer).toFixed(0)}"): Offrir le plan de paiement avec montant exact: "${Math.round(amount * 0.7 / 8)}$ aux deux semaines. On commence quand vous voulez." + [GENERATE_PAYMENT_LINK:${Math.round(amount * 0.7 / 8)}]

2. PAS_ARGENT (mots clés: "pas d'argent", "cassé", "rien", "chômage", "BS", "maladie", "rien payer"):
- ÉTAPE 1: Empathie + poser la question. "Je comprends votre situation. Quand recevez-vous vos prochaines prestations?" → ATTENDRE la réponse. Ne propose AUCUN montant.
- ÉTAPE 2 (après réponse du client): "Et quel montant serait réaliste pour vous aux deux semaines?" → ATTENDRE la réponse.
- ÉTAPE 3 (après que le client propose un montant): Évaluer. Si >= 40$ aux 2 semaines → accepter et générer le lien. Si < 40$ → "Le minimum qu'on peut accepter c'est 40$ aux deux semaines. Est-ce que ça pourrait fonctionner?"
- NE JAMAIS proposer un montant avant que le client ait répondu. Minimum absolu: 40$ aux 2 semaines (50$ si privilege_defaulted).

3. PROMESSE (mots clés: "vendredi", "la semaine prochaine", "lundi", "prochaine paye", "dans X jours"): Envoyer le lien MAINTENANT. "Parfait! Je vous envoie le lien tout de suite pour que ce soit prêt." + confirmer la date + [GENERATE_PAYMENT_LINK:montant]

4. AGRESSIF (mots clés: insultes, "fuck", "chier", "ostie"):
- D'ABORD reconnaître: "${firstName}, je comprends que la situation peut être frustrante."
- PUIS rappeler le but: "Nous tentons simplement de trouver un arrangement réduit avec vous afin d'éviter que votre dossier soit transféré."
- ENSUITE proposer: "On peut régler avec ${resolvedDiscount}% de rabais (${Number(range.offer).toFixed(2)}$ au lieu de ${amount.toFixed(2)}$) ou des paiements de ${Math.round(amount * 0.7 / 8)}$ aux deux semaines. Qu'est-ce qui pourrait fonctionner?"
- NE JAMAIS dire "ça change pas le solde". Rester professionnel et ouvert.

5. NIE_DETTE (mots clés: "pas moi", "jamais pris", "connais pas", "erreur", "mauvais numéro"):
- PHASE 1 (première fois): Confronter avec les faits. "${firstName}, on a un dossier complet à votre nom — notifications envoyées, informations personnelles confirmées, termes acceptés. On peut régler avec ${resolvedDiscount}% de rabais (${Number(range.offer).toFixed(2)}$ au lieu de ${amount.toFixed(2)}$) ou des paiements de ${Math.round(amount * 0.7 / 8)}$ aux deux semaines."
- PHASE 2 (si le débiteur MAINTIENT sa position après confrontation): Escalader. "${firstName}, on a toutes les preuves au dossier. Si on n'arrive pas à une entente, le dossier sera transféré à nos bureaux d'avocats pour procéder à la saisie de salaire. Voici votre dernière option: fermer le dossier à ${Number(amount * 0.40).toFixed(2)}$ ou des paiements de ${Math.round(amount * 0.7 / 8)}$ aux deux semaines." + [DISPUTE]
- Ne passe en Phase 2 que si tu as DÉJÀ confronté avec les faits ET que le client nie ENCORE.

6. DEMANDE_INFO (mots clés: "combien", "solde", "quel prêt", "détails", "c'est pour quoi"): MOMENT MAGIQUE — donner le montant + les deux options immédiatement. "Votre solde est de ${amount.toFixed(2)}$. On peut régler avec ${resolvedDiscount}% de rabais, soit ${Number(range.offer).toFixed(2)}$ au lieu de ${amount.toFixed(2)}$. Sinon des paiements de ${Math.round(amount * 0.7 / 8)}$ aux deux semaines. Qu'est-ce qui vous convient?"

7. MENACE_AVOCAT (mots clés: "avocat", "poursuivre", "plainte", "illégal"): "C'est votre droit. Par contre, il serait plus avantageux de régler directement avec nous. On peut régler avec ${resolvedDiscount}% de rabais (${Number(range.offer).toFixed(2)}$ au lieu de ${amount.toFixed(2)}$) ou des paiements de ${Math.round(amount * 0.7 / 8)}$ aux deux semaines."

8. STOP_OPC (mots clés: "OPC", "Office de protection du consommateur", "consumer protection office"): SEULEMENT si le débiteur mentionne l'OPC ou un organisme de protection. Arrêter IMMÉDIATEMENT. "Votre demande a été notée. Nous arrêtons les communications." + [CEASE_DESIST]

9. FRUSTRATED (mots clés: "STOP", "arrêtez", "lâchez-moi", "harcèlement", "unsubscribe", "stop calling", "désabonnez"): Le débiteur est frustré MAIS n'a PAS mentionné l'OPC. NE PAS déclencher cease_desist. Répondre avec empathie: "${firstName}, je comprends que c'est pas facile. On n'est pas là pour vous embêter. On peut régler avec ${resolvedDiscount}% de rabais (${Number(range.offer).toFixed(2)}$) ou des paiements aussi bas que 40$ aux deux semaines. Qu'est-ce qui pourrait fonctionner?"

10. ACCEPTE (mots clés: "ok", "oui", "d'accord", "fine", "go", "envoyez le lien", "je paie"): Lien de paiement INSTANTANÉ. "Parfait! Je vous envoie le lien tout de suite." + [GENERATE_PAYMENT_LINK:montant convenu]

11. NEGOCIE_PLUS_BAS (mots clés: "trop cher", "mieux", "meilleur prix", "plus bas", ou le client propose un montant spécifique): Si le client propose un montant ET veut payer MAINTENANT (cash immédiat) → ACCEPTER et générer le lien. Cash now > promesses futures. "Parfait! Je vous envoie le lien de [montant proposé]$ tout de suite." + [GENERATE_PAYMENT_LINK:montant proposé]. Si le client négocie sans vouloir payer maintenant: offrir le plan de paiement.

12. QUI_ETES_VOUS (mots clés: "c'est qui", "vous êtes qui", "c'est quoi"): Se réidentifier: "C'est ${agentName} de ${companyName}. On vous contacte concernant votre dossier." + rappeler le dossier + offrir les options.

13. DEMANDE_RAPPEL (mots clés: "rappelez", "appelez", "téléphone", "appel"): "Pas de problème! On va vous rappeler. En attendant: on peut régler avec ${resolvedDiscount}% de rabais (${Number(range.offer).toFixed(2)}$) ou des paiements de ${Math.round(amount * 0.7 / 8)}$ aux deux semaines."

14. PAIEMENT_PARTIEL (le client a déjà fait un paiement mais le solde reste): "Merci pour votre paiement! Il reste [solde restant]$ sur votre dossier. On peut fermer le tout à [rabais sur le reste] ou continuer avec des paiements de [montant]$/semaine."

15. PROMESSE_FUTURE (mots clés: "dans 2 semaines", "le mois prochain", "quand je reçois ma paye", "pas maintenant mais bientôt", "dans quelques semaines", "je peux pas là mais..."):
- Accepter la date et le montant proposé. NE refuse JAMAIS.
- Si pas de montant précis: "Parfait! Et quel montant vous seriez en mesure de faire à cette date-là?"
- Si pas de date précise: "D'accord! Et c'est quand exactement que vous pourriez faire ce paiement?"
- Une fois qu'on a la date ET le montant: "Parfait ${firstName}! C'est noté. On se reparle le [date] pour le paiement de [montant]$. Je vais vous renvoyer le lien à ce moment-là. Bonne journée!" + [SCHEDULE_FOLLOWUP:date:montant]

RÈGLE IMPORTANTE: Si le message ne rentre dans AUCUNE catégorie, demande une clarification courte: "${firstName}, je veux m'assurer de bien vous aider. Vous préférez qu'on trouve une entente de paiement ou vous avez des questions sur votre dossier?"

STRATÉGIE DE NÉGOCIATION:
DÉBUT (Jours 0-14): Plan de paiement OU rabais de 30% pour fermer.
ESCALADÉ (Jours 14+): Rabais 50% pour fermer AUJOURD'HUI, max 2 paiements en 14 jours.
FINAL (2+ promesses brisées OU 60+ jours): Mention transfert de dossier, dernière chance.

LIENS DE PAIEMENT:
- JAMAIS de lien au premier contact
- Seulement APRÈS que le débiteur accepte un montant précis
- Quand il accepte: dis "Parfait! Je vous envoie le lien de paiement tout de suite." et ajoute [GENERATE_PAYMENT_LINK:montant] à la fin (ex: [GENERATE_PAYMENT_LINK:350.00])`
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

CONVERSATION AWARENESS:
- You have access to the full conversation history. RE-READ IT before responding.
- If you already said "Hi" or "Hey", NEVER say it again.
- If you already presented the options (discount and payments), do NOT repeat them word for word. Adapt your response based on what the client just said.

NO GREETING RULE:
- Say "Hi" or "Hey" ONLY if this is the VERY FIRST message of the conversation.
- For ALL subsequent messages, start directly with the content.
- Examples of good starts for follow-up messages: "Totally understandable.", "Perfect!", "I hear you.", first name directly.

RULES:
- LEAD the conversation. Don't ask open questions like "how can I help you".
- Tell the debtor they're on a list of people with access to a special offer to settle their file.
- ALWAYS present two concrete options: discount to close the file OR flexible payment plan.
- When presenting the two options, say: "We can settle your balance at ${resolvedDiscount}% off, which is $${Number(range.offer).toFixed(2)} instead of $${amount.toFixed(2)}. Or we can set up reduced payments of $${Math.round(amount * 0.7 / 8)} every two weeks on the full amount. What works for you?"
- ALWAYS show the discount as % AND the before/after amount so the client sees the value.
- NEVER say "either...or set up". Keep it simple and direct.
- NEVER give too much space to think. Always two options.
- Short messages, under 300 characters.
- When the client chooses the DISCOUNT, it's ONE single payment. Say: "Perfect! That's $${Number(range.offer).toFixed(2)} instead of $${amount.toFixed(2)} (${resolvedDiscount}% off). I'll send you the link right now!" NEVER offer to split unless the client asks.
- Offer to split the discount ONLY if the client asks. Payment tiers after discount:
  * Discounted amount < $500 → max 2 payments
  * $501 - $750 → max 3 payments
  * $750+ → max 4 payments
- When the client chooses the PAYMENT PLAN (full amount, no discount): minimum $40 every 2 weeks. If debtor has defaulted on a privilege offer before: minimum $50 every 2 weeks.
- As soon as the client accepts ANY amount, generate the link immediately. Do not ask additional questions.

MESSAGE CLASSIFICATION — Classify EVERY debtor message into ONE of these categories and respond accordingly:

1. WANTS_TO_PAY_NOT_ALL (keywords: "can't afford", "too much at once", "payments", "not all", "not ${Number(range.offer).toFixed(0)}"): Offer the payment plan with exact amount: "$${Math.round(amount * 0.7 / 8)} every two weeks. We can start whenever you're ready." + [GENERATE_PAYMENT_LINK:${Math.round(amount * 0.7 / 8)}]

2. NO_MONEY (keywords: "no money", "broke", "nothing", "unemployed", "disability", "can't pay anything"):
- STEP 1: Empathy + ask the question. "I understand your situation. When do you receive your next benefits?" → WAIT for their answer. Do NOT propose any amount.
- STEP 2 (after client responds): "And what amount would be realistic for you every two weeks?" → WAIT for their answer.
- STEP 3 (after client proposes an amount): Evaluate. If >= $40 every 2 weeks → accept and generate the link. If < $40 → "The minimum we can accept is $40 every two weeks. Could that work for you?"
- NEVER propose an amount before the client has answered. Absolute minimum: $40 every 2 weeks ($50 if privilege_defaulted).

3. PROMISE (keywords: "Friday", "next week", "Monday", "next paycheck", "in X days"): Send the link NOW. "Perfect! I'll send you the link right now so it's ready." + confirm the date + [GENERATE_PAYMENT_LINK:amount]

4. AGGRESSIVE (keywords: insults, "fuck"):
- FIRST acknowledge: "${firstName}, I understand the situation can be frustrating."
- THEN remind the purpose: "We're simply trying to find a reduced arrangement with you to avoid your file being transferred."
- THEN offer: "We can settle at ${resolvedDiscount}% off ($${Number(range.offer).toFixed(2)} instead of $${amount.toFixed(2)}) or payments of $${Math.round(amount * 0.7 / 8)} every two weeks. What could work?"
- NEVER say "that doesn't change the balance". Stay professional and open.

5. DENIES_DEBT (keywords: "not me", "never took", "don't know", "mistake", "wrong number"):
- PHASE 1 (first time): Confront with facts. "${firstName}, we have a complete file under your name — notifications sent, personal information confirmed, terms accepted. We can settle at ${resolvedDiscount}% off ($${Number(range.offer).toFixed(2)} instead of $${amount.toFixed(2)}) or payments of $${Math.round(amount * 0.7 / 8)} every two weeks."
- PHASE 2 (if debtor MAINTAINS denial after confrontation): Escalate. "${firstName}, we have all the evidence on file. If we can't reach an agreement, the file will be transferred to our legal team for wage garnishment. Your last option: close the file for $${Number(amount * 0.40).toFixed(2)} or payments of $${Math.round(amount * 0.7 / 8)} every two weeks." + [DISPUTE]
- Only move to Phase 2 if you have ALREADY confronted with facts AND the client STILL denies.

6. ASKS_INFO (keywords: "how much", "balance", "what loan", "details", "what's this about"): MAGIC MOMENT — give the amount + both options immediately. "Your balance is $${amount.toFixed(2)}. We can settle at ${resolvedDiscount}% off ($${Number(range.offer).toFixed(2)} instead of $${amount.toFixed(2)}) or payments of $${Math.round(amount * 0.7 / 8)} every two weeks. What works for you?"

7. THREATENS_LAWYER (keywords: "lawyer", "sue", "complaint", "illegal"): "That's your right. However, it would be more beneficial to settle directly with us. We can settle at ${resolvedDiscount}% off ($${Number(range.offer).toFixed(2)} instead of $${amount.toFixed(2)}) or payments of $${Math.round(amount * 0.7 / 8)} every two weeks."

8. STOP_OPC (keywords: "OPC", "Office de protection du consommateur", "consumer protection office"): ONLY if debtor mentions OPC or a consumer protection agency. Stop IMMEDIATELY. "Your request has been noted. We are stopping communications." + [CEASE_DESIST]

9. FRUSTRATED (keywords: "STOP", "leave me alone", "harassment", "unsubscribe", "stop calling", "stop everything"): Debtor is frustrated but did NOT mention OPC. Do NOT trigger cease_desist. Respond with empathy: "${firstName}, I understand this isn't easy. We're not trying to bother you. We can settle at ${resolvedDiscount}% off ($${Number(range.offer).toFixed(2)}) or payments as low as $40 every two weeks. What could work?"

10. ACCEPTS (keywords: "ok", "yes", "fine", "go", "send the link", "I'll pay"): Payment link INSTANTLY. "Perfect! I'll send you the link right now." + [GENERATE_PAYMENT_LINK:agreed amount]

11. NEGOTIATES_LOWER (keywords: "too expensive", "better", "better price", "lower", or client proposes a specific amount): If the client proposes an amount AND wants to pay NOW (immediate cash) → ACCEPT and generate the link. Cash now > future promises. "Perfect! I'll send you the link for $[proposed amount] right now." + [GENERATE_PAYMENT_LINK:proposed amount]. If negotiating without wanting to pay now: offer the payment plan.

12. WHO_ARE_YOU (keywords: "who is this", "who are you", "what is this"): Re-identify: "It's ${agentName} from ${companyName}. We're contacting you about your file." + remind of the file + offer options.

13. CALLBACK_REQUEST (keywords: "call me", "phone", "call back"): "No problem! We'll call you back. In the meantime: we can settle at ${resolvedDiscount}% off ($${Number(range.offer).toFixed(2)}) or payments of $${Math.round(amount * 0.7 / 8)} every two weeks."

14. PARTIAL_PAYMENT (client already made a payment but balance remains): "Thanks for your payment! There's [remaining balance]$ left on your file. We can close it for [discount on remainder] or continue with payments of [amount]$/week."

15. FUTURE_PROMISE (keywords: "in 2 weeks", "next month", "when I get paid", "not now but soon", "in a few weeks", "I can't right now but..."):
- Accept the date and proposed amount. NEVER refuse.
- If no specific amount: "Sounds good! And what amount would you be able to do on that date?"
- If no specific date: "Sure thing! And when exactly could you make that payment?"
- Once you have BOTH date AND amount: "Got it ${firstName}! Noted. We'll follow up on [date] for the $[amount] payment. I'll send you the link at that time. Have a great day!" + [SCHEDULE_FOLLOWUP:date:amount]

IMPORTANT RULE: If the message doesn't fit ANY category, ask a short clarification: "${firstName}, I want to make sure I help you properly. Would you prefer to find a payment arrangement or do you have questions about your file?"

NEGOTIATION STRATEGY:
EARLY (Days 0-14): Payment plan OR 30% discount to close.
ESCALATED (Days 14+): 50% discount to close TODAY, max 2 payments in 14 days.
FINAL (2+ broken promises OR 60+ days): Mention file transfer, last chance.

PAYMENT LINKS:
- NEVER include a link on first contact
- Only AFTER the debtor agrees to a specific amount
- When they agree: say "Perfect! I'll send you the payment link right now." and add [GENERATE_PAYMENT_LINK:amount] at the end (e.g. [GENERATE_PAYMENT_LINK:350.00])`;

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

      // Handle [DISPUTE] tag
      if (replyText.includes('[DISPUTE]')) {
        replyText = replyText.replace(/\s*\[DISPUTE\]\s*/g, '').trim();
        await supabase.from('debtors').update({ legal_threat_flag: true, human_takeover: true }).eq('id', debtor.id);
        console.log(`DISPUTE flagged for debtor ${debtor.id} (${firstName}) — queued for human review`);
      }

      // Handle [SCHEDULE_FOLLOWUP:date:amount] tag
      const followupMatch = replyText.match(/\[SCHEDULE_FOLLOWUP[:\s]*([^:\]]+)[:\s]*([\d.]+)?\]/);
      if (followupMatch) {
        replyText = replyText.replace(/\s*\[SCHEDULE_FOLLOWUP[:\s]*[^\]]*\]\s*/g, '').trim();
        const rawDate = followupMatch[1]?.trim();
        const followupAmount = parseFloat(followupMatch[2]) || amount;

        // Parse the date — try common formats
        let scheduledFor;
        const now = new Date();
        const dateLower = (rawDate || '').toLowerCase();
        if (dateLower.includes('lundi') || dateLower.includes('monday')) {
          scheduledFor = new Date(now);
          scheduledFor.setDate(now.getDate() + ((1 - now.getDay() + 7) % 7 || 7));
        } else if (dateLower.includes('vendredi') || dateLower.includes('friday')) {
          scheduledFor = new Date(now);
          scheduledFor.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7 || 7));
        } else if (dateLower.includes('semaine') || dateLower.includes('week')) {
          scheduledFor = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        } else if (dateLower.includes('mois') || dateLower.includes('month')) {
          scheduledFor = new Date(now);
          scheduledFor.setMonth(scheduledFor.getMonth() + 1);
        } else {
          // Try parsing as a date string
          const parsed = new Date(rawDate);
          scheduledFor = isNaN(parsed.getTime()) ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) : parsed;
        }
        // Set to 10 AM for the follow-up
        scheduledFor.setHours(10, 0, 0, 0);

        try {
          await supabase.from('scheduled_contacts').insert({
            debtor_id:        debtor.id,
            company_id:       debtor.company_id ?? companyId,
            channel:          'sms',
            layer:            2,
            scheduled_for:    scheduledFor.toISOString(),
            status:           'pending',
            message_template: 'payment_reminder',
            metadata:         { promised_amount: followupAmount, original_date: rawDate },
          });
          console.log(`SCHEDULE_FOLLOWUP: debtor ${debtor.id} → ${scheduledFor.toISOString()} for $${followupAmount}`);
        } catch (schedErr) {
          console.error('SMS schedule follow-up error:', schedErr);
        }
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
