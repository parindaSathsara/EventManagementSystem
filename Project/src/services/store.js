/**
 * Minimal pub/sub. Repos call emit() after a write — UI hooks subscribe
 * and re-fetch. Avoids dragging in Redux/Zustand for a demo build.
 *
 * Channels are coarse-grained on purpose ('reels', 'events', 'tickets').
 * Any change to that domain re-fires every subscriber on that channel.
 */

const listeners = new Map(); // channel -> Set<fn>

function getSet(channel) {
  if (!listeners.has(channel)) listeners.set(channel, new Set());
  return listeners.get(channel);
}

export function subscribe(channel, fn) {
  const set = getSet(channel);
  set.add(fn);
  return () => set.delete(fn);
}

export function emit(channel) {
  const set = listeners.get(channel);
  if (!set) return;
  set.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.warn('[store] listener threw', e);
    }
  });
}

export const CHANNELS = {
  REELS: 'reels',
  EVENTS: 'events',
  TICKETS: 'tickets',
  NOTIFICATIONS: 'notifications',
  FOLLOWS: 'follows',
};
