const express    = require('express');
const router     = express.Router();
const Anthropic  = require('@anthropic-ai/sdk');
const twilio     = require('twilio');
const sgMail     = require('@sendgrid/mail');
const { v4: uuidv4 } = require('uuid');

const Stripe     = require('stripe');

const supabase                 = require('../database/supabase');
const { checkContactAllowed }  = require('../middleware/compliance');
const { decrypt }              = require('../utils/encryption');
const { generatePaymentLink, buildVoiceSystemPrompt } = require('../services/worker');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const stripe    = new Stripe(process.env.STRIPE_SECRET_KEY);

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

/**
 * Safely decrypt — only if value looks encrypted (ivHex:ciphertextHex).
 * Returns raw value if already plaintext.
 */
function safeDecrypt(value) {
  if (!value) return null;
  if (/^[0-9a-fA-F]{32}:[0-9a-fA-F]+$/.test(value)) {
    try { return decrypt(value); } catch { return value; }
  }
  return value;
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
    twilio_auth_token: safeDecrypt(data.twilio_auth_token),
    sendgrid_api_key:  safeDecrypt(data.sendgrid_api_key),
    vapi_api_key:      safeDecrypt(data.vapi_api_key),
    vapi_assistant_id: safeDecrypt(data.vapi_assistant_id),
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
    `Hi ${first}, this is ${agentName ?? 'Sophie'} from ${companyName}. ` +
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
    `My name is ${agentName ?? 'Sophie'} from ${companyName}. ` +
    `We are reaching out regarding your outstanding balance of ${amtStr}.\n\n` +
    `We want to work with you to find a resolution. Please reply to this email ` +
    `or contact us directly to discuss your repayment options.\n\n` +
    `Sincerely,\n${agentName ?? 'Sophie'}\n${companyName}`;
  const html =
    `<p>Hi ${first},</p>` +
    `<p>My name is <strong>${agentName ?? 'Sophie'}</strong> from <strong>${companyName}</strong>. ` +
    `We are reaching out regarding your outstanding balance of <strong>${amtStr}</strong>.</p>` +
    `<p>We want to work with you to find a resolution. Please reply to this email ` +
    `or contact us directly to discuss your repayment options.</p>` +
    `<p>Sincerely,<br>${agentName ?? 'Sophie'}<br>${companyName}</p>`;
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
    agentName = 'Sophie',
    companyId,
    paymentLinkUrl,
    customRules,
    debtorName,
    discountPercent,
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
    .select('business_phone, company_name, voice_agent_name, discount_percent')
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
  const debtorFirstName = debtorName || (debtorRecord?.first_name ?? debtorRecord?.name?.split(' ')[0] ?? 'Client');
  const debtorLastName = debtorRecord?.name?.split(' ').slice(1).join(' ') ?? '';

  // Detect language from debtor phone area code
  const FRENCH_AREA_CODES = ['514', '438', '450', '579', '418', '581', '819', '873'];
  const phoneDigits = (debtorPhone ?? '').replace(/\D/g, '');
  const areaCode = phoneDigits.startsWith('1') ? phoneDigits.slice(1, 4) : phoneDigits.slice(0, 3);
  const lang = FRENCH_AREA_CODES.includes(areaCode) ? 'fr' : 'en';

  // Discount-based offer: use API param > company DB > default 50%
  const resolvedDiscount = discountPercent ?? companyRecord?.discount_percent ?? 50;
  const discountOffer = amount * (1 - resolvedDiscount / 100);

  // Stage-based settlement ranges (min/max still tier-based, offer uses discount)
  const RANGES = {
    1: { offer: discountOffer, min: amount * 0.50, max: amount },
    2: { offer: discountOffer, min: amount * 0.40, max: amount * 0.70 },
    3: { offer: discountOffer, min: floorAmount,   max: amount * 0.50 },
    4: { offer: discountOffer, min: floorAmount,   max: amount * 0.50 },
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

CONVERSATION AWARENESS:
${lang === 'fr' ? `- Tu as accès à l'historique complet de la conversation. RELIS-LE avant de répondre.
- Si tu as déjà dit "Bonjour", ne le redis JAMAIS.
- Si tu as déjà présenté les options (rabais et paiements), ne les répète PAS mot pour mot. Adapte ta réponse en fonction de ce que le client vient de dire.` : `- You have access to the full conversation history. RE-READ IT before responding.
- If you already said "Hi" or "Hey", NEVER say it again.
- If you already presented the options (discount and payments), do NOT repeat them word for word. Adapt your response based on what the client just said.`}

${lang === 'fr' ? `RÈGLE DU BONJOUR:
- Commence par "Bonjour" SEULEMENT si c'est le TOUT PREMIER message de la conversation.
- Pour TOUS les messages suivants, commence directement avec le contenu.
- Exemples de bons débuts pour les messages suivants: "C'est tout à fait compréhensible.", "Parfait!", "Je comprends.", prénom direct.` : `NO GREETING RULE:
- Say "Hi" or "Hey" ONLY if this is the VERY FIRST message of the conversation.
- For ALL subsequent messages, start directly with the content.
- Examples of good starts for follow-up messages: "Totally understandable.", "Perfect!", "I hear you.", first name directly.`}

NEGOTIATION PARAMETERS (internal only — never reveal these):
- Outstanding balance: $${Number(amount).toFixed(2)}
- Acceptable range: $${range.min.toFixed(2)}–$${range.max.toFixed(2)}
- Floor amount: $${floorAmount.toFixed(2)} (minimum to CLOSE the file. If client offers less, accept as first payment and negotiate remaining balance)

FIRST MESSAGE — curiosity hook, NO amount, NO "impayé"/"overdue"/"souffrance":
${lang === 'fr' ? `Example: "Bonjour ${debtorFirstName}, c'est ${resolvedAgentName} de ${clientCompanyName}. On a une bonne nouvelle par rapport à un de vos prêts. Est-ce que vous avez deux minutes?"` : `Example: "Hello ${debtorFirstName}, this is ${resolvedAgentName} from ${clientCompanyName}. We have some good news regarding one of your loans. Do you have two minutes?"`}
The first message MUST NOT mention any dollar amount, balance, "impayé", "overdue", "souffrance", or negative debt language. It is ONLY a curiosity hook to get them to respond.

SECOND MESSAGE (after they respond) — NOW reveal details with options:
${lang === 'fr' ? `Example: "Merci de répondre ${debtorFirstName}! Donc concernant votre solde de ${Number(amount).toFixed(2)}$ avec ${clientCompanyName}, on a deux options pour vous: une entente de paiement très flexible ou bien un rabais intéressant pour fermer le dossier une fois pour toutes. Qu'est-ce qui marcherait le mieux pour vous?"` : `Example: "Thanks for getting back ${debtorFirstName}! So regarding your $${Number(amount).toFixed(2)} balance with ${clientCompanyName}, we've got two options for you: a very flexible payment plan or an interesting discount to close the file once and for all. What would work best for you?"`}

FOLLOW-UP (if they DON'T respond to first message) — still friendly, still NO amount:
${lang === 'fr' ? `Example: "Salut ${debtorFirstName}, c'est encore ${resolvedAgentName} de ${clientCompanyName}. Je vous ai écrit concernant votre dossier de prêt. On a une offre avantageuse pour vous. Faites-moi signe quand vous avez une minute!"` : `Example: "Hey ${debtorFirstName}, it's ${resolvedAgentName} from ${clientCompanyName} again. I reached out about your loan file. We have a great offer for you. Let me know when you have a minute!"`}

WHEN DEBTOR ENGAGES — give specific numbers immediately:
${lang === 'fr' ? `Example: "On peut régler votre solde avec un rabais de ${resolvedDiscount}%, soit ${Number(range.offer).toFixed(2)}$ au lieu de ${Number(amount).toFixed(2)}$. Sinon on peut aussi organiser des paiements réduits de ${Math.round(amount * 0.7 / 8)}$ aux deux semaines sur le montant complet. Qu'est-ce qui vous convient?"` : `Example: "We can settle your balance at ${resolvedDiscount}% off, which is $${Number(range.offer).toFixed(2)} instead of $${Number(amount).toFixed(2)}. Or we can set up reduced payments of $${Math.round(amount * 0.7 / 8)} every two weeks on the full amount. What works for you?"`}
${lang === 'fr' ? `Garde ça simple et direct. TOUJOURS montrer le rabais en % ET le montant avant/après.` : `Keep it simple and direct. ALWAYS show the discount as % AND the before/after amount.`}

${lang === 'fr' ? `QUAND LE CLIENT CHOISIT LE RABAIS: c'est UN SEUL paiement. Dis: "Parfait ${debtorFirstName}! Ça fait ${Number(range.offer).toFixed(2)}$ au lieu de ${Number(amount).toFixed(2)}$ (${resolvedDiscount}% de rabais). Je vous envoie le lien maintenant. Confirmez-moi lorsque c'est fait." Ne propose JAMAIS de diviser sauf si le client le demande. Maximum 2 versements sur 14 jours si demandé.` : `WHEN THE CLIENT CHOOSES THE DISCOUNT: it's ONE single payment. Say: "Great ${debtorFirstName}! That's $${Number(range.offer).toFixed(2)} instead of $${Number(amount).toFixed(2)} (${resolvedDiscount}% off). I'm sending you the link now. Please confirm once it's done." NEVER offer to split unless the client asks. Maximum 2 payments over 14 days if asked.`}

${lang === 'fr' ? `QUAND LE CLIENT CHOISIT LE PLAN DE PAIEMENT: donne le montant exact par semaine ou 2 semaines et demande de confirmer pour envoyer le lien du premier versement.` : `WHEN THE CLIENT CHOOSES THE PAYMENT PLAN: give the exact amount per week or every 2 weeks and ask to confirm so you can send the first payment link.`}

${lang === 'fr' ? `Dès que le client accepte N'IMPORTE QUEL montant, génère le lien immédiatement. Ne pose pas de questions supplémentaires.` : `As soon as the client accepts ANY amount, generate the link immediately. Do not ask additional questions.`}

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

${lang === 'fr' ? `CLASSIFICATION DES MESSAGES — Classe CHAQUE message du débiteur dans UNE de ces catégories et réponds en conséquence:

1. VEUT_PAYER_PAS_TOUT ("pas les moyens", "trop d'un coup", "paiements", "pas tout"): Offrir le plan de paiement: "${Math.round(amount * 0.7 / 8)}$ aux deux semaines. On commence quand vous voulez." + generatePaymentLink=true, paymentLinkAmount=${Math.round(amount * 0.7 / 8)}

2. PAS_ARGENT / CHÔMAGE / PRESTATIONS ("pas d'argent", "cassé", "chômage", "BS", "maladie", "arrêt de travail", "RQAP"):
- "Quand avez-vous fait votre demande exactement?" → ATTENDRE.
- Si date connue → suivi 25 jours ouvrables après. Si pas de date → suivi la semaine prochaine.
- Lien SEULEMENT quand prêt à payer MAINTENANT. Min: 40$/2 sem (50$ si défaut).

3. PROMESSE ("vendredi", "la semaine prochaine", "lundi", "prochaine paye"): Envoyer le lien MAINTENANT + confirmer la date. generatePaymentLink=true

4. AGRESSIF (insultes, "fuck", "chier", "ostie"):
- "${debtorFirstName}, notre but n'est vraiment pas de vous harceler. On est là pour vous aider à régler cette situation le plus simplement possible et justement pour que vous n'ayez plus à recevoir nos suivis. On a une solution qui pourrait régler tout ça rapidement. Est-ce que je peux vous l'expliquer?"
- ATTENDRE que le client dise oui. PAS de montants dans ce message.

5. NIE_DETTE ("pas moi", "jamais pris", "connais pas", "erreur", "mauvais numéro"):
- PHASE 1: Confronter avec les faits. "${debtorFirstName}, on a un dossier complet — notifications, infos personnelles, termes acceptés. On peut régler avec ${resolvedDiscount}% de rabais (${Number(range.offer).toFixed(2)}$ au lieu de ${Number(amount).toFixed(2)}$) ou paiements de ${Math.round(amount * 0.7 / 8)}$ aux deux semaines."
- PHASE 2 (si maintient): "${debtorFirstName}, on a toutes les preuves. Si aucune entente, transfert aux avocats pour saisie de salaire. Dernière option: ${Number(amount * 0.40).toFixed(2)}$ ou paiements de ${Math.round(amount * 0.7 / 8)}$." + shouldEscalate=true, escalationReason="DISPUTE"

6. DEMANDE_INFO ("combien", "solde", "quel prêt", "détails"): MOMENT MAGIQUE. "${debtorFirstName}, votre solde est de ${Number(amount).toFixed(2)}$. Offre privilège: régler à ${Number(range.offer).toFixed(2)}$ au lieu de ${Number(amount).toFixed(2)}$ (${resolvedDiscount}% de rabais). Sinon paiements réduits sur le montant complet."

7. MENACE_AVOCAT ("avocat", "poursuivre", "plainte", "illégal"): "Que vous contactiez un avocat ou pas, cela ne change pas le solde. Votre avocat verra que la somme est due. Nous sommes ici pour vous éviter tout casse-tête. Si vous refusez, transfert aux avocats pour saisies de salaires. Comment procédez-vous?"

8. STOP_OPC ("OPC", "Office de protection du consommateur"): SEULEMENT si mention de l'OPC. Arrêter. shouldEscalate=true

9. FRUSTRATED ("STOP", "arrêtez", "lâchez-moi", "harcèlement", "désabonnez"): PAS de cease_desist.
- "${debtorFirstName}, notre but n'est vraiment pas de vous harceler. On est là pour vous aider à régler cette situation pour que vous n'ayez plus à recevoir nos suivis. On a une solution rapide. Est-ce que je peux vous l'expliquer?"
- ATTENDRE que le client dise oui. PAS de montants dans ce message.

10. ACCEPTE ("ok", "oui", "d'accord", "je paie"): "Parfait ${debtorFirstName}! Je vous envoie le lien de [montant]$ maintenant. Confirmez-moi lorsque c'est fait." generatePaymentLink=true

11. NEGOCIE_PLUS_BAS ("trop cher", "mieux", "plus bas", ou propose un montant):
- PLANCHER pour FERMER: ${floorAmount.toFixed(2)}$. Le total payé doit atteindre ce montant.
- Si >= ${floorAmount.toFixed(2)}$ ET cash maintenant → ACCEPTER + generatePaymentLink=true, paymentLinkAmount=montant
- Si < ${floorAmount.toFixed(2)}$ → ACCEPTER comme PREMIER PAIEMENT. "On peut accepter [montant]$ comme premier paiement. Il resterait [reste]$ pour fermer au rabais." + generatePaymentLink=true
  Barèmes balance restante: < 500$ = max 2 paiements, 501-750$ = max 3, 750$+ = max 4.

12. QUI_ETES_VOUS ("c'est qui", "vous êtes qui"): "${debtorFirstName}, c'est ${resolvedAgentName} de ${clientCompanyName}. On a une bonne nouvelle par rapport à un de vos prêts. Vous avez deux minutes?" PAS de montant. Attendre confirmation.

13. DEMANDE_RAPPEL ("rappelez", "appelez", "téléphone"): "Pas de problème! En attendant, voici vos options par message."

14. PAIEMENT_PARTIEL (paiement déjà fait, solde reste): "Merci! Il reste [solde]$. Fermer à [rabais] ou paiements."

15. PROMESSE_FUTURE ("dans 2 semaines", "le mois prochain", "quand je reçois ma paye", "pas maintenant mais bientôt"):
- Accepter la date et le montant. NE refuse JAMAIS.
- Si pas de montant: "Parfait! Et quel montant vous seriez en mesure de faire à cette date-là?"
- Si pas de date: "D'accord! Et c'est quand exactement que vous pourriez faire ce paiement?"
- Une fois date ET montant: "Parfait ${debtorFirstName}! C'est noté. On se reparle le [date] pour le paiement de [montant]$. Je vais vous renvoyer le lien à ce moment-là. Bonne journée!"
- Set intent="PROMISE_TO_PAY" dans la réponse JSON

16. S_EN_FOUT ("je m'en fous", "va-y", "fais ce que tu veux", "je paierai pas"): Script escalade légale complet avec saisies de salaires, jugement 10 jours, frais de justice. ATTENDRE réponse.

RÈGLE CASH: Pas d'argent comptant. Lien sécurisé ou virement Interac seulement.
RÈGLE LIEN: Lien SEULEMENT quand prêt à payer MAINTENANT.
RÈGLE PERSPECTIVE: À chaque refus, ramener: "Sachant que votre solde de ${Number(amount).toFixed(2)}$ est dû, on vous offre ${Number(range.offer).toFixed(2)}$ (${resolvedDiscount}% de rabais)."

RÈGLE IMPORTANTE: Si AUCUNE catégorie: "${debtorFirstName}, je veux m'assurer de bien vous aider. Vous préférez qu'on trouve une entente de paiement ou vous avez des questions sur votre dossier?"` : `MESSAGE CLASSIFICATION — Classify EVERY debtor message into ONE of these categories and respond accordingly:

1. WANTS_TO_PAY_NOT_ALL ("can't afford", "too much at once", "payments", "not all"): Offer the payment plan: "$${Math.round(amount * 0.7 / 8)} every two weeks. We can start whenever you're ready." + generatePaymentLink=true, paymentLinkAmount=${Math.round(amount * 0.7 / 8)}

2. NO_MONEY / UNEMPLOYMENT ("no money", "broke", "unemployed", "disability", "EI", "sick leave"):
- "When exactly did you make your claim?" → WAIT.
- If date known → follow-up 25 business days later. If unknown → follow-up next week.
- Link ONLY when ready to pay NOW. Min: $40/2 weeks ($50 if defaulted).

3. PROMISE ("Friday", "next week", "Monday", "next paycheck"): Send the link NOW + confirm the date. generatePaymentLink=true

4. AGGRESSIVE (insults, "fuck"):
- "${debtorFirstName}, we're really not trying to harass you. We're here to help you resolve this as simply as possible so you won't have to hear from us anymore. We have a solution that could settle everything quickly. Can I explain it to you?"
- WAIT for client to say yes. No amounts in this message.

5. DENIES_DEBT ("not me", "never took", "don't know", "mistake", "wrong number"):
- PHASE 1: Confront with facts. "${debtorFirstName}, we have a complete file — notifications, personal info, accepted terms. We can settle at ${resolvedDiscount}% off ($${Number(range.offer).toFixed(2)} instead of $${Number(amount).toFixed(2)}) or payments of $${Math.round(amount * 0.7 / 8)} every two weeks."
- PHASE 2 (if maintains): "${debtorFirstName}, we have all evidence. If no agreement, transfer to legal for wage garnishment. Last option: $${Number(amount * 0.40).toFixed(2)} or payments of $${Math.round(amount * 0.7 / 8)}." + shouldEscalate=true, escalationReason="DISPUTE"

6. ASKS_INFO ("how much", "balance", "what loan", "details"): MAGIC MOMENT. "${debtorFirstName}, your balance is $${Number(amount).toFixed(2)}. Special offer: settle for $${Number(range.offer).toFixed(2)} instead of $${Number(amount).toFixed(2)} (${resolvedDiscount}% off). Or reduced payments on the full amount."

7. THREATENS_LAWYER ("lawyer", "sue", "complaint", "illegal"): "Whether you contact a lawyer or not, the balance is owed. Your lawyer will see that. We're here to help avoid complications. If you refuse, transfer to legal for wage garnishment. How do you proceed?"

8. STOP_OPC ("OPC", "consumer protection office"): ONLY if OPC is mentioned. Stop. shouldEscalate=true

9. FRUSTRATED ("STOP", "leave me alone", "harassment", "unsubscribe", "stop calling"): NO cease_desist.
- "${debtorFirstName}, we're really not trying to harass you. We're here to help resolve this so you won't hear from us anymore. We have a quick solution. Can I explain it?"
- WAIT for client to say yes. No amounts in this message.

10. ACCEPTS ("ok", "yes", "fine", "I'll pay"): "Great ${debtorFirstName}! I'm sending you the $[amount] link now. Please confirm once it's done." generatePaymentLink=true

11. NEGOTIATES_LOWER ("too expensive", "better", "lower", or proposes amount):
- FLOOR to CLOSE: $${floorAmount.toFixed(2)}. Total paid must reach this amount.
- If >= $${floorAmount.toFixed(2)} AND cash now → ACCEPT + generatePaymentLink=true, paymentLinkAmount=amount
- If < $${floorAmount.toFixed(2)} → ACCEPT as FIRST PAYMENT. "We can accept $[amount] as a first payment. $[remaining] left to close at discount." + generatePaymentLink=true
  Tiers on remaining: < $500 = max 2 payments, $501-750 = max 3, $750+ = max 4.

12. WHO_ARE_YOU ("who is this", "who are you"): "${debtorFirstName}, this is ${resolvedAgentName} from ${clientCompanyName}. We have good news about one of your loans. Got two minutes?" No amount. Wait for confirmation.

13. CALLBACK_REQUEST ("call me", "phone"): "No problem! Here are your options by text."

14. PARTIAL_PAYMENT (payment made, balance remains): "Thanks! [balance]$ left. Close for [discount] or payments."

15. FUTURE_PROMISE ("in 2 weeks", "next month", "when I get paid", "not now but soon"):
- Accept the date and amount. NEVER refuse.
- If no amount: "Sounds good! And what amount would you be able to do on that date?"
- If no date: "Sure thing! And when exactly could you make that payment?"
- Once you have BOTH: "Got it ${debtorFirstName}! Noted. We'll follow up on [date] for the $[amount] payment. I'll send you the link at that time. Have a great day!"
- Set intent="PROMISE_TO_PAY" in the JSON response

16. DOESNT_CARE ("I don't care", "go ahead", "do what you want", "I won't pay"): Full legal escalation script — wage garnishment, 10 day judgment, court fees added, no discounts from lawyers. WAIT for response.

CASH RULE: No cash payments. Secure link or Interac e-Transfer only.
LINK RULE: Link ONLY when ready to pay NOW.
PERSPECTIVE RULE: On every refusal: "Given your balance of $${Number(amount).toFixed(2)}, we're offering $${Number(range.offer).toFixed(2)} (${resolvedDiscount}% off)."

IMPORTANT RULE: If no category fits: "${debtorFirstName}, I want to make sure I help you properly. Would you prefer a payment arrangement or do you have questions about your file?"`}

PAYMENT LINKS:
- NEVER include a payment link in the first contact or follow-up outreach
- Payment links are ONLY sent after the debtor explicitly agrees AND is ready to pay NOW
- If client gives a FUTURE date: do NOT set generatePaymentLink=true. The link will be sent at the agreed date.
- When they agree and are ready NOW: set generatePaymentLink=true and paymentLinkAmount to the agreed amount

PAY FREQUENCY: When client mentions pay frequency, set payFrequency in JSON response:
"every week"/"chaque semaine" → "weekly" | "every two weeks"/"aux deux semaines" → "biweekly"
"the 15th and 31st"/"le 15 et le 31" → "bimonthly_15_31" | "the 1st and 15th" → "bimonthly_1_15"
"once a month"/"une fois par mois" → "monthly"

DOCUMENT REQUEST: If client asks for contract/details by email: acknowledge and set shouldRequestDocuments=true in JSON.
LINK NOT WORKING: If client says link doesn't work: offer Interac e-Transfer alternative.

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
      content: `[System: Generate the first message. Say exactly: "${lang === 'fr' ? `Bonjour ${debtorFirstName}, c'est ${resolvedAgentName} de ${clientCompanyName}. On a une bonne nouvelle par rapport à un de vos prêts. Est-ce que vous avez deux minutes?` : `Hello ${debtorFirstName}, this is ${resolvedAgentName} from ${clientCompanyName}. We have some good news regarding one of your loans. Do you have two minutes?`}" Do NOT mention any dollar amount or balance.]`,
    });
  }

  if (customRules && customRules.trim()) {
    systemPrompt += "\n\n=== RÈGLES ADDITIONNELLES (PRIORITÉ HAUTE — TOUJOURS RESPECTER) ===\n" + customRules + "\n=== FIN RÈGLES ===";
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
    agentName = 'Sophie',
    tier      = 1,
    companyId,
  } = req.body;

  if (!debtorId || !phone) {
    return res.status(400).json({ error: 'debtorId and phone are required' });
  }

  // Contact hours check: 8AM–8PM Eastern
  const nowET = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const hourET = nowET.getHours();
  if (hourET < 8 || hourET >= 20) {
    return res.status(400).json({ error: 'Outside contact hours (8AM–8PM ET). Try again during business hours.', code: 'OUTSIDE_HOURS' });
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

    const debtorFirstName = debtorName?.split(' ')[0] ?? '';
    const resolvedCompanyName = companyName ?? creds.company_name ?? 'Collections';
    const resolvedAmount = amount ?? 0;
    const discountAmount = Number(resolvedAmount * 0.70).toFixed(2);
    const paymentAmount  = Math.round(resolvedAmount * 0.7 / 8);

    // Detect language from phone area code
    const FRENCH_AREA_CODES = ['514', '438', '450', '579', '418', '581', '819', '873'];
    const phoneDigits = (phone ?? '').replace(/\D/g, '');
    const areaCode    = phoneDigits.startsWith('1') ? phoneDigits.slice(1, 4) : phoneDigits.slice(0, 3);
    const lang        = FRENCH_AREA_CODES.includes(areaCode) ? 'fr' : 'en';

    const payload = {
      assistantId,
      customer: { number: phone },
      assistantOverrides: {
        firstMessage: `Bonjour, est-ce que je parle bien à ${debtorFirstName}? Hi, am I speaking with ${debtorFirstName}?`,
        model: {
          provider: 'anthropic',
          model:    'claude-sonnet-4-20250514',
          systemPrompt: buildVoiceSystemPrompt({
            firstName:      debtorFirstName,
            agentName,
            companyName:    resolvedCompanyName,
            amount:         resolvedAmount,
            discountAmount,
            paymentAmount,
            lang,
          }),
        },
        variableValues: {
          debtorFirstName,
          companyName:  resolvedCompanyName,
          amountOwed:   resolvedAmount,
          agentName,
          language:     lang === 'fr' ? 'French' : 'English',
        },
      },
      metadata: {
        debtorId,
        companyId: resolvedCompanyId,
        tier,
      },
    };

    // Only include phoneNumberId if set in env
    if (process.env.VAPI_PHONE_NUMBER_ID) {
      payload.phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
    }

    const vapiRes = await fetch('https://api.vapi.ai/call/phone', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${vapiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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

        const outcome = analysis?.successEvaluation ?? null;

        await supabase.from('call_transcripts').insert({
          call_id:    callId,
          debtor_id:  debtorId,
          company_id: companyId,
          transcript,
          summary,
          outcome,
          duration,
        });

        await supabase
          .from('contact_attempts')
          .update({ status: 'completed', metadata: { call_id: callId, summary, outcome } })
          .eq('metadata->>call_id', callId);

        // Log call transcript as a conversation entry
        if (summary) {
          await supabase.from('conversations').insert({
            debtor_id:  debtorId,
            company_id: companyId,
            channel:    'call',
            direction:  'outbound',
            content:    summary,
            metadata:   { call_id: callId, duration, outcome },
          });
        }

        // If call indicates agreement, generate payment link and send via SMS
        const agreed = outcome === 'true' || outcome === true
          || (summary && /accept|agree|deal|parfait|ok.*paiement|envoie.*lien/i.test(summary));

        if (agreed) {
          console.log(`[voice:webhook] Agreement detected for debtor ${debtorId}, sending payment link`);
          try {
            const { data: debtor } = await supabase
              .from('debtors')
              .select('id, name, first_name, phone, amount')
              .eq('id', debtorId)
              .single();

            if (debtor && debtor.phone && debtor.amount > 0) {
              const linkUrl = await generatePaymentLink(debtor, companyId);

              if (linkUrl) {
                // Detect language for SMS
                const FRENCH_AREA_CODES = ['514', '438', '450', '579', '418', '581', '819', '873'];
                const phoneDigits = (debtor.phone ?? '').replace(/\D/g, '');
                const areaCode = phoneDigits.startsWith('1') ? phoneDigits.slice(1, 4) : phoneDigits.slice(0, 3);
                const lang = FRENCH_AREA_CODES.includes(areaCode) ? 'fr' : 'en';
                const firstName = debtor.first_name || debtor.name?.split(' ')[0] || '';

                const smsBody = lang === 'fr'
                  ? `${firstName}, tel que convenu lors de notre appel, voici votre lien de paiement: ${linkUrl}`
                  : `${firstName}, as discussed on our call, here's your payment link: ${linkUrl}`;

                // Send SMS via Twilio
                const creds = await getCompanyCreds(companyId);
                const sid   = creds.twilio_account_sid ?? process.env.TWILIO_ACCOUNT_SID;
                const token = creds.twilio_auth_token  ?? process.env.TWILIO_AUTH_TOKEN;
                const from  = process.env.TWILIO_DEFAULT_NUMBER || '+14389050764';

                if (sid && token) {
                  const twilioClient = twilio(sid, token);
                  await twilioClient.messages.create({ body: smsBody, from, to: debtor.phone });

                  await supabase.from('conversations').insert({
                    debtor_id:  debtorId,
                    company_id: companyId,
                    channel:    'sms',
                    direction:  'outbound',
                    content:    smsBody,
                    metadata:   { source: 'post_call_payment_link', call_id: callId },
                  });

                  console.log(`[voice:webhook] Payment link SMS sent to debtor ${debtorId}: ${linkUrl}`);
                }
              }
            }
          } catch (linkErr) {
            console.error(`[voice:webhook] Post-call payment link error for debtor ${debtorId}:`, linkErr.message);
          }
        }
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
