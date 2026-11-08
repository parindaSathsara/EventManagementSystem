'use client';

/**
 * Follows — the same model as the mobile app (client feedback 2026-11-08:
 * "give users a follow option like in the app").
 *
 * Anyone can follow an event company, no account needed. The followed set
 * lives in this browser (localStorage), and every toggle is mirrored to the
 * backend's guest-follow endpoint keyed by an anonymous per-browser device id.
 * That keeps the organizer's follower count real and lets the Alerts feed
 * rank "companies you follow" first — exactly what the app does per install.
 */

import { api } from './api';

const FOLLOWS_KEY = 'stage.web.follows';
const DEVICE_KEY = 'stage.web.deviceId';
const CHANGE_EVENT = 'stage:follows';

function read(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(FOLLOWS_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(list) ? list.filter((id): id is string => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

function write(set: Set<string>) {
  try {
    window.localStorage.setItem(FOLLOWS_KEY, JSON.stringify([...set]));
  } catch {
    /* storage blocked (private mode) — the in-page state still works */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Anonymous id for this browser (matches the backend's 8–64 char rule). */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = window.localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = `web-${crypto.randomUUID()}`;
      window.localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function getFollowed(): string[] {
  return [...read()];
}

export function isFollowing(companyId?: string | null) {
  return !!companyId && read().has(companyId);
}

/**
 * Follow / unfollow a company. Local state flips immediately; the backend
 * answers with the company's real follower count.
 */
export async function setFollowing(companyId: string, follow: boolean): Promise<{ following: boolean; followerCount?: number }> {
  const set = read();
  if (follow) set.add(companyId); else set.delete(companyId);
  write(set);
  try {
    return await api.post<{ following: boolean; followerCount: number }>(
      `/artists/${encodeURIComponent(companyId)}/guest-follow`,
      { deviceId: getDeviceId(), follow },
      false,
    );
  } catch {
    // Offline / server hiccup: the follow still counts on this browser; the
    // next toggle re-syncs it.
    return { following: follow };
  }
}

/** Subscribe to follow changes in this tab and in other tabs. */
export function subscribeFollows(listener: () => void) {
  const onStorage = (e: StorageEvent) => { if (e.key === FOLLOWS_KEY) listener(); };
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener('storage', onStorage);
  };
}
