/**
 * Follow repo — local, AsyncStorage-backed set of followed company (organizer
 * artist) IDs. Guests have no account, so "Following" lives on-device only.
 *
 * Sync reads from an in-memory mirror (hydrated on boot); writes persist to
 * AsyncStorage and emit on the FOLLOWS channel so subscribed screens refresh.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { emit, CHANNELS } from './store';

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
  return following;
}

export function clear() {
  set = new Set();
  persist();
  emit(CHANNELS.FOLLOWS);
}
