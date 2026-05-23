/**
 * Events repo — backend-backed, in-memory cached, pub/sub on every write.
 *
 * Reads:
 *   - `getAll()` / `getById()` are sync and read from the cache. They return
 *     stale data while a fetch is in-flight (UI shows a loading hint via
 *     the hook).
 *   - `fetch()` (re)hydrates the cache from the API and emits the EVENTS
 *     channel. Idempotent — callable as often as you like.
 *
 * Writes:
 *   Optimistic: update cache + emit, fire the API call, on failure roll back
 *   the local change and re-throw so the UI can surface the error.
 */

import { events as eventsApi } from './api';
import { emit, CHANNELS } from './store';

let cache = [];
let lastError = null;
let inflight = null;

function _set(next) {
  cache = next;
  emit(CHANNELS.EVENTS);
}

export function getAll() { return cache; }
export function getById(id) { return cache.find((e) => e.id === id) || null; }
export function getByOrganizer(artistId) {
  return cache.filter((e) => e.organizerArtistId === artistId);
}
export function getLastError() { return lastError; }
export function isLoading() { return inflight != null; }

/**
 * Force a refresh from the API. Returns the fresh array (or throws on error
 * so callers can render a Connection error state).
 */
export async function fetch(params = {}) {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const data = await eventsApi.list(params);
      lastError = null;
      _set(data.items || []);
      return cache;
    } catch (err) {
      lastError = err;
      emit(CHANNELS.EVENTS);
      throw err;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Compatibility shim for App.js boot — does nothing if no token yet. */
export async function hydrate() {
  try {
    await fetch();
  } catch {
    /* leave cache empty; hooks will retry */
  }
  return cache;
}

export async function reload() {
  return fetch();
}

export async function create(event) {
  const created = await eventsApi.create(event);
  _set([created, ...cache]);
  return created;
}

export async function update(eventId, patch) {
  // Optimistic local update.
  const prev = cache;
  _set(cache.map((e) => (e.id === eventId ? { ...e, ...patch } : e)));
  try {
    const updated = await eventsApi.update(eventId, patch);
    _set(cache.map((e) => (e.id === eventId ? updated : e)));
    return updated;
  } catch (err) {
    _set(prev);
    throw err;
  }
}

export async function toggleSave(eventId) {
  const prev = cache;
  _set(cache.map((e) => (e.id === eventId ? { ...e, isSaved: !e.isSaved } : e)));
  try {
    await eventsApi.toggleSave(eventId);
  } catch (err) {
    _set(prev);
    throw err;
  }
}

/**
 * Local-only stock tween. Backend decrements automatically on ticket purchase;
 * this keeps the UI in sync until the next `fetch()` reconciles.
 */
export async function decrementTicket(eventId, ticketTypeId, by = 1) {
  _set(cache.map((e) => {
    if (e.id !== eventId) return e;
    const ticketTypes = e.ticketTypes.map((t) =>
      t.id === ticketTypeId
        ? { ...t, remaining: Math.max(0, (t.remaining || 0) - by) }
        : t,
    );
    return { ...e, ticketTypes };
  }));
}

export async function remove(eventId) {
  const prev = cache;
  _set(cache.filter((e) => e.id !== eventId));
  try {
    await eventsApi.remove(eventId);
  } catch (err) {
    _set(prev);
    throw err;
  }
}

/** Wipe the cache. Called on logout so the next user doesn't see stale data. */
export function clear() {
  _set([]);
  lastError = null;
}
