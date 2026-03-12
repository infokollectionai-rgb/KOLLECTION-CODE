const express  = require('express');
const router   = express.Router();
const supabase = require('../database/supabase');
const { requireAdmin } = require('../middleware/auth');

// ─── GET /admin/clients ───────────────────────────────────────────────────────

router.get('/clients', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('client_companies')
      .select(
        'id, company_name, contact_name, email, phone, role, ' +
        'onboarding_complete, stripe_onboarding_complete, ' +
        'setup_fee, recovery_pct, operations_pct, recovery_floor_pct, ' +
        'created_at, province, timezone'
      )
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ clients: data ?? [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /admin/clients/:companyId/fee-history ────────────────────────────────

router.get('/clients/:companyId/fee-history', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fee_history')
      .select('*')
      .eq('company_id', req.params.companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ history: data ?? [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /admin/clients/:companyId/fees ──────────────────────────────────────

router.post('/clients/:companyId/fees', requireAdmin, async (req, res) => {
  const { companyId } = req.params;
  const { setupFee, recoveryPct, operationsPct, reason } = req.body;

  if (setupFee === undefined || recoveryPct === undefined || operationsPct === undefined) {
    return res.status(400).json({ error: 'setupFee, recoveryPct, and operationsPct are required' });
  }

  try {
    const { data: company, error } = await supabase
      .from('client_companies')
      .update({
        setup_fee:       setupFee,
        recovery_pct:    recoveryPct,
        operations_pct:  operationsPct,
      })
      .eq('id', companyId)
      .select()
      .single();

    if (error) throw error;

    // Log the fee change
    await supabase.from('fee_history').insert({
      company_id:     companyId,
      admin_id:       req.user.id,
      setup_fee:      setupFee,
      recovery_pct:   recoveryPct,
      operations_pct: operationsPct,
      reason:         reason ?? null,
    });

    // Strip encrypted fields before returning
    const { twilio_auth_token, sendgrid_api_key, vapi_api_key, ...safeCompany } = company;
    res.json({ success: true, company: safeCompany });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
