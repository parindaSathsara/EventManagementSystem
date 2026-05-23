/**
 * Tiny JSON wrapper around AsyncStorage. Used by `services/api/client.js` for
 * the JWT + cached user; data lists no longer touch this file (they live in
 * the API-backed repos).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@eventsocial.v1.';

export const KEYS = {
  USER: PREFIX + 'user',
  AUTH_TOKEN: PREFIX + 'authToken',
};

export async function readJSON(key, fallback = null) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[storage] read failed', key, e);
    return fallback;
  }
}

export async function writeJSON(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[storage] write failed', key, e);
  }
}

export async function clearAll() {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
