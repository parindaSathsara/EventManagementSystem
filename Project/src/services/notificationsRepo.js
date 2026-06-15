/**
 * Notifications repo — backend-backed reminder feed, in-memory cached with
 * pub/sub. Mirrors eventsRepo's shape so the UI hook reads identically.
 */

import { notifications as notificationsApi } from './api';
import { emit, CHANNELS } from './store';

let cache = [];
let lastError = null;
let inflight = null;

function _set(next) {
  cache = next;
  emit(CHANNELS.NOTIFICATIONS);
}

export function getAll() { return cache; }
export function getLastError() { return lastError; }
export function isLoading() { return inflight != null; }

export async function fetch() {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const data = await notificationsApi.list();
      lastError = null;
      _set(data.items || []);
      return cache;
    } catch (err) {
      lastError = err;
      emit(CHANNELS.NOTIFICATIONS);
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
    /* leave cache empty; the hook will retry */
  }
  return cache;
}

export async function reload() {
  return fetch();
}

export function clear() {
  _set([]);
  lastError = null;
}
