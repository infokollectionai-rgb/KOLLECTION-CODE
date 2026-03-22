require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const app = express();

// ─── Security & Logging ───────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({ origin: '*' }));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
// Stripe webhook needs raw body BEFORE the JSON parser
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
const agentsRouter = require('./routes/agents');

app.use('/companies',  require('./routes/companies'));
app.use('/provision',  require('./routes/provision'));
app.use('/agents',     agentsRouter);
app.use('/payments',   require('./routes/payments'));
app.use('/webhooks',   require('./routes/webhooks'));
app.use('/import',     require('./routes/import'));
app.use('/debtors',    require('./routes/debtors'));
app.use('/stripe',     require('./routes/stripe-connect'));
app.use('/admin',      require('./routes/admin'));

// POST /calls/initiate — alias for POST /agents/voice/call
// TODO: restore requireAuth once frontend and backend share the same Supabase project.
app.post('/calls/initiate', agentsRouter.initiateVoiceCall);

// ─── Cron Worker ────────────────────────────────────────────────────────────
// Called by Railway cron or n8n every 15 minutes
const { processScheduledContacts } = require('./services/worker');

app.get('/cron/process', async (req, res) => {
  try {
    const result = await processScheduledContacts();
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Cron process error:', err);
    res.status(500).json({ error: err.message ?? 'Cron processing failed' });
  }
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`Kollection backend running on port ${PORT} [${process.env.NODE_ENV ?? 'development'}]`);
});
