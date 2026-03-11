import { apiClient } from '@/lib/apiClient';

export const UNIT_COSTS = {
  sms: 0.0079,
  call: 0.052,
  email: 0.001,
};

export async function getMonthlyCosts({ companyId, month, year }: { companyId: string; month: number; year: number }) {
  return apiClient.get(`/operations/costs/${companyId}`, { month: String(month), year: String(year) });
}

export async function getCostHistory({ companyId }: { companyId: string }) {
  return apiClient.get(`/operations/history/${companyId}`);
}
