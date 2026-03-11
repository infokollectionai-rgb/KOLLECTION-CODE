import supabase from '@/lib/supabase';

const baseUrl = import.meta.env.VITE_API_URL ?? '';

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session) headers['Authorization'] = `Bearer ${session.access_token}`;
    return headers;
  } catch (e) {
    console.warn('Failed to get auth session for request headers', e);
    return {};
  }
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw err;
  }
  return res.json();
}

function ensureBaseUrl() {
  if (!baseUrl) {
    throw new Error('Backend URL not configured. Set VITE_API_URL in your environment.');
  }
}

export const apiClient = {
  async get(path: string, params?: Record<string, string>) {
    ensureBaseUrl();
    try {
      const url = new URL(`${baseUrl}${path}`);
      if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
      const headers = await getAuthHeaders();
      const res = await fetch(url.toString(), { method: 'GET', headers });
      return handleResponse(res);
    } catch (e) {
      console.error('apiClient.get error:', e);
      throw e;
    }
  },

  async post(path: string, body?: unknown) {
    ensureBaseUrl();
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      return handleResponse(res);
    } catch (e) {
      console.error('apiClient.post error:', e);
      throw e;
    }
  },

  async upload(path: string, formData: FormData) {
    ensureBaseUrl();
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers,
        body: formData,
      });
      return handleResponse(res);
    } catch (e) {
      console.error('apiClient.upload error:', e);
      throw e;
    }
  },
};
