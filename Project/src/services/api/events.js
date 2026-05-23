/**
 * Events API surface. Thin pass-through that mirrors the backend's
 * `/api/events` shape.
 *
 * `list()` paginates server-side; pass `{ take, skip }` to override defaults.
 * The repo layer (services/eventsRepo) caches the result + emits to subscribers.
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
  return api.get(`/events${toQuery(params)}`);
}

export function getById(id) {
  return api.get(`/events/${encodeURIComponent(id)}`);
}

export function create(body) {
  return api.post('/events', body);
}

export function update(id, patch) {
  return api.patch(`/events/${encodeURIComponent(id)}`, patch);
}

export function remove(id) {
  return api.del(`/events/${encodeURIComponent(id)}`);
}

export function toggleSave(id) {
  return api.post(`/events/${encodeURIComponent(id)}/save`);
}
