import { createSupabaseBrowserClient } from './supabase-browser';

export async function apiFetch<T>(path: string, init: RequestInit = {}) {
  const base = process.env.NEXT_PUBLIC_API_URL ?? '';
  if (!base) throw new Error('NEXT_PUBLIC_API_URL is not configured');

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error('Unable to read authentication session');
  const token = data.session?.access_token;
  if (!token) throw new Error('Authentication required');

  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${base}${path}`, { ...init, headers, cache: 'no-store' });
  if (!response.ok) {
    const requestId = response.headers.get('x-request-id');
    throw new Error(`API request failed (${response.status})${requestId ? ` [${requestId}]` : ''}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
