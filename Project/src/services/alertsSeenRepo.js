/**
 * Alerts-seen repo — remembers when the guest last opened the Alerts tab so
 * the tab badge (dot) only shows for genuinely new activity: reminder items
 * and fresh events published by companies the guest follows.
 *
 * Device-local (AsyncStorage), same pattern as followRepo.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { emit, CHANNELS } from './store';

const KEY = '@eventsocial.v1.alertsSeenAt';

let seenAt = 0; // epoch ms of the last time the Alerts tab was opened
let hydrated = false;

export async function hydrate() {
  if (hydrated) return seenAt;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) seenAt = parseInt(raw, 10) || 0;
  } catch {
    /* start at 0 — everything counts as unseen */
  }
  hydrated = true;
  emit(CHANNELS.ALERTS_SEEN);
  return seenAt;
}

export function getSeenAt() {
  return seenAt;
}

/** Call when the Alerts tab is opened — clears the unseen dot. */
export function markSeen() {
  seenAt = Date.now();
  AsyncStorage.setItem(KEY, String(seenAt)).catch(() => {});
  emit(CHANNELS.ALERTS_SEEN);
}
