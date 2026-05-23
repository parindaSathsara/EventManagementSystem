/**
 * Auth API surface. Backend is the only source of truth — there is no local
 * fallback. If the network call fails, the error propagates so the UI can
 * render a ConnectionError state.
 *
 * The JWT itself is cached in AsyncStorage (via `client.js`) so the user
 * stays signed in across launches; the cached user object is a hydration
 * hint only and gets refreshed from `/auth/me` on every boot.
 */

import {
  api,
  ApiError,
  setToken,
  loadToken,
  loadStoredUser,
  setStoredUser,
} from './client';

export async function signup({ email, password, fullName, name, phone }) {
  const displayName = name || fullName;
  const data = await api.post(
    '/auth/signup',
    { email, password, name: displayName, phone },
    { auth: false },
  );
  await setToken(data.token);
  await setStoredUser(data.user);
  return data.user;
}

export async function login({ email, password }) {
  const data = await api.post('/auth/login', { email, password }, { auth: false });
  await setToken(data.token);
  await setStoredUser(data.user);
  return data.user;
}

export async function me() {
  const user = await api.get('/auth/me');
  await setStoredUser(user);
  return user;
}

export async function updateProfile({ phone, city, name }) {
  const updated = await api.patch('/auth/complete-profile', { phone, city, name });
  await setStoredUser(updated);
  return updated;
}

export async function logout() {
  // JWT is stateless on the server; clearing the local token is sufficient.
  // When the backend gains token revocation, POST /auth/logout here.
  await setToken(null);
  await setStoredUser(null);
}

/**
 * Called once on app boot. Returns the signed-in user (refreshed from
 * /auth/me) or null if there's no token / the token has expired.
 *
 * Network failures are swallowed — we fall back to the stored user copy
 * so the app still opens offline. The first authenticated request will
 * surface the real error via a typed ApiError.
 */
export async function restoreSession() {
  const token = await loadToken();
  if (!token) return null;

  try {
    const fresh = await api.get('/auth/me');
    if (fresh) {
      await setStoredUser(fresh);
      return fresh;
    }
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      // Token's bad — drop it.
      await setToken(null);
      await setStoredUser(null);
      return null;
    }
    // Network error — fall back to the cached user so the UI can still
    // render. Subsequent fetches will retry the backend on demand.
    const stored = await loadStoredUser();
    if (stored) return stored;
    return null;
  }
  return null;
}
