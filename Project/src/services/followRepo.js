/**
 * Follow repo — local, AsyncStorage-backed set of followed company (organizer
 * artist) IDs. Guests have no account, so "Following" lives on-device, BUT
 * every toggle is also synced to the backend (keyed by an anonymous
 * per-install device id) so the organizer's follower count stays real.
 *
 * Sync reads from an in-memory mirror (hydrated on boot); writes persist to
 * AsyncStorage and emit on the FOLLOWS channel so subscribed screens refresh.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { emit, CHANNELS } from './store';
import { artists as artistsApi } from './api';

const KEY = '@eventsocial.v1.follows';
const DEVICE_KEY = '@eventsocial.v1.deviceId';

let set = new Set();
let hydrated = false;
let deviceId = null;
let deviceIdPromise = null;

function persist() {
  AsyncStorage.setItem(KEY, JSON.stringify([...set])).catch(() => {});
}

function makeDeviceId() {
  return `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Resolves the persistent per-install device id, creating it on first use. */
function ensureDeviceId() {
  if (deviceId) return Promise.resolve(deviceId);
  if (!deviceIdPromise) {
    deviceIdPromise = (async () => {
      try {
        deviceId = await AsyncStorage.getItem(DEVICE_KEY);
        if (!deviceId) {
          deviceId = makeDeviceId();
          await AsyncStorage.setItem(DEVICE_KEY, deviceId);
        }
      } catch {
        deviceId = deviceId || makeDeviceId(); // in-memory fallback for this run
      }
      return deviceId;
    })();
  }
  return deviceIdPromise;
}

export async function hydrate() {
  if (hydrated) return [...set];
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) set = new Set(JSON.parse(raw));
  } catch {
    /* start empty on a parse/storage error */
  }
  await ensureDeviceId();
  hydrated = true;
  emit(CHANNELS.FOLLOWS);
  return [...set];
}

export function getAll() { return [...set]; }
export function isFollowing(companyId) { return set.has(companyId); }

export function toggle(companyId) {
  if (!companyId) return false;
  let following;
  if (set.has(companyId)) {
    set.delete(companyId);
    following = false;
  } else {
    set.add(companyId);
    following = true;
  }
  persist();
  emit(CHANNELS.FOLLOWS);
  // Fire-and-forget backend sync — the local state is the source of truth
  // for this device; the API call keeps the company's follower count real.
  ensureDeviceId()
    .then((id) => artistsApi.guestFollow(companyId, id, following))
    .catch(() => {});
  return following;
}

export function clear() {
  set = new Set();
  persist();
  emit(CHANNELS.FOLLOWS);
}
