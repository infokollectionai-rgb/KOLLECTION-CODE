const IS_DEMO = true;
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function sendOutreach({ debtorId, debtorName, channel, amount, tier, companyName }: { debtorId: string; debtorName: string; channel: string; amount: number; tier: number; companyName: string }) {
  if (IS_DEMO) {
    await wait(1200);
    return {
      success: true,
      messageId: `MSG-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      preview: channel === 'sms'
        ? `Hi ${debtorName.split(' ')[0]}, this is ${companyName}. Your balance of $${amount} is overdue. We'd like to help — reply to arrange a payment plan.`
        : `Subject: Your account needs attention — ${companyName}`,
    };
  }
  return { success: false, messageId: '', timestamp: '', preview: '' };
}

export async function getNegotiationSuggestion({ debtorId, tier, balance, floor }: { debtorId: string; tier: number; balance: number; floor: number }) {
  if (IS_DEMO) {
    await wait(900);
    const suggestions: Record<number, string> = {
      1: `Hi, I understand things can get difficult. We can set up a plan starting at just $${Math.round(balance * 0.1)}/month. Would that work?`,
      2: `We've tried to reach you a few times. We can settle this for $${Math.round(floor * 1.2)} today — significantly less than the full balance. Interested?`,
      3: `This is your final opportunity to resolve your $${balance} balance before further action. We can settle for $${floor} today. Reply YES to accept.`,
    };
    return { suggestion: suggestions[tier] || suggestions[2], confidence: 0.84, stage: ['SOFT', 'FIRM', 'FINAL'][tier - 1] };
  }
  return { suggestion: '', confidence: 0, stage: '' };
}

export async function requestTakeover({ debtorId, requestedBy, reason }: { debtorId: string; requestedBy: string; reason?: string }) {
  if (IS_DEMO) {
    await wait(600);
    return {
      ticketId: `TKO-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      status: 'PENDING_HANDOFF',
      message: 'Kollection team notified. Expect contact within 4 business hours.',
    };
  }
  return { ticketId: '', status: '', message: '' };
}

export async function returnToAI({ debtorId, notes }: { debtorId: string; notes?: string }) {
  if (IS_DEMO) {
    await wait(400);
    return { success: true, aiResumedAt: new Date().toISOString() };
  }
  return { success: false, aiResumedAt: '' };
}

export async function logPromise({ debtorId, amount, promisedDate, channel }: { debtorId: string; amount: number; promisedDate: string; channel: string }) {
  if (IS_DEMO) {
    await wait(500);
    return { promiseId: `PTP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`, followUpScheduled: true, reminderAt: promisedDate };
  }
  return { promiseId: '', followUpScheduled: false, reminderAt: '' };
}
