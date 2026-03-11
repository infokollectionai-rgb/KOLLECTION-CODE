import supabase from '@/lib/supabase';

const baseUrl = import.meta.env.VITE_API_URL ?? '';

async function authFetch(path: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session) headers['Authorization'] = `Bearer ${session.access_token}`;

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string>) },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw err;
  }

  return res.json();
}

export async function registerCompany(payload: Record<string, unknown>) {
  return authFetch('/companies/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function testTwilioConnection(account_sid: string, auth_token: string) {
  return authFetch('/provision/test-twilio', {
    method: 'POST',
    body: JSON.stringify({ account_sid, auth_token }),
  });
}

export async function testSendgridConnection(api_key: string) {
  return authFetch('/provision/test-sendgrid', {
    method: 'POST',
    body: JSON.stringify({ api_key }),
  });
}

export async function testVapiConnection(api_key: string, assistant_id: string) {
  return authFetch('/provision/test-vapi', {
    method: 'POST',
    body: JSON.stringify({ api_key, assistant_id }),
  });
}

export async function initiateStripeConnect(companyId: string) {
  return authFetch('/stripe/connect/onboard', {
    method: 'POST',
    body: JSON.stringify({ company_id: companyId }),
  });
}
