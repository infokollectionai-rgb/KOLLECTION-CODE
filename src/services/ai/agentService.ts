// ============================================================
// KOLLECTION AI AGENT SERVICE
// All AI agent calls flow through this file.
// Uses mock service in development for preview.
// ============================================================

import * as mock from './mockAgentService';

const USE_MOCK = true; // Toggle for production

// ── OUTREACH AGENT ──────────────────────────────────────────
// Sends AI-generated message via SMS, email, or voice call
// Input: { debtorId, channel, message, tier }
// Response: { success, messageId, timestamp, aiStage }
export async function sendOutreach(params: { debtorId: string; channel: string; message?: string; tier?: number }) {
  if (USE_MOCK) return mock.sendOutreach(params);
  const res = await fetch(`/api/agents/outreach/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) });
  return res.json();
}

// ── NEGOTIATION AGENT ────────────────────────────────────────
// Gets AI-suggested negotiation response for a debtor
// Input: { debtorId, conversationHistory, tier, floorAmount }
// Response: { suggestedMessage, confidence, stage, recommendedOffer }
export async function getNegotiationResponse(params: { debtorId: string; conversationHistory?: any[]; tier: number; floorAmount: number }) {
  if (USE_MOCK) return mock.getNegotiationResponse(params);
  const res = await fetch(`/api/agents/negotiation/suggest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) });
  return res.json();
}

// ── RISK SCORING AGENT ───────────────────────────────────────
// Scores debtor and assigns tier based on behavioral data
// Input: { debtorId, paymentHistory, contactAttempts, daysOverdue, amountOwed }
// Response: { tier, score, riskFlags, recoveryProbability }
export async function scoreDebtor(params: { debtorId: string; paymentHistory?: any[]; contactAttempts?: number; daysOverdue: number; amountOwed: number }) {
  if (USE_MOCK) return mock.scoreDebtor(params);
  const res = await fetch(`/api/agents/risk/score`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) });
  return res.json();
}

// ── PAYMENT LINK AGENT ───────────────────────────────────────
// Generates instant payment link for a debtor
// Input: { debtorId, amount, expiresInHours, note }
// Response: { url, linkId, expiresAt, qrCode }
export async function generatePaymentLink(params: { debtorId: string; amount: number; expiresInHours?: number; note?: string }) {
  if (USE_MOCK) return mock.generatePaymentLink(params);
  const res = await fetch(`/api/agents/payments/link`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) });
  return res.json();
}

// ── VOICE CALL AGENT ─────────────────────────────────────────
// Initiates AI voice call to debtor
// Input: { debtorId, phone, script, tier, maxDuration }
// Response: { callId, status, estimatedDuration, recordingEnabled }
export async function initiateVoiceCall(params: { debtorId: string; phone: string; script?: string; tier?: number; maxDuration?: number }) {
  if (USE_MOCK) return mock.initiateVoiceCall(params);
  const res = await fetch(`/api/agents/voice/call`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) });
  return res.json();
}

// ── ESCALATION AGENT ─────────────────────────────────────────
// Escalates account to human takeover queue
// Input: { debtorId, reason, aiStageReached, conversationId }
// Response: { ticketId, assignedAgent, priority, queuePosition }
export async function escalateToHuman(params: { debtorId: string; reason: string; aiStageReached?: string; conversationId?: string }) {
  if (USE_MOCK) return mock.escalateToHuman(params);
  const res = await fetch(`/api/agents/escalation/trigger`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) });
  return res.json();
}

// ── AI RETURN AGENT ──────────────────────────────────────────
// Returns account from human to AI control
// Input: { debtorId, humanNotes, resumeFromStage }
// Response: { success, nextAiAction, scheduledAt }
export async function returnToAI(params: { debtorId: string; humanNotes?: string; resumeFromStage?: string }) {
  if (USE_MOCK) return mock.returnToAI(params);
  const res = await fetch(`/api/agents/escalation/return`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) });
  return res.json();
}

// ── PROMISE TRACKING AGENT ───────────────────────────────────
// Logs a promise-to-pay and schedules follow-up
// Input: { debtorId, amount, promisedDate, channel }
// Response: { promiseId, followUpScheduled, reminderTimes }
export async function logPromise(params: { debtorId: string; amount: number; promisedDate: string; channel: string }) {
  if (USE_MOCK) return mock.logPromise(params);
  const res = await fetch(`/api/agents/promises/log`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) });
  return res.json();
}

// ── INSTALLMENT OPTIMIZATION AGENT ──────────────────────────
// Generates optimal installment plan options for a debtor
// Input: { debtorId, totalDebt, floorAmount, maxDuration, tier }
// Response: { options: [{ label, amount, frequency, duration, totalRecovered }] }
export async function generateInstallmentOptions(params: { debtorId: string; totalDebt: number; floorAmount: number; maxDuration?: number; tier: number }) {
  if (USE_MOCK) return mock.generateInstallmentOptions(params);
  const res = await fetch(`/api/agents/installments/optimize`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) });
  return res.json();
}
