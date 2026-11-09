/**
 * Tiny fetch wrapper for the Stage backend.
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

// Default points at the live production API. Override via
// `EXPO_PUBLIC_API_BASE_URL` if you want to aim a dev build at localhost or
// a staging host without touching code.
const DEFAULT_BASE_URL = 'https://events-api.aahaas.com/api';

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

// Every request gets a deadline. A bare `fetch` on a half-dead connection
// (captive Wi-Fi, weak mobile data, a stalled server) can hang for minutes —
// and anything awaiting it, including the boot sequence, hangs with it.
export const DEFAULT_TIMEOUT_MS = 15000;

async function request(
  path,
  { method = 'GET', body, auth = true, headers = {}, timeoutMs = DEFAULT_TIMEOUT_MS } = {},
) {
  const url = `${baseUrl}${path}`;
  // X-Client lets the admin console tell app activity from website activity.
  const finalHeaders = { 'Content-Type': 'application/json', 'X-Client': 'app', ...headers };
  if (auth) {
    const token = await loadToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  let timedOut = false;
  const timer = controller
    ? setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs)
    : null;

  try {
    let res;
    try {
      res = await fetch(url, {
        method,
        headers: finalHeaders,
        body: body != null ? JSON.stringify(body) : undefined,
        signal: controller ? controller.signal : undefined,
      });
    } catch (e) {
      if (timedOut) {
        throw new ApiError('The server is taking too long to respond. Please try again.', {
          status: 0,
          code: 'TIMEOUT',
        });
      }
      // Network / DNS / CORS — surface as a typed error the UI can branch on.
      throw new ApiError('Could not reach the server. Check your connection.', {
        status: 0,
        code: 'NETWORK',
        details: e?.message,
      });
    }

    return await readResponse(res);
  } catch (e) {
    // The body read can stall too — same deadline, same typed error.
    if (timedOut && !(e instanceof ApiError && e.code === 'TIMEOUT')) {
      throw new ApiError('The server is taking too long to respond. Please try again.', {
        status: 0,
        code: 'TIMEOUT',
      });
    }
    throw e;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function readResponse(res) {
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
