const express  = require('express');
const router   = express.Router();
const supabase = require('../database/supabase');
const { encrypt }      = require('../utils/encryption');
const { requireAuth }  = require('../middleware/auth');

/**
 * POST /companies/register
 *
 * Accepts the full onboarding payload. Encrypts sensitive credentials,
 * creates (or updates) the client_companies row, inserts twilio_numbers,
 * and returns the sanitised company record.
 */
router.post('/register', requireAuth, async (req, res) => {
  try {
    const {
      // Identity
      company_name,
      contact_name,
      email,
      phone,
      province,
      timezone,
      // Twilio
      twilio_account_sid,
      twilio_auth_token,
      twilio_phone_numbers,   // string[] | { phoneNumber, friendlyName }[]
      // SendGrid
      sendgrid_api_key,
      sendgrid_from_email,
      // VAPI
      vapi_api_key,
      vapi_assistant_id,
      // Business rules
      recovery_floor_pct,
    } = req.body;

    const userId = req.user.id;

    // Encrypt sensitive credentials before storing
    const encryptedTwilioToken  = twilio_auth_token  ? encrypt(twilio_auth_token)  : null;
    const encryptedSendgridKey  = sendgrid_api_key   ? encrypt(sendgrid_api_key)   : null;
    const encryptedVapiKey      = vapi_api_key       ? encrypt(vapi_api_key)       : null;

    const { data: company, error: companyError } = await supabase
      .from('client_companies')
      .upsert(
        {
          auth_user_id:        userId,
          company_name:        company_name        ?? null,
          contact_name:        contact_name        ?? null,
          email:               email               ?? null,
          phone:               phone               ?? null,
          province:            province            ?? 'ON',
          timezone:            timezone            ?? 'America/Toronto',
          twilio_account_sid:  twilio_account_sid  ?? null,
          twilio_auth_token:   encryptedTwilioToken,
          sendgrid_api_key:    encryptedSendgridKey,
          sendgrid_from_email: sendgrid_from_email ?? null,
          vapi_api_key:        encryptedVapiKey,
          vapi_assistant_id:   vapi_assistant_id   ?? null,
          recovery_floor_pct:  recovery_floor_pct  ?? 30,
          onboarding_complete: true,
          role:                'client',
        },
        { onConflict: 'auth_user_id' }
      )
      .select()
      .single();

    if (companyError) {
      console.error('Company upsert error:', companyError);
      return res.status(400).json({ error: companyError.message });
    }

    // Insert Twilio phone numbers
    if (Array.isArray(twilio_phone_numbers) && twilio_phone_numbers.length > 0) {
      const numberRows = twilio_phone_numbers.map(n => ({
        company_id:    company.id,
        phone_number:  typeof n === 'string' ? n : n.phoneNumber,
        friendly_name: typeof n === 'object'  ? (n.friendlyName ?? null) : null,
        active:        true,
      }));

      const { error: numbersError } = await supabase
        .from('twilio_numbers')
        .upsert(numberRows, { onConflict: 'company_id,phone_number' });

      if (numbersError) {
        console.warn('Twilio numbers insert warning:', numbersError.message);
      }
    }

    // Strip encrypted fields before returning
    const {
      twilio_auth_token:  _t,
      sendgrid_api_key:   _s,
      vapi_api_key:       _v,
      ...safeCompany
    } = company;

    res.status(201).json({ company: safeCompany });
  } catch (err) {
    console.error('Company registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

module.exports = router;
