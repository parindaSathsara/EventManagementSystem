'use client';

import { API_BASE, getToken } from './api';

/**
 * Anonymous traffic beacons for the super-admin dashboard.
 *
 * Every browser gets a random visitor id (localStorage) so the console can
 * count unique visitors without accounts. Beacons are fire-and-forget: they
 * use `keepalive` so a view still lands when the visitor navigates away, and
 * they never throw into the page.
 */

const VISITOR_KEY = 'stage.web.visitorId';
let memoryId: string | null = null;

export function visitorId() {
  if (memoryId) return memoryId;
  try {
    const stored = window.localStorage.getItem(VISITOR_KEY);
    if (stored) return (memoryId = stored);
    const made = `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    window.localStorage.setItem(VISITOR_KEY, made);
    return (memoryId = made);
  } catch {
    // Private mode / storage blocked: still count this tab's session.
    memoryId = `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    return memoryId;
  }
}

type Beacon =
  | { kind: 'page'; path: string }
  | { kind: 'event'; targetId: string }
  | { kind: 'artist'; targetId: string };

// Same beacon twice within a moment (React re-mounting a page) is one view.
const lastSent = new Map<string, number>();

export function track(beacon: Beacon) {
  if (typeof window === 'undefined') return;
  const key = `${beacon.kind}|${'path' in beacon ? beacon.path : beacon.targetId}`;
  const now = Date.now();
  if (now - (lastSent.get(key) || 0) < 3000) return;
  lastSent.set(key, now);
  try {
    const token = getToken();
    void fetch(`${API_BASE}/analytics/track`, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        'X-Client': 'web',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        ...beacon,
        visitorId: visitorId(),
        source: 'web',
        referrer: document.referrer && !document.referrer.startsWith(window.location.origin) ? document.referrer.slice(0, 255) : null,
      }),
    }).catch(() => {});
  } catch {
    /* analytics must never break the page */
  }
}
