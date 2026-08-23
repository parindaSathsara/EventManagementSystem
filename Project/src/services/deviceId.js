/**
 * Anonymous per-install device id.
 *
 * The guest-first app has no accounts, so this string IS the user as far as
 * the backend is concerned: it keys `GuestFollow` (which company do you
 * follow) and `PushDevice` (where do we push). Both must agree, which is why
 * it lives here rather than privately inside one repo.
 *
 * The storage key is deliberately unchanged from when followRepo owned it —
 * rotating it would orphan every existing install's follows.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@eventsocial.v1.deviceId';

let deviceId = null;
let inflight = null;

function make() {
  return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Synchronous read for callers that can tolerate `null` before hydration. */
export function peek() {
  return deviceId;
}

/** Resolves the persistent id, creating it on first use. Safe to call often. */
export function ensureDeviceId() {
  if (deviceId) return Promise.resolve(deviceId);
  if (!inflight) {
    inflight = (async () => {
      try {
        deviceId = await AsyncStorage.getItem(KEY);
        if (!deviceId) {
          deviceId = make();
          await AsyncStorage.setItem(KEY, deviceId);
        }
      } catch {
        // Storage unavailable — fall back to an in-memory id so this run still
        // works. Follows/push just won't survive a restart.
        deviceId = deviceId || make();
      }
      return deviceId;
    })();
  }
  return inflight;
}

export default ensureDeviceId;
