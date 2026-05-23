/**
 * Tiny fetch wrapper for the EventSocial backend.
 *
 * Responsibilities:
 *   - Holds the API base URL (overridable via env / Expo config).
 *   - Attaches the JWT from AsyncStorage on every authenticated call.
 *   - Normalises non-2xx responses into `ApiError` instances the UI can render.
 *   - Provides `request()` / `get()` / `post()` / `patch()` / `del()` helpers.
 *
 * Keep this file dependency-free: no React, no Expo modules beyond AsyncStorage.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@eventsocial.v1.authToken';
const USER_KEY = '@eventsocial.v1.authUser';

// Default points at the live API. Override via `EXPO_PUBLIC_API_BASE_URL` if
// you want to point Expo dev builds at localhost without touching code.
const DEFAULT_BASE_URL = 'http://35.197.143.222:8000/api';

let baseUrl =
  (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_API_BASE_URL) ||
  DEFAULT_BASE_URL;

let cachedToken = null;
let cachedUser = null;

export class ApiError extends Error {
  constructor(message, { status = 0, code, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function setBaseUrl(url) {
  baseUrl = url;
}

export function getBaseUrl() {
  return baseUrl;
}

export async function loadToken() {
  if (cachedToken) return cachedToken;
  cachedToken = (await AsyncStorage.getItem(TOKEN_KEY)) || null;
  return cachedToken;
}

export async function setToken(token) {
  cachedToken = token || null;
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

export async function loadStoredUser() {
  if (cachedUser) return cachedUser;
  const raw = await AsyncStorage.getItem(USER_KEY);
  cachedUser = raw ? JSON.parse(raw) : null;
  return cachedUser;
}

export async function setStoredUser(user) {
  cachedUser = user || null;
  if (user) {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    await AsyncStorage.removeItem(USER_KEY);
  }
}

async function request(path, { method = 'GET', body, auth = true, headers = {} } = {}) {
  const url = `${baseUrl}${path}`;
  const finalHeaders = { 'Content-Type': 'application/json', ...headers };
  if (auth) {
    const token = await loadToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body != null ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    // Network / DNS / CORS — surface as a typed error the UI can branch on.
    throw new ApiError('Could not reach the server. Check your connection.', {
      status: 0,
      code: 'NETWORK',
      details: e?.message,
    });
  }

  // 204 No Content
  if (res.status === 204) return null;

  let payload = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const message =
      (payload && (payload.message || payload.error)) || `Request failed (${res.status})`;
    throw new ApiError(message, {
      status: res.status,
      code: payload?.code,
      details: payload?.details,
    });
  }

  return payload;
}

export const api = {
  request,
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};
