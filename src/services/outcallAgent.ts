import { apiClient } from '@/lib/apiClient';

export async function initiateCall({ debtorId, debtorName, phone, amount, companyName, agentName = 'Alex', tier = 1 }: { debtorId: string; debtorName: string; phone: string; amount?: number; balance?: number; companyName: string; agentName?: string; tier?: number }) {
  return apiClient.post('/agents/voice/call', { debtorId, debtorName, phone, amount, companyName, agentName, tier });
}

export async function getCallResult({ callId }: { callId: string }) {
  return apiClient.get(`/agents/voice/result/${callId}`);
}
