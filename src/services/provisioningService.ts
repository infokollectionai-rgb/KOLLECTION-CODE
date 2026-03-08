const API_BASE = import.meta.env.VITE_API_URL || 'https://api.kollection.io';
const IS_DEMO = !import.meta.env.VITE_APP_ENV || import.meta.env.VITE_APP_ENV === 'demo';
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function verifyTwilio({ accountSid, authToken, phoneNumber }: { accountSid: string; authToken: string; phoneNumber: string }) {
  if (IS_DEMO) {
    await wait(1400);
    return {
      valid: true,
      phoneNumber: phoneNumber || '+18005550123',
      accountName: 'QuickCash Loans Twilio',
      message: 'Twilio credentials verified successfully.',
    };
  }
  const res = await fetch(`${API_BASE}/provision/twilio/verify`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountSid, authToken, phoneNumber }),
  });
  return res.json();
}

export async function verifyStripe({ publishableKey, secretKey }: { publishableKey: string; secretKey: string }) {
  if (IS_DEMO) {
    await wait(1200);
    return {
      valid: true,
      accountId: 'acct_demo_xxx',
      accountName: 'QuickCash Loans Stripe',
      currency: 'cad',
      message: 'Stripe account connected successfully.',
    };
  }
  const res = await fetch(`${API_BASE}/provision/stripe/verify`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publishableKey, secretKey }),
  });
  return res.json();
}

export async function verifyVapi({ apiKey, agentName, voice }: { apiKey: string; agentName?: string; voice?: string }) {
  if (IS_DEMO) {
    await wait(1600);
    return {
      valid: true,
      assistantId: 'asst_demo_xxx',
      agentName: agentName || 'Alex',
      voice,
      message: 'VAPI assistant verified and configured.',
    };
  }
  const res = await fetch(`${API_BASE}/provision/vapi/verify`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, agentName, voice }),
  });
  return res.json();
}

export async function getInfrastructureStatus({ companyId }: { companyId: string }) {
  if (IS_DEMO) {
    await wait(400);
    return {
      twilio: { connected: true, phoneNumber: '+18005550123', lastVerified: '2025-07-15' },
      stripe: { connected: true, accountId: 'acct_demo_xxx', lastVerified: '2025-07-15' },
      vapi: { connected: true, assistantId: 'asst_demo_xxx', agentName: 'Alex', lastVerified: '2025-07-15' },
    };
  }
  const res = await fetch(`${API_BASE}/provision/status/${companyId}`);
  return res.json();
}
