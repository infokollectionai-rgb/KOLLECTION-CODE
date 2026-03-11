import { apiClient } from '@/lib/apiClient';

export async function sendOutreach({ debtorId, debtorName, phone, email, channel, amount, tier, companyName, agentName }: { debtorId: string; debtorName: string; phone?: string; email?: string; channel: string; amount: number; tier: number; companyName: string; agentName?: string }) {
  return apiClient.post('/agents/outreach/send', { debtorId, debtorName, phone, email, channel, amount, tier, companyName, agentName });
}

export async function getNegotiationSuggestion({ debtorId, conversationHistory, tier, balance, floor, companyName }: { debtorId: string; conversationHistory?: any[]; tier: number; balance: number; floor: number; companyName?: string }) {
  return apiClient.post('/agents/negotiation/suggest', { debtorId, conversationHistory, tier, balance, floor, companyName });
}

export async function requestTakeover({ debtorId, requestedBy, reason }: { debtorId: string; requestedBy: string; reason?: string }) {
  return apiClient.post('/agents/takeover/request', { debtorId, requestedBy, reason });
}

export async function returnToAI({ debtorId, notes }: { debtorId: string; notes?: string }) {
  return apiClient.post('/agents/takeover/return', { debtorId, notes });
}

export async function logPromise({ debtorId, amount, promisedDate, channel }: { debtorId: string; amount: number; promisedDate: string; channel: string }) {
  return apiClient.post('/agents/promises/log', { debtorId, amount, promisedDate, channel });
}
