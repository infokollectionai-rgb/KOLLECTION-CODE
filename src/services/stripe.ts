import { apiClient } from '@/lib/apiClient';

export async function createPaymentLink({ debtorId, debtorName, amount, description, companyId }: { debtorId: string; debtorName?: string; amount: number; description: string; companyId?: string }) {
  return apiClient.post('/payments/create-link', { debtorId, debtorName, amount, description, companyId });
}

export async function connectStripeAccount({ companyId, email, companyName }: { companyId: string; email: string; companyName?: string }) {
  return apiClient.post('/stripe/connect/onboard', { companyId, email, companyName });
}

export async function getPayoutHistory({ companyId }: { companyId: string }) {
  return apiClient.get(`/payments/payouts/${companyId}`);
}
