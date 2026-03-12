const express = require('express');
const router  = express.Router();
const twilio  = require('twilio');
const { requireAuth } = require('../middleware/auth');

/**
 * POST /provision/test-twilio
 * Verifies Twilio credentials by fetching the account record.
 */
router.post('/test-twilio', requireAuth, async (req, res) => {
  const { account_sid, auth_token } = req.body;

  if (!account_sid || !auth_token) {
    return res.status(400).json({ error: 'account_sid and auth_token are required' });
  }

  try {
    const client  = twilio(account_sid, auth_token);
    const account = await client.api.accounts(account_sid).fetch();
    res.json({
      success:      true,
      account_name: account.friendlyName,
      status:       account.status,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message || 'Invalid Twilio credentials' });
  }
});

/**
 * POST /provision/test-sendgrid
 * Verifies a SendGrid API key by calling the user profile endpoint.
 */
router.post('/test-sendgrid', requireAuth, async (req, res) => {
  const { api_key } = req.body;

  if (!api_key) {
    return res.status(400).json({ error: 'api_key is required' });
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
      headers: { Authorization: `Bearer ${api_key}` },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const msg  = body?.errors?.[0]?.message ?? 'Invalid SendGrid API key';
      return res.status(400).json({ success: false, error: msg });
    }

    const profile = await response.json();
    res.json({ success: true, email: profile.email, username: profile.username });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message || 'SendGrid connection failed' });
  }
});

/**
 * POST /provision/test-vapi
 * Verifies a VAPI API key by fetching the specified assistant.
 */
router.post('/test-vapi', requireAuth, async (req, res) => {
  const { api_key, assistant_id } = req.body;

  if (!api_key || !assistant_id) {
    return res.status(400).json({ error: 'api_key and assistant_id are required' });
  }

  try {
    const response = await fetch(`https://api.vapi.ai/assistant/${assistant_id}`, {
      headers: { Authorization: `Bearer ${api_key}` },
    });

    if (!response.ok) {
      return res.status(400).json({
        success: false,
        error:   'Invalid VAPI credentials or assistant not found',
      });
    }

    const assistant = await response.json();
    res.json({
      success:        true,
      assistant_name: assistant.name,
      assistant_id:   assistant.id,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message || 'VAPI connection failed' });
  }
});

module.exports = router;
