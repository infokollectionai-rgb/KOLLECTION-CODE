const API_BASE = import.meta.env.VITE_API_URL || 'https://api.kollection.io';
const IS_DEMO = !import.meta.env.VITE_APP_ENV || import.meta.env.VITE_APP_ENV === 'demo';
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function createPaymentLink({ debtorId, debtorName, amount, description, companyId }: { debtorId: string; debtorName?: string; amount: number; description: string; companyId?: string }) {
  if (IS_DEMO) {
    await wait(800);
    const id = Math.random().toString(36).substr(2, 8).toUpperCase();
    return { url: `https://buy.stripe.com/demo_${id}`, linkId: id, amount, expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString() };
  }
  const res = await fetch(`${API_BASE}/payments/create-link`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ debtorId, debtorName, amount, description, companyId }) });
  return res.json();
}

export async function connectStripeAccount({ companyId, email, companyName }: { companyId: string; email: string; companyName?: string }) {
  if (IS_DEMO) {
    await wait(600);
    return { onboardingUrl: 'https://connect.stripe.com/demo', connected: true };
  }
  const res = await fetch(`${API_BASE}/stripe/connect/onboard`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ companyId, email, companyName }) });
  return res.json();
}

export async function getPayoutHistory({ companyId }: { companyId: string }) {
  if (IS_DEMO) {
    await wait(400);
    return {
      nextPayout: { date: '2025-09-01', amount: 4210, status: 'SCHEDULED' },
      history: [
        { date: '2025-08-01', amount: 3900, status: 'PAID', stripeTransferId: 'tr_xxx1' },
        { date: '2025-07-01', amount: 2700, status: 'PAID', stripeTransferId: 'tr_xxx2' },
        { date: '2025-06-01', amount: 4550, status: 'PAID', stripeTransferId: 'tr_xxx3' },
      ],
    };
  }
  const res = await fetch(`${API_BASE}/payments/payouts/${companyId}`);
  return res.json();
}
