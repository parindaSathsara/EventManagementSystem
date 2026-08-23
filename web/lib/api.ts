'use client';

// Same-origin by default. Next.js proxies /api/* to the configured Stage API,
// avoiding browser CORS coupling while keeping the backend unchanged.
const DEFAULT_API = '/api';
export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API).replace(/\/$/, '');
const TOKEN_KEY = 'stage.web.authToken';
const USER_KEY = 'stage.web.authUser';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status = 0, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function storeSession(token: string, user: unknown) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function readStoredUser<T>() {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(USER_KEY);
  if (!value) return null;
  try { return JSON.parse(value) as T; } catch { return null; }
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

type RequestOptions = RequestInit & { auth?: boolean };

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const token = auth ? getToken() : null;
  const isForm = rest.body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      ...(!isForm ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  }).catch((error: Error) => {
    throw new ApiError('Could not reach Stage. Check your connection and try again.', 0, error.message);
  });

  if (response.status === 204) return null as T;
  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = text; }
  }
  if (!response.ok) {
    const shaped = payload as { message?: string; error?: string; details?: unknown } | null;
    throw new ApiError(shaped?.message || shaped?.error || `Request failed (${response.status})`, response.status, shaped?.details);
  }
  return payload as T;
}

export const api = {
  get: <T>(path: string, auth = true) => apiRequest<T>(path, { auth }),
  post: <T>(path: string, body?: unknown, auth = true) =>
    apiRequest<T>(path, { method: 'POST', body: body == null ? undefined : JSON.stringify(body), auth }),
  patch: <T>(path: string, body: unknown) =>
    apiRequest<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, file: File) => {
    const data = new FormData();
    data.append('file', file);
    return apiRequest<T>(path, { method: 'POST', body: data });
  },
};
