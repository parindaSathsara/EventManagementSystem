/**
 * Artists API surface. `become()` upgrades the current user to artist;
 * `updateMine()` patches the caller's own artist profile.
 */

import { api } from './client';

function toQuery(params = {}) {
  const parts = [];
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === '') continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

export function list(params = {}) {
  return api.get(`/artists${toQuery(params)}`);
}

/** Returns the caller's own artist profile, or null if they're not an artist. */
export function me() {
  return api.get('/artists/me');
}

export function getById(id) {
  return api.get(`/artists/${encodeURIComponent(id)}`);
}

export function become({ handle, bio, category }) {
  return api.post('/artists/become', { handle, bio, category });
}

export function updateMine(patch) {
  return api.patch('/artists/me', patch);
}

export function toggleFollow(id) {
  return api.post(`/artists/${encodeURIComponent(id)}/follow`);
}

/**
 * Anonymous follow sync for guests (no account). Sends the desired state
 * with the per-install device id so the backend's follower count stays real.
 */
export function guestFollow(id, deviceId, follow) {
  return api.post(`/artists/${encodeURIComponent(id)}/guest-follow`, { deviceId, follow });
}
