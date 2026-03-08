const IS_DEMO = true;
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function initiateCall({ debtorId, debtorName, phone, balance, companyName, agentName = 'Alex', tier = 1 }: { debtorId: string; debtorName: string; phone: string; balance: number; companyName: string; agentName?: string; tier?: number }) {
  if (IS_DEMO) {
    await wait(1800);
    return {
      callId: `CALL-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      status: 'INITIATED',
      estimatedDuration: 120,
    };
  }
  return { callId: '', status: '', estimatedDuration: 0 };
}

export async function getCallResult({ callId }: { callId: string }) {
  if (IS_DEMO) {
    await wait(500);
    return {
      callId,
      outcome: 'COMMITTED',
      duration: 143,
      transcript: [
        { speaker: 'AI', text: 'Hello, may I speak with Marcus?' },
        { speaker: 'Debtor', text: 'Speaking.' },
        { speaker: 'AI', text: "Hi Marcus, my name is Alex calling on behalf of QuickCash Loans. I'm reaching out about your outstanding balance of $850. We'd like to find an arrangement that works for you." },
        { speaker: 'Debtor', text: "Yeah I know I owe it. I just don't have the full amount right now." },
        { speaker: 'AI', text: "We completely understand. We can set up a payment plan — something as low as $85 a month. Would that be manageable?" },
        { speaker: 'Debtor', text: 'Yeah that could work actually.' },
        { speaker: 'AI', text: "Perfect. I'm going to send you a secure payment link by text right now. The first payment of $85 would be due in 7 days." },
        { speaker: 'Debtor', text: 'Yeah send it.' },
      ],
      promiseAmount: 85,
      promiseDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    };
  }
  return { callId, outcome: '', duration: 0, transcript: [], promiseAmount: 0, promiseDate: '' };
}
