const OUTCALL_BASE = import.meta.env.VITE_OUTCALL_URL || 'https://api.kollection.io/calls';
const IS_DEMO = !import.meta.env.VITE_APP_ENV || import.meta.env.VITE_APP_ENV === 'demo';
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function initiateCall({ debtorId, debtorName, phone, amount, companyName, agentName = 'Alex', tier = 1 }: { debtorId: string; debtorName: string; phone: string; amount?: number; balance?: number; companyName: string; agentName?: string; tier?: number }) {
  if (IS_DEMO) {
    await wait(1800);
    return {
      callId: `CALL-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      status: 'INITIATED',
      estimatedDuration: 90,
      to: phone,
      script: `"Hello, may I speak with ${debtorName.split(' ')[0]}?" → identifies account → offers plan`,
    };
  }
  const res = await fetch(`${OUTCALL_BASE}/initiate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ debtorId, debtorName, phone, amount, companyName, agentName, tier }) });
  return res.json();
}

export async function getCallResult({ callId }: { callId: string }) {
  if (IS_DEMO) {
    await wait(500);
    return {
      callId,
      outcome: 'COMMITTED',
      duration: 143,
      promiseAmount: 85,
      promiseDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      transcript: [
        { speaker: 'AI', text: 'Hello, may I speak with Marcus?' },
        { speaker: 'Debtor', text: 'Speaking.' },
        { speaker: 'AI', text: "Hi Marcus, my name is Alex calling on behalf of QuickCash Loans. I'm reaching out about your outstanding balance of $850 that is past due. We'd like to find an arrangement that works for you. Would you be open to discussing this?" },
        { speaker: 'Debtor', text: "I don't have the full amount right now." },
        { speaker: 'AI', text: "That's completely fine. We can start a plan at $85/month. Would that be manageable for you?" },
        { speaker: 'Debtor', text: 'Yeah, that could work.' },
        { speaker: 'AI', text: "Perfect. I'm sending a secure payment link to your phone right now. First payment due in 7 days. Thank you Marcus." },
      ],
    };
  }
  const res = await fetch(`${OUTCALL_BASE}/result/${callId}`);
  return res.json();
}
