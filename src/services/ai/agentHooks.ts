import { useState, useCallback } from 'react';
import * as agentService from './agentService';

export function useOutreach() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const send = useCallback(async (params: Parameters<typeof agentService.sendOutreach>[0]) => {
    setLoading(true); setError(null);
    try { const data = await agentService.sendOutreach(params); setResult(data); return data; }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);
  return { send, loading, result, error };
}

export function useNegotiation() {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<any>(null);
  const suggest = useCallback(async (params: Parameters<typeof agentService.getNegotiationResponse>[0]) => {
    setLoading(true);
    try { const data = await agentService.getNegotiationResponse(params); setSuggestion(data); return data; }
    finally { setLoading(false); }
  }, []);
  return { suggest, suggestion, loading };
}

export function useRiskScoring() {
  const [loading, setLoading] = useState(false);
  const score = useCallback(async (params: Parameters<typeof agentService.scoreDebtor>[0]) => {
    setLoading(true);
    try { return await agentService.scoreDebtor(params); }
    finally { setLoading(false); }
  }, []);
  return { score, loading };
}

export function usePaymentLink() {
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const generate = useCallback(async (params: Parameters<typeof agentService.generatePaymentLink>[0]) => {
    setLoading(true);
    try { const data = await agentService.generatePaymentLink(params); setLink(data.url); return data; }
    finally { setLoading(false); }
  }, []);
  return { generate, link, loading };
}

export function useVoiceCall() {
  const [loading, setLoading] = useState(false);
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const call = useCallback(async (params: Parameters<typeof agentService.initiateVoiceCall>[0]) => {
    setLoading(true);
    try { const data = await agentService.initiateVoiceCall(params); setCallStatus(data.status); return data; }
    finally { setLoading(false); }
  }, []);
  return { call, callStatus, loading };
}

export function useEscalation() {
  const [loading, setLoading] = useState(false);
  const escalate = useCallback(async (params: Parameters<typeof agentService.escalateToHuman>[0]) => {
    setLoading(true);
    try { return await agentService.escalateToHuman(params); }
    finally { setLoading(false); }
  }, []);
  return { escalate, loading };
}

export function useReturnToAI() {
  const [loading, setLoading] = useState(false);
  const returnToAI = useCallback(async (params: Parameters<typeof agentService.returnToAI>[0]) => {
    setLoading(true);
    try { return await agentService.returnToAI(params); }
    finally { setLoading(false); }
  }, []);
  return { returnToAI, loading };
}
