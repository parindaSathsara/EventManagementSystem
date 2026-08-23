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
import * as alertsSeenRepo from './alertsSeenRepo';
import * as pushService from './notifications';

export { reelsRepo, eventsRepo, ticketsRepo, notificationsRepo, followRepo, alertsSeenRepo };
export { subscribe, emit, CHANNELS } from './store';
export { ensureDeviceId } from './deviceId';
/**
 * `push` is the notification service: OS permission, the Expo push token, and
 * the on-device reminder schedule. Exported under the old
 * `notificationScheduler` name too — it started life as local scheduling only.
 */
export * as push from './notifications';
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
    alertsSeenRepo.hydrate(),
    // Refreshes this install's push registration (and its liveness heartbeat,
    // which is how the backend knows not to duplicate the on-device
    // reminders). `prompt: false` — boot never shows an OS permission dialog.
    pushService.register({ prompt: false }).catch(() => {}),
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
