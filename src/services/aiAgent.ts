const API_BASE = import.meta.env.VITE_AI_AGENT_URL || 'https://api.kollection.io/agents';
const IS_DEMO = !import.meta.env.VITE_APP_ENV || import.meta.env.VITE_APP_ENV === 'demo';
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function sendOutreach({ debtorId, debtorName, phone, email, channel, amount, tier, companyName, agentName }: { debtorId: string; debtorName: string; phone?: string; email?: string; channel: string; amount: number; tier: number; companyName: string; agentName?: string }) {
  if (IS_DEMO) {
    await wait(1000);
    const firstName = debtorName.split(' ')[0];
    return {
      success: true,
      messageId: `MSG-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      channel,
      preview: channel === 'sms'
        ? `Hi ${firstName}, this is ${agentName || 'Alex'} from ${companyName}. Your outstanding balance of $${amount} is past due. We'd like to help you find a solution. Reply to discuss options.`
        : `Subject: Your account with ${companyName} — action needed`,
    };
  }
  const res = await fetch(`${API_BASE}/outreach/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ debtorId, debtorName, phone, email, channel, amount, tier, companyName, agentName }) });
  return res.json();
}

export async function getNegotiationSuggestion({ debtorId, conversationHistory, tier, balance, floor, companyName }: { debtorId: string; conversationHistory?: any[]; tier: number; balance: number; floor: number; companyName?: string }) {
  if (IS_DEMO) {
    await wait(900);
    const scripts: Record<number, string> = {
      1: `Hi, we understand things can get difficult. We can set up a plan as low as $${Math.round(balance * 0.1)}/month. Would that work for you?`,
      2: `We've been trying to reach you. We can settle this for $${Math.round(floor * 1.2)} — well below the full balance. Interested?`,
      3: `This is your final opportunity to resolve your $${balance} balance before further action. We can settle for $${floor} today.`,
    };
    return { suggestion: scripts[tier] || scripts[2], confidence: 0.84, stage: ['SOFT', 'FIRM', 'FINAL'][tier - 1] };
  }
  const res = await fetch(`${API_BASE}/negotiation/suggest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ debtorId, conversationHistory, tier, balance, floor, companyName }) });
  return res.json();
}

export async function requestTakeover({ debtorId, requestedBy, reason }: { debtorId: string; requestedBy: string; reason?: string }) {
  if (IS_DEMO) {
    await wait(600);
    return { ticketId: `TKO-${Math.random().toString(36).substr(2, 6).toUpperCase()}`, status: 'PENDING_HANDOFF', message: 'Kollection team notified. Expect contact within 4 business hours.' };
  }
  const res = await fetch(`${API_BASE}/takeover/request`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ debtorId, requestedBy, reason }) });
  return res.json();
}

export async function returnToAI({ debtorId, notes }: { debtorId: string; notes?: string }) {
  if (IS_DEMO) {
    await wait(400);
    return { success: true, aiResumedAt: new Date().toISOString() };
  }
  const res = await fetch(`${API_BASE}/takeover/return`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ debtorId, notes }) });
  return res.json();
}

export async function logPromise({ debtorId, amount, promisedDate, channel }: { debtorId: string; amount: number; promisedDate: string; channel: string }) {
  if (IS_DEMO) {
    await wait(500);
    return { promiseId: `PTP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`, followUpScheduled: true, reminderAt: promisedDate };
  }
  const res = await fetch(`${API_BASE}/promises/log`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ debtorId, amount, promisedDate, channel }) });
  return res.json();
}
