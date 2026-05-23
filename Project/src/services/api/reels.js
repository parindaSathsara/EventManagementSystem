/**
 * Reels API surface. Backend returns reels already decorated per viewer
 * (userReaction, isSaved, isReposted, artist.isFollowing) so the FE just
 * renders what arrives.
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
  return api.get(`/reels${toQuery(params)}`);
}

export function getById(id) {
  return api.get(`/reels/${encodeURIComponent(id)}`);
}

export function create(body) {
  return api.post('/reels', body);
}

// code === null clears the user's reaction.
export function react(id, code) {
  return api.post(`/reels/${encodeURIComponent(id)}/react`, { code });
}

export function toggleSave(id) {
  return api.post(`/reels/${encodeURIComponent(id)}/save`);
}

export function toggleRepost(id) {
  return api.post(`/reels/${encodeURIComponent(id)}/repost`);
}
