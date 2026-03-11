import supabase from '@/lib/supabase';

const baseUrl = import.meta.env.VITE_API_URL ?? '';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (session) headers['Authorization'] = `Bearer ${session.access_token}`;
  return headers;
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw err;
  }
  return res.json();
}

export const apiClient = {
  async get(path: string, params?: Record<string, string>) {
    const url = new URL(`${baseUrl}${path}`);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const headers = await getAuthHeaders();
    const res = await fetch(url.toString(), { method: 'GET', headers });
    return handleResponse(res);
  },

  async post(path: string, body?: unknown) {
    const headers = await getAuthHeaders();
    headers['Content-Type'] = 'application/json';
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse(res);
  },

  async upload(path: string, formData: FormData) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return handleResponse(res);
  },
};
