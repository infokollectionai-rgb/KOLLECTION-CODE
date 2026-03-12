const express  = require('express');
const router   = express.Router();
const supabase = require('../database/supabase');
const { requireAuth }   = require('../middleware/auth');
const { buildSequence } = require('../services/sequencer');

const PAGE_SIZE = 25;

// ─── GET /debtors/list ────────────────────────────────────────────────────────

router.get('/list', requireAuth, async (req, res) => {
  const {
    page    = 1,
    status,
    tier,
    search,
    sortBy  = 'created_at',
    sortDir = 'desc',
  } = req.query;

  const offset = (Math.max(parseInt(page, 10), 1) - 1) * PAGE_SIZE;

  try {
    let query = supabase
      .from('debtors')
      .select('*', { count: 'exact' })
      .eq('company_id', req.company.id)
      .order(sortBy, { ascending: sortDir === 'asc' })
      .range(offset, offset + PAGE_SIZE - 1);

    if (status) query = query.eq('status', status);
    if (tier)   query = query.eq('tier', parseInt(tier, 10));
    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
      debtors:    data ?? [],
      total:      count ?? 0,
      page:       parseInt(page, 10),
      pageSize:   PAGE_SIZE,
      totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
    });
  } catch (err) {
    console.error('Debtor list error:', err);
    res.status(500).json({ error: err.message ?? 'Failed to fetch debtors' });
  }
});

// ─── GET /debtors/:id/history ─────────────────────────────────────────────────

router.get('/:id/history', requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const [convos, contacts, payments, promises] = await Promise.all([
      supabase.from('conversations')    .select('*').eq('debtor_id', id).order('created_at', { ascending: true }),
      supabase.from('contact_attempts') .select('*').eq('debtor_id', id).order('created_at', { ascending: true }),
      supabase.from('payments')         .select('*').eq('debtor_id', id).order('created_at', { ascending: true }),
      supabase.from('promises')         .select('*').eq('debtor_id', id).order('created_at', { ascending: true }),
    ]);

    const timeline = [
      ...(convos.data   ?? []).map(r => ({ ...r, _type: 'conversation'    })),
      ...(contacts.data ?? []).map(r => ({ ...r, _type: 'contact_attempt' })),
      ...(payments.data ?? []).map(r => ({ ...r, _type: 'payment'         })),
      ...(promises.data ?? []).map(r => ({ ...r, _type: 'promise'         })),
    ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    res.json({ timeline });
  } catch (err) {
    console.error('Debtor history error:', err);
    res.status(500).json({ error: err.message ?? 'Failed to fetch debtor history' });
  }
});

// ─── POST /debtors/:id/pause ──────────────────────────────────────────────────

router.post('/:id/pause', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await Promise.all([
      supabase.from('debtors')
        .update({ ai_paused: true, paused_at: new Date().toISOString() })
        .eq('id', id)
        .eq('company_id', req.company.id),
      supabase.from('scheduled_contacts')
        .update({ cancelled: true })
        .eq('debtor_id', id)
        .gt('scheduled_at', new Date().toISOString()),
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /debtors/:id/resume ─────────────────────────────────────────────────

router.post('/:id/resume', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const { data: debtor, error } = await supabase
      .from('debtors')
      .update({ ai_paused: false, paused_at: null })
      .eq('id', id)
      .eq('company_id', req.company.id)
      .select()
      .single();

    if (error || !debtor) return res.status(404).json({ error: 'Debtor not found' });

    // Re-schedule contact sequence from today
    const sequence = buildSequence(debtor);
    if (sequence.length) {
      await supabase.from('scheduled_contacts').insert(
        sequence.map(s => ({
          debtor_id:    debtor.id,
          company_id:   req.company.id,
          channel:      s.channel,
          scheduled_at: s.scheduledAt,
          type:         'sequence',
          metadata:     { step: s.step, tier: debtor.tier },
        }))
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /debtors/:id/remove ─────────────────────────────────────────────────

router.post('/:id/remove', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await Promise.all([
      supabase.from('debtors')
        .update({ status: 'removed', removed_at: new Date().toISOString() })
        .eq('id', id)
        .eq('company_id', req.company.id),
      supabase.from('scheduled_contacts')
        .update({ cancelled: true })
        .eq('debtor_id', id),
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /debtors/:id/cease ──────────────────────────────────────────────────

router.post('/:id/cease', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await Promise.all([
      supabase.from('debtors')
        .update({
          cease_desist:    true,
          cease_desist_at: new Date().toISOString(),
          ai_paused:       true,
          status:          'cease_desist',
        })
        .eq('id', id)
        .eq('company_id', req.company.id),
      supabase.from('scheduled_contacts')
        .update({ cancelled: true })
        .eq('debtor_id', id),
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /debtors/bulk-action ────────────────────────────────────────────────

router.post('/bulk-action', requireAuth, async (req, res) => {
  const { action, debtorIds } = req.body;

  if (!action || !Array.isArray(debtorIds) || !debtorIds.length) {
    return res.status(400).json({ error: 'action and a non-empty debtorIds array are required' });
  }

  const VALID = ['pause', 'resume', 'remove'];
  if (!VALID.includes(action)) {
    return res.status(400).json({ error: `Invalid action. Must be one of: ${VALID.join(', ')}` });
  }

  const UPDATE_MAP = {
    pause:  { ai_paused: true,  paused_at: new Date().toISOString() },
    resume: { ai_paused: false, paused_at: null },
    remove: { status: 'removed', removed_at: new Date().toISOString() },
  };

  try {
    await supabase
      .from('debtors')
      .update(UPDATE_MAP[action])
      .in('id', debtorIds)
      .eq('company_id', req.company.id);

    if (action === 'pause' || action === 'remove') {
      await supabase
        .from('scheduled_contacts')
        .update({ cancelled: true })
        .in('debtor_id', debtorIds)
        .gt('scheduled_at', new Date().toISOString());
    }

    res.json({ success: true, affected: debtorIds.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
