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
import { ensureDeviceId } from './deviceId';
import * as push from './notifications';

const KEY = '@eventsocial.v1.follows';

let set = new Set();
let hydrated = false;

function persist() {
  AsyncStorage.setItem(KEY, JSON.stringify([...set])).catch(() => {});
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
  // for this device; the API call keeps the company's follower count real
  // AND is what makes this device an audience member for the company's push
  // announcements (the backend joins GuestFollow → PushDevice on this id).
  ensureDeviceId()
    .then((id) => artistsApi.guestFollow(companyId, id, following))
    .catch(() => {});

  // Following someone is the moment a guest has actually asked to hear from
  // us, so it's where the OS permission prompt belongs — not on app launch.
  if (following) push.onFollow().catch(() => {});

  return following;
}

export function clear() {
  set = new Set();
  persist();
  emit(CHANNELS.FOLLOWS);
}
