import { apiClient } from '@/lib/apiClient';

const IS_DEMO = !import.meta.env.VITE_APP_ENV || import.meta.env.VITE_APP_ENV === 'demo';
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function createPaymentLink({ debtorId, debtorName, amount, description, companyId }: { debtorId: string; debtorName?: string; amount: number; description: string; companyId?: string }) {
  if (IS_DEMO) {
    await wait(800);
    const id = Math.random().toString(36).substr(2, 8).toUpperCase();
    return { url: `https://buy.stripe.com/demo_${id}`, linkId: id, amount, expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString() };
  }
  return apiClient.post('/payments/create-link', { debtorId, debtorName, amount, description, companyId });
}

export async function connectStripeAccount({ companyId, email, companyName }: { companyId: string; email: string; companyName?: string }) {
  if (IS_DEMO) {
    await wait(600);
    return { onboardingUrl: 'https://connect.stripe.com/demo', connected: true };
  }
  return apiClient.post('/stripe/connect/onboard', { companyId, email, companyName });
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
  return apiClient.get(`/payments/payouts/${companyId}`);
}
