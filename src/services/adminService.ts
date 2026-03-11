import { apiClient } from '@/lib/apiClient';

export const PLATFORM_DEFAULTS = {
  setupFee: 5000,
  recoveryPct: 50,
  operationsPct: 8,
};

export async function updateClientFees({ companyId, setupFee, recoveryPct, operationsPct, reason }: {
  companyId: string; setupFee: number; recoveryPct: number; operationsPct: number; reason?: string;
}) {
  return apiClient.post(`/admin/clients/${companyId}/fees`, { setupFee, recoveryPct, operationsPct, reason });
}

export async function getClientFeeHistory({ companyId }: { companyId: string }) {
  return apiClient.get(`/admin/clients/${companyId}/fee-history`);
}

export async function getAllClients() {
  return apiClient.get('/admin/clients');
}
