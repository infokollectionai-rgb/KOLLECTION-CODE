// MOCK VERSION — used in development / Lovable preview

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function sendOutreach({ debtorId, channel }: any) {
  await delay(1200);
  return { success: true, messageId: `MSG-${Math.random().toString(36).substr(2,8).toUpperCase()}`, timestamp: new Date().toISOString(), aiStage: 'SOFT_NEGOTIATION' };
}

export async function getNegotiationResponse({ tier, floorAmount }: any) {
  await delay(800);
  const scripts: Record<number, string> = {
    1: `Hi! We understand situations change. We can set up a simple plan starting at just $${Math.round(floorAmount * 0.3)}/month. Would that work for you?`,
    2: `We've made multiple attempts to reach you. To avoid further action, we can settle for $${Math.round(floorAmount)} today. Reply to confirm.`,
    3: `This is your final notice before account escalation. A settlement of $${floorAmount} resolves this immediately. Reply YES to accept.`,
  };
  return { suggestedMessage: scripts[tier] || scripts[2], confidence: 0.87, stage: tier === 1 ? 'SOFT' : tier === 2 ? 'FIRM' : 'ESCALATED', recommendedOffer: floorAmount };
}

export async function scoreDebtor({ daysOverdue, amountOwed }: any) {
  await delay(600);
  const tier = daysOverdue < 30 ? 1 : daysOverdue < 90 ? 2 : 3;
  return { tier, score: Math.max(10, 100 - (daysOverdue * 0.5) - (amountOwed / 500)), riskFlags: daysOverdue > 60 ? ['LONG_OVERDUE'] : [], recoveryProbability: tier === 1 ? 0.74 : tier === 2 ? 0.45 : 0.18 };
}

export async function generatePaymentLink({ debtorId, amount }: any) {
  await delay(500);
  const id = Math.random().toString(36).substr(2, 8).toUpperCase();
  return { url: `https://pay.kollection.io/${id}`, linkId: id, expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://pay.kollection.io/${id}` };
}

export async function initiateVoiceCall({ phone }: any) {
  await delay(1500);
  return { callId: `CALL-${Math.random().toString(36).substr(2,6).toUpperCase()}`, status: 'INITIATED', estimatedDuration: 180, recordingEnabled: true };
}

export async function escalateToHuman({ debtorId, reason }: any) {
  await delay(400);
  return { ticketId: `TKT-${Math.random().toString(36).substr(2,6).toUpperCase()}`, assignedAgent: 'Unassigned', priority: 'HIGH', queuePosition: Math.floor(Math.random() * 8) + 1 };
}

export async function returnToAI({ debtorId }: any) {
  await delay(600);
  return { success: true, nextAiAction: 'SOFT_TOUCH', scheduledAt: new Date(Date.now() + 3600000).toISOString() };
}

export async function logPromise({ debtorId, amount, promisedDate }: any) {
  await delay(500);
  return { promiseId: `PRM-${Math.random().toString(36).substr(2,6).toUpperCase()}`, followUpScheduled: true, reminderTimes: [new Date(Date.now() + 86400000).toISOString()] };
}

export async function generateInstallmentOptions({ totalDebt, tier }: any) {
  await delay(700);
  return {
    options: [
      { label: 'Aggressive', amount: Math.round(totalDebt / 6), frequency: 'Monthly', duration: 6, totalRecovered: totalDebt },
      { label: 'Standard', amount: Math.round(totalDebt / 12), frequency: 'Monthly', duration: 12, totalRecovered: totalDebt * 0.95 },
      { label: 'Extended', amount: Math.round(totalDebt / 24), frequency: 'Monthly', duration: 24, totalRecovered: totalDebt * 0.85 },
    ]
  };
}
