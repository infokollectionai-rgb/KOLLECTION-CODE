const express  = require('express');
const router   = express.Router();
const Stripe   = require('stripe');
const supabase = require('../database/supabase');
const { requireAuth } = require('../middleware/auth');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ─── POST /stripe/connect/onboard ─────────────────────────────────────────────

router.post('/connect/onboard', requireAuth, async (req, res) => {
  const { companyId, company_id, email, companyName } = req.body;
  const targetId = companyId ?? company_id ?? req.company.id;

  try {
    const { data: company } = await supabase
      .from('client_companies')
      .select('stripe_account_id, email, company_name')
      .eq('id', targetId)
      .single();

    let accountId = company?.stripe_account_id;

    // Create a new Express account if one doesn't exist yet
    if (!accountId) {
      const account = await stripe.accounts.create({
        type:  'express',
        email: email ?? company?.email,
        business_profile: { name: companyName ?? company?.company_name },
        capabilities: {
          card_payments: { requested: true },
          transfers:     { requested: true },
        },
        metadata: { company_id: targetId },
      });

      accountId = account.id;

      await supabase
        .from('client_companies')
        .update({ stripe_account_id: accountId })
        .eq('id', targetId);
    }

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

    const accountLink = await stripe.accountLinks.create({
      account:     accountId,
      refresh_url: `${frontendUrl}/dashboard/settings?stripe=refresh`,
      return_url:  `${frontendUrl}/dashboard/settings?stripe=connected`,
      type:        'account_onboarding',
    });

    res.json({ url: accountLink.url, accountId });
  } catch (err) {
    console.error('Stripe Connect onboard error:', err);
    res.status(500).json({ error: err.message ?? 'Stripe Connect onboarding failed' });
  }
});

// ─── GET /stripe/connect/return ───────────────────────────────────────────────
// No auth — Stripe redirects the user here after onboarding

router.get('/connect/return', async (req, res) => {
  const { account } = req.query;
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

  try {
    if (account) {
      const stripeAccount = await stripe.accounts.retrieve(account);
      await supabase
        .from('client_companies')
        .update({ stripe_onboarding_complete: stripeAccount.charges_enabled })
        .eq('stripe_account_id', account);
    }

    res.redirect(
      `${frontendUrl}/dashboard/settings?stripe=${account ? 'connected' : 'incomplete'}`
    );
  } catch (err) {
    console.error('Stripe Connect return error:', err);
    res.redirect(`${frontendUrl}/dashboard/settings?stripe=error`);
  }
});

module.exports = router;
