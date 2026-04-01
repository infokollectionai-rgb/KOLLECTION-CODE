const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const Papa     = require('papaparse');
const { v4: uuidv4 } = require('uuid');

const supabase                = require('../database/supabase');
const { buildSequence }       = require('../services/sequencer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const REQUIRED_COLUMNS = [
  'First Name', 'Last Name', 'Phone Number',
  'Full Address', 'City', 'Province / State',
  'Amount Owed', 'Days Overdue',
];

function calculateTier(daysOverdue) {
  if (daysOverdue <= 30) return 1;
  if (daysOverdue <= 60) return 2;
  if (daysOverdue <= 90) return 3;
  return 4;
}

function normalizePhone(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits ? `+${digits}` : null;
}

function parseAmount(raw) {
  if (raw == null) return 0;
  // Strip $, spaces, commas — handle "$1,350.00", "1 350,50", etc.
  const cleaned = String(raw).replace(/[$\s,]/g, '').replace(/,/g, '.');
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

function rowToAccount(row, i) {
  return {
    rowIndex:    i + 2,
    firstName:   (row['First Name']        ?? '').toString().trim(),
    lastName:    (row['Last Name']         ?? '').toString().trim(),
    fullName:    `${row['First Name'] ?? ''} ${row['Last Name'] ?? ''}`.trim(),
    phone:       normalizePhone(row['Phone Number']?.toString()),
    email:       row['Email Address']?.toString().trim()       || null,
    address:     (row['Full Address']       ?? '').toString().trim(),
    city:        (row['City']               ?? '').toString().trim(),
    province:    (row['Province / State']   ?? '').toString().trim(),
    postal:      row['Postal / Zip Code']?.toString().trim()   || null,
    amount:      parseAmount(row['Amount Owed']),
    daysOverdue: parseInt(row['Days Overdue'], 10)             || 0,
    loanType:    (row['Loan Type']          ?? 'Personal').toString().trim(),
    notes:       row['Notes']?.toString().trim()               || null,
    language:    (row['Language'] ?? row['Langue'] ?? '').toString().trim().toLowerCase() || null,
  };
}

// ─── POST /import/process ─────────────────────────────────────────────────────

// TODO: restore requireAuth once frontend and backend share the same Supabase project.
router.post('/process', upload.single('file'), async (req, res) => {
  const importId = uuidv4();

  try {
    let accounts = [];

    if (req.file) {
      // CSV file upload via multer
      const csvText = req.file.buffer.toString('utf8');
      const { data, errors } = Papa.parse(csvText, {
        header:        true,
        skipEmptyLines: true,
        transformHeader: h => h.trim(),
      });

      if (errors.length && !data.length) {
        return res.status(400).json({ error: 'CSV parse failed', details: errors });
      }

      // Validate required columns
      const headers   = Object.keys(data[0] ?? {});
      const missing   = REQUIRED_COLUMNS.filter(c => !headers.includes(c));
      if (missing.length) {
        return res.status(400).json({
          error:   'Missing required columns',
          missing,
        });
      }

      accounts = data.map((row, i) => rowToAccount(row, i));

    } else if (req.body.accounts) {
      // Pre-parsed JSON from the frontend (importService.processImport)
      accounts = Array.isArray(req.body.accounts) ? req.body.accounts : [];
    } else {
      return res.status(400).json({ error: 'Provide either a CSV file upload or an accounts JSON array' });
    }

    if (!accounts.length) {
      return res.status(400).json({ error: 'No accounts to import' });
    }

    // Resolve company_id: body field > first company in DB
    let companyId = req.body.companyId ?? req.body.company_id ?? null;
    if (!companyId) {
      const { data: firstCompany } = await supabase
        .from('client_companies')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
      companyId = firstCompany?.id ?? null;
    }
    if (!companyId) {
      return res.status(400).json({ error: 'No companyId provided and no companies exist yet' });
    }

    // Create the import job record
    await supabase.from('import_jobs').insert({
      id:              importId,
      company_id:      companyId,
      filename:        req.file?.originalname ?? 'json-import',
      status:          'processing',
      total_rows:      accounts.length,
      processed_rows:  0,
      error_rows:      0,
    });

    // Process asynchronously — respond immediately
    processImportAsync(importId, accounts, companyId).catch(err => {
      console.error('Async import error:', err);
      supabase
        .from('import_jobs')
        .update({ status: 'failed', errors: err.message })
        .eq('id', importId);
    });

    res.json({
      success:    true,
      importId,
      totalCount: accounts.length,
      message:    'Import started — poll /import/progress/:importId for status',
    });
  } catch (err) {
    console.error('Import process error:', err);
    res.status(500).json({ error: err.message ?? 'Import failed' });
  }
});

async function processImportAsync(importId, accounts, companyId) {
  const BATCH = 50;
  let processed = 0;
  let errors    = 0;

  for (let i = 0; i < accounts.length; i += BATCH) {
    const batch = accounts.slice(i, i + BATCH);

    const debtorRows = batch.map(acc => {
      const tier   = calculateTier(acc.daysOverdue ?? acc.days_overdue ?? 0);
      const amount = typeof acc.amount === 'number' ? acc.amount : parseAmount(acc.amount);
      const firstName = acc.firstName ?? acc.first_name ?? '';
      const lastName  = acc.lastName  ?? acc.last_name  ?? '';
      const name      = acc.fullName  ?? acc.full_name  ?? `${firstName} ${lastName}`.trim();
      const row = {
        company_id:    companyId,
        name,
        first_name:    firstName,
        phone:         acc.phone       ?? null,
        email:         acc.email       ?? null,
        amount,
        floor_amount:  amount * 0.30, // 30% default floor
        days_overdue:  acc.daysOverdue ?? acc.days_overdue ?? 0,
        tier,
        import_job_id: importId,
      };
      // Add language if present (from CSV "Language"/"Langue" column)
      const lang = acc.language ?? acc.langue ?? null;
      if (lang && (lang === 'fr' || lang === 'en' || lang === 'french' || lang === 'français')) {
        row.language = (lang === 'french' || lang === 'français' || lang === 'fr') ? 'fr' : 'en';
      }
      return row;
    });

    const { data: inserted, error } = await supabase
      .from('debtors')
      .insert(debtorRows)
      .select('id, tier, amount, phone');

    if (error) {
      console.error('Batch insert error:', error);
      errors += batch.length;
    } else {
      // Schedule contact sequences for newly inserted debtors
      const sequenceRows = [];
      for (const debtor of (inserted ?? [])) {
        const seq = buildSequence(debtor);
        for (const contact of seq) {
          sequenceRows.push({
            debtor_id:        debtor.id,
            company_id:       companyId,
            channel:          contact.channel,
            scheduled_for:    contact.scheduledFor,
            layer:            contact.layer,
            status:           'pending',
            message_template: null,
          });
        }
      }

      if (sequenceRows.length) {
        await supabase.from('scheduled_contacts').insert(sequenceRows);
      }

      processed += inserted?.length ?? batch.length;
    }

    // Update progress after every batch
    await supabase
      .from('import_jobs')
      .update({ processed_rows: processed, error_rows: errors })
      .eq('id', importId);
  }

  await supabase
    .from('import_jobs')
    .update({
      status:          errors === accounts.length ? 'failed' : 'completed',
      processed_rows:  processed,
      error_rows:      errors,
    })
    .eq('id', importId);
}

// ─── GET /import/progress/:importId ───────────────────────────────────────────

// TODO: restore requireAuth once frontend and backend share the same Supabase project.
router.get('/progress/:importId', async (req, res) => {
  try {
    const { data: job, error } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', req.params.importId)
      .single();

    if (error || !job) {
      return res.status(404).json({ error: 'Import job not found' });
    }

    const percentComplete = job.total_rows
      ? Math.round((job.processed_rows / job.total_rows) * 100)
      : 0;

    res.json({ ...job, percentComplete });
  } catch (err) {
    res.status(500).json({ error: err.message ?? 'Failed to fetch import progress' });
  }
});

module.exports = router;
