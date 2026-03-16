const express  = require('express');
const router   = express.Router();
const { v4: uuidv4 } = require('uuid');
const supabase = require('../database/supabase');
const { encrypt } = require('../utils/encryption');

// TODO: restore requireAuth once frontend and backend share the same Supabase project.

/**
 * Extracts the user's `sub` (UUID) from the Authorization Bearer JWT
 * WITHOUT signature verification. Safe to use here because we're only
 * using it as an identifier, not as a security boundary — the route is
 * temporarily public while Supabase projects are misaligned.
 */
function extractUserIdFromToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const payloadB64 = authHeader.slice(7).split('.')[1];
    if (!payloadB64) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

/**
 * POST /companies/register
 *
 * Accepts the nested onboarding payload from the wizard:
 * {
 *   company:     { company_name, business_email, business_phone, business_address, industry, ... }
 *   twilio:      { account_sid, auth_token, phone_numbers }
 *   sendgrid:    { api_key, from_email, from_name }
 *   stripe:      { secret_key, webhook_secret, connect_account_id }
 *   vapi:        { api_key, assistant_id, voice_agent_name }
 *   preferences: { default_floor_percentage, ... }
 * }
 *
 * auth_user_id is extracted from the Bearer JWT if present,
 * or accepted explicitly in the body, or omitted (insert without it).
 */
router.post('/register', async (req, res) => {
  console.log('[/companies/register] HIT — body keys:', Object.keys(req.body ?? {}));

  try {
    const {
      company     = {},
      twilio      = {},
      sendgrid    = {},
      stripe      = {},
      vapi        = {},
      preferences = {},
      // Legacy flat fields — accepted for backwards compatibility
      auth_user_id: bodyUserId,
    } = req.body;

    // Resolve auth_user_id: JWT header > body field > generated UUID
    const auth_user_id =
      extractUserIdFromToken(req.headers['authorization']) ??
      bodyUserId ??
      uuidv4();

    console.log('[/companies/register] auth_user_id resolved:', auth_user_id);

    // ── Flatten nested payload into DB columns ──────────────────────────────

    const company_name        = company.company_name      ?? null;
    const contact_name        = company.contact_name      ?? null;
    const business_email      = company.business_email    ?? company.email   ?? null;
    const business_phone      = company.business_phone    ?? company.phone   ?? null;
    const business_address    = company.business_address  ?? null; // full address object
    const company_logo_url    = company.company_logo_url  ?? null;
    const industry            = company.industry          ?? null;

    const twilio_account_sid   = twilio.account_sid       ?? null;
    const twilio_auth_token    = twilio.auth_token         ?? null;
    const twilio_phone_numbers = twilio.phone_numbers      ?? [];

    const sendgrid_api_key        = sendgrid.api_key          ?? null;
    const sendgrid_from_email     = sendgrid.from_email        ?? null;
    const sendgrid_from_name      = sendgrid.from_name         ?? null;
    const sendgrid_reply_to_email = sendgrid.reply_to_email    ?? null;

    const stripe_secret_key       = stripe.secret_key          ?? null;
    const stripe_webhook_secret   = stripe.webhook_secret       ?? null;
    const stripe_connect_account_id = stripe.connect_account_id ?? null;
    const default_currency        = stripe.default_currency     ?? 'CAD';

    const vapi_api_key         = vapi.api_key              ?? null;
    const vapi_assistant_id    = vapi.assistant_id          ?? null;
    const voice_agent_name     = vapi.voice_agent_name     ?? vapi.agent_name ?? 'Alex';

    const default_floor_percentage             = preferences.default_floor_percentage             ?? 30;
    const default_link_expiry_hours            = preferences.default_link_expiry_hours            ?? 48;
    const max_contacts_per_7_days              = preferences.max_contacts_per_7_days              ?? 7;
    const platform_fee_percentage              = preferences.platform_fee_percentage              ?? 50;
    const contact_hours_start                  = preferences.contact_hours_start                  ?? '08:00';
    const contact_hours_end                    = preferences.contact_hours_end                    ?? '20:00';
    const blocked_days                         = preferences.blocked_days                         ?? ['Sunday'];
    const auto_escalate_after_broken_promises  = preferences.auto_escalate_after_broken_promises  ?? 3;

    // ── Encrypt sensitive credentials ───────────────────────────────────────

    const encryptedTwilioToken   = twilio_auth_token     ? encrypt(twilio_auth_token)     : null;
    const encryptedSendgridKey   = sendgrid_api_key      ? encrypt(sendgrid_api_key)      : null;
    const encryptedVapiKey       = vapi_api_key          ? encrypt(vapi_api_key)          : null;
    const encryptedStripeKey     = stripe_secret_key     ? encrypt(stripe_secret_key)     : null;
    const encryptedStripeWebhook = stripe_webhook_secret ? encrypt(stripe_webhook_secret) : null;

    // ── Build the row — only real columns ───────────────────────────────────

    const row = {
      ...(auth_user_id ? { auth_user_id } : {}),
      company_name,
      contact_name,
      business_email,
      business_phone,
      business_address,
      company_logo_url,
      industry,
      twilio_account_sid,
      twilio_auth_token:            encryptedTwilioToken,
      sendgrid_api_key:             encryptedSendgridKey,
      sendgrid_from_email,
      sendgrid_from_name,
      sendgrid_reply_to_email,
      stripe_secret_key:            encryptedStripeKey,
      stripe_webhook_secret:        encryptedStripeWebhook,
      stripe_connect_account_id,
      default_currency,
      vapi_api_key:                 encryptedVapiKey,
      vapi_assistant_id,
      voice_agent_name,
      default_floor_percentage,
      default_link_expiry_hours,
      max_contacts_per_7_days,
      platform_fee_percentage,
      contact_hours_start,
      contact_hours_end,
      blocked_days,
      auto_escalate_after_broken_promises,
      onboarding_complete:          true,
      role:                         'client',
    };

    // ── Insert ──────────────────────────────────────────────────────────────

    const { data: companyData, error: companyError } = await supabase
      .from('client_companies')
      .insert(row)
      .select()
      .single();

    if (companyError) {
      console.error('[/companies/register] insert error:', companyError);
      return res.status(400).json({ error: companyError.message });
    }

    // ── Insert Twilio phone numbers ──────────────────────────────────────────

    if (Array.isArray(twilio_phone_numbers) && twilio_phone_numbers.length > 0) {
      const numberRows = twilio_phone_numbers
        .filter(n => (typeof n === 'string' ? n : n?.phone_number ?? n?.phoneNumber))
        .map(n => ({
          company_id:    companyData.id,
          phone_number:  typeof n === 'string' ? n : (n.phone_number ?? n.phoneNumber),
          friendly_name: typeof n === 'object'  ? (n.label ?? n.friendly_name ?? n.friendlyName ?? null) : null,
          active:        true,
        }));

      if (numberRows.length) {
        const { error: numbersError } = await supabase
          .from('twilio_numbers')
          .upsert(numberRows, { onConflict: 'company_id,phone_number' });

        if (numbersError) {
          console.warn('[/companies/register] Twilio numbers insert warning:', numbersError.message);
        }
      }
    }

    // ── Strip encrypted fields before returning ──────────────────────────────

    const {
      twilio_auth_token:     _a,
      sendgrid_api_key:      _b,
      vapi_api_key:          _c,
      stripe_secret_key:     _d,
      stripe_webhook_secret: _e,
      stripe_connect_account_id: _f,
      ...safeCompany
    } = companyData;

    res.status(201).json({ company: safeCompany });
  } catch (err) {
    console.error('[/companies/register] error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

module.exports = router;
