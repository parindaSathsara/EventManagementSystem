/**
 * Anonymous view beacons for the super-admin dashboard (web console /admin).
 *
 * Keyed by the same per-install `deviceId` as follows and push, so "unique
 * visitors" counts installs without needing an account. Fire-and-forget:
 * never awaited by the UI, never throws, and silently dropped offline.
 *
 * The backend collapses repeats (same install + same target within 30 min),
 * so calling these on every screen focus is safe.
 */

import { api } from './api';
import { ensureDeviceId } from './deviceId';

const lastSent = new Map();

async function send(payload) {
  const key = `${payload.kind}|${payload.targetId || ''}`;
  const now = Date.now();
  // React re-mounts / quick back-and-forth: one view, one request.
  if (now - (lastSent.get(key) || 0) < 3000) return;
  lastSent.set(key, now);
  try {
    const visitorId = await ensureDeviceId();
    await api.post('/analytics/track', { ...payload, visitorId, source: 'app' }, { timeoutMs: 8000 });
  } catch {
    /* analytics must never affect the app */
  }
}

/** The app was launched or brought back to the foreground. */
export function trackAppOpen() {
  send({ kind: 'app_open' });
}

/** An event page was opened. */
export function trackEventView(eventId) {
  if (eventId) send({ kind: 'event', targetId: String(eventId) });
}

/** An organizer / artist profile was opened. */
export function trackArtistView(artistId) {
  if (artistId) send({ kind: 'artist', targetId: String(artistId) });
}
