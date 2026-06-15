/**
 * Services barrel. All persistent data flows through the repos below;
 * each is a thin cache + pub-sub wrapper over the backend API
 * (see services/api/).
 */

import * as reelsRepo from './reelsRepo';
import * as eventsRepo from './eventsRepo';
import * as ticketsRepo from './ticketsRepo';
import * as notificationsRepo from './notificationsRepo';
import * as followRepo from './followRepo';

export { reelsRepo, eventsRepo, ticketsRepo, notificationsRepo, followRepo };
export { subscribe, emit, CHANNELS } from './store';
export * as notificationScheduler from './notifications';
export * as api from './api';

/**
 * Hydrate all caches in parallel. Called after a successful login (so the
 * JWT is present on the API client) and on app boot to restore any cached
 * UI state. Each repo swallows its own errors so a single bad endpoint
 * can't kill boot — the affected hook surfaces a Connection error instead.
 */
export async function hydrateAll() {
  await Promise.all([
    reelsRepo.hydrate(),
    eventsRepo.hydrate(),
    ticketsRepo.hydrate(),
    notificationsRepo.hydrate(),
    followRepo.hydrate(),
  ]);
}

/** Force every repo to re-read from the backend. */
export async function reloadAll() {
  await Promise.all([
    reelsRepo.reload(),
    eventsRepo.reload(),
    ticketsRepo.reload(),
    notificationsRepo.reload(),
  ]);
}

/** Wipe every cache. Called on logout so the next user starts clean. */
export function clearAll() {
  reelsRepo.clear();
  eventsRepo.clear();
  ticketsRepo.clear();
  notificationsRepo.clear();
  // followRepo is intentionally NOT cleared on logout — guest follows are
  // device-local and should persist across manager login/logout.
}
