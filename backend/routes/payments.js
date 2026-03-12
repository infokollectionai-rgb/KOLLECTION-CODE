const express  = require('express');
const router   = express.Router();
const Stripe   = require('stripe');
const supabase = require('../database/supabase');
const { requireAuth } = require('../middleware/auth');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ─── POST /payments/create-link ───────────────────────────────────────────────

router.post('/create-link', requireAuth, async (req, res) => {
  const { debtorId, debtorName, amount, description, companyId } = req.body;

  if (!debtorId || !amount || !description) {
    return res.status(400).json({ error: 'debtorId, amount, and description are required' });
  }

  try {
    // Validate against the debtor's floor
    const { data: debtor } = await supabase
      .from('debtors')
      .select('balance, floor_amount')
      .eq('id', debtorId)
      .single();

    if (debtor?.floor_amount && amount < debtor.floor_amount) {
      return res.status(400).json({
        error: `Amount $${Number(amount).toFixed(2)} is below the minimum floor of $${Number(debtor.floor_amount).toFixed(2)}`,
      });
    }

    const targetCompanyId = companyId ?? req.company.id;

    // Get the company's Stripe connected account (if any)
    const { data: company } = await supabase
      .from('client_companies')
      .select('stripe_account_id')
      .eq('id', targetCompanyId)
      .single();

    const stripeOpts = company?.stripe_account_id
      ? { stripeAccount: company.stripe_account_id }
      : {};

    // Create product + price + payment link
    const product = await stripe.products.create(
      {
        name:     description,
        metadata: { debtor_id: debtorId, debtor_name: debtorName ?? '' },
      },
      stripeOpts
    );

    const price = await stripe.prices.create(
      {
        product:    product.id,
        unit_amount: Math.round(Number(amount) * 100), // cents
        currency:   'cad',
      },
      stripeOpts
    );

    const paymentLink = await stripe.paymentLinks.create(
      {
        line_items: [{ price: price.id, quantity: 1 }],
        metadata:   { debtor_id: debtorId, company_id: targetCompanyId },
        after_completion: {
          type: 'hosted_confirmation',
          hosted_confirmation: {
            custom_message: 'Thank you. Your payment has been received and your account updated.',
          },
        },
      },
      stripeOpts
    );

    // Persist the link
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 h
    await supabase.from('payment_links').insert({
      debtor_id:              debtorId,
      company_id:             targetCompanyId,
      stripe_payment_link_id: paymentLink.id,
      url:                    paymentLink.url,
      amount:                 Number(amount),
      description,
      status:                 'active',
      expires_at:             expiresAt.toISOString(),
    });

    res.json({ success: true, url: paymentLink.url, paymentLinkId: paymentLink.id });
  } catch (err) {
    console.error('Create payment link error:', err);
    res.status(500).json({ error: err.message ?? 'Failed to create payment link' });
  }
});

// ─── GET /payments/activity ───────────────────────────────────────────────────

router.get('/activity', requireAuth, async (req, res) => {
  try {
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*, debtors(full_name, phone)')
      .eq('company_id', req.company.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const totalCollected = (payments ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0);

    res.json({
      payments:       payments ?? [],
      summary: {
        totalCollected,
        totalCount: payments?.length ?? 0,
      },
    });
  } catch (err) {
    console.error('Payment activity error:', err);
    res.status(500).json({ error: err.message ?? 'Failed to fetch payment activity' });
  }
});

// ─── GET /payments/expired ────────────────────────────────────────────────────

router.get('/expired', requireAuth, async (req, res) => {
  try {
    const { data: expired, error } = await supabase
      .from('payment_links')
      .select('*, debtors(full_name)')
      .eq('company_id', req.company.id)
      .eq('status', 'active')
      .lt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false });

    if (error) throw error;

    // Mark them expired
    if (expired?.length) {
      await supabase
        .from('payment_links')
        .update({ status: 'expired' })
        .in('id', expired.map(l => l.id));
    }

    res.json({ expiredLinks: expired ?? [], count: expired?.length ?? 0 });
  } catch (err) {
    console.error('Expired links error:', err);
    res.status(500).json({ error: err.message ?? 'Failed to fetch expired links' });
  }
});

// ─── GET /payments/payouts/:companyId ─────────────────────────────────────────

router.get('/payouts/:companyId', requireAuth, async (req, res) => {
  const { companyId } = req.params;

  try {
    const { data: company } = await supabase
      .from('client_companies')
      .select('stripe_account_id')
      .eq('id', companyId)
      .single();

    if (!company?.stripe_account_id) {
      return res.json({ payouts: [], message: 'Stripe Connect not configured for this company' });
    }

    const payouts = await stripe.payouts.list(
      { limit: 50 },
      { stripeAccount: company.stripe_account_id }
    );

    res.json({ payouts: payouts.data });
  } catch (err) {
    console.error('Payouts error:', err);
    res.status(500).json({ error: err.message ?? 'Failed to fetch payouts' });
  }
});

module.exports = router;
