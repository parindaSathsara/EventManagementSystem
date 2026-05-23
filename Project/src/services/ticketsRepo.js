/**
 * Tickets repo — auth-required everywhere.
 *
 * `fetch()` is a no-op when there's no JWT (e.g. user logged out).
 */

import { tickets as ticketsApi } from './api';
import { emit, CHANNELS } from './store';

let cache = [];
let lastError = null;
let inflight = null;

function _set(next) {
  cache = next;
  emit(CHANNELS.TICKETS);
}

export function getAll() { return cache; }
export function getById(id) { return cache.find((t) => t.id === id) || null; }
export function getLastError() { return lastError; }
export function isLoading() { return inflight != null; }

export async function fetch() {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const data = await ticketsApi.listMine();
      lastError = null;
      _set(data.items || []);
      return cache;
    } catch (err) {
      lastError = err;
      emit(CHANNELS.TICKETS);
      throw err;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export async function hydrate() {
  try {
    await fetch();
  } catch {
    /* swallow; the hook will retry once the user signs in */
  }
  return cache;
}

export async function reload() {
  return fetch();
}

/**
 * Purchase signature kept compatible with the old AsyncStorage repo
 * (`{ eventId, typeName }`) so EventDetailScreen doesn't need to change.
 * Resolves the ticketTypeId by name out of the cached event before calling
 * the backend.
 */
export async function create({ eventId, typeName, holderName = 'You' }) {
  // We need the ticketTypeId; ask the events repo cache for it.
  const { eventsRepo } = require('./index');
  const event = eventsRepo.getById(eventId);
  const tt = event?.ticketTypes?.find((t) => t.name === typeName);
  if (!tt) {
    throw new Error(`Unknown ticket tier "${typeName}" for this event.`);
  }
  const ticket = await ticketsApi.purchase({
    eventId,
    ticketTypeId: tt.id,
    holderName,
  });
  _set([ticket, ...cache]);
  return ticket;
}

export async function markUsed(ticketId) {
  const prev = cache;
  _set(cache.map((t) => (t.id === ticketId ? { ...t, status: 'used' } : t)));
  try {
    const updated = await ticketsApi.updateStatus(ticketId, 'used');
    _set(cache.map((t) => (t.id === ticketId ? updated : t)));
    return updated;
  } catch (err) {
    _set(prev);
    throw err;
  }
}

export async function remove(ticketId) {
  const prev = cache;
  _set(cache.filter((t) => t.id !== ticketId));
  try {
    await ticketsApi.updateStatus(ticketId, 'cancelled');
  } catch (err) {
    _set(prev);
    throw err;
  }
}

export function clear() {
  _set([]);
  lastError = null;
}
