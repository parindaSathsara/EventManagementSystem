/**
 * Reels repo — same shape/contract as eventsRepo.
 *
 * Backend returns reels already decorated with the viewer's reaction / save /
 * repost state, so the FE just renders. Mutations are optimistic.
 */

import { reels as reelsApi, artists as artistsApi } from './api';
import { emit, CHANNELS } from './store';

let cache = [];
let lastError = null;
let inflight = null;

function _set(next) {
  cache = next;
  emit(CHANNELS.REELS);
}

export function getAll() { return cache; }
export function getById(id) { return cache.find((r) => r.id === id) || null; }
export function getByArtist(artistId) {
  return cache.filter((r) => r.artist && r.artist.id === artistId);
}
export function getLastError() { return lastError; }
export function isLoading() { return inflight != null; }

export async function fetch(params = {}) {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const data = await reelsApi.list(params);
      lastError = null;
      _set(data.items || []);
      return cache;
    } catch (err) {
      lastError = err;
      emit(CHANNELS.REELS);
      throw err;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export async function hydrate() {
  try {
    await fetch();
  } catch {
    /* swallow; hooks will retry */
  }
  return cache;
}

export async function reload() {
  return fetch();
}

export async function create(reel) {
  const created = await reelsApi.create(reel);
  _set([created, ...cache]);
  return created;
}

export async function reactTo(reelId, reactionCode) {
  const target = cache.find((r) => r.id === reelId);
  if (!target) return;
  const previous = target.userReaction;
  // Same code → toggle off. Different code → switch.
  const next = previous === reactionCode ? null : reactionCode;

  const prev = cache;
  _set(cache.map((r) => {
    if (r.id !== reelId) return r;
    const reactions = { ...r.stats.reactions };
    if (previous) reactions[previous] = Math.max(0, (reactions[previous] || 0) - 1);
    if (next) reactions[next] = (reactions[next] || 0) + 1;
    return { ...r, userReaction: next, stats: { ...r.stats, reactions } };
  }));

  try {
    await reelsApi.react(reelId, next);
  } catch (err) {
    _set(prev);
    throw err;
  }
}

export async function toggleSave(reelId) {
  const prev = cache;
  _set(cache.map((reel) => {
    if (reel.id !== reelId) return reel;
    const next = !reel.isSaved;
    return {
      ...reel,
      isSaved: next,
      stats: { ...reel.stats, saves: Math.max(0, reel.stats.saves + (next ? 1 : -1)) },
    };
  }));
  try {
    await reelsApi.toggleSave(reelId);
  } catch (err) {
    _set(prev);
    throw err;
  }
}

export async function toggleRepost(reelId) {
  const prev = cache;
  _set(cache.map((reel) => {
    if (reel.id !== reelId) return reel;
    const next = !reel.isReposted;
    return {
      ...reel,
      isReposted: next,
      stats: { ...reel.stats, reposts: Math.max(0, reel.stats.reposts + (next ? 1 : -1)) },
    };
  }));
  try {
    await reelsApi.toggleRepost(reelId);
  } catch (err) {
    _set(prev);
    throw err;
  }
}

/** Follow toggle is artist-scoped: backend updates the canonical state,
 *  we sync every cached reel that references that artist. */
export async function toggleFollow(artistId) {
  const prev = cache;
  _set(cache.map((reel) => {
    if (!reel.artist || reel.artist.id !== artistId) return reel;
    return {
      ...reel,
      artist: { ...reel.artist, isFollowing: !reel.artist.isFollowing },
    };
  }));
  try {
    await artistsApi.toggleFollow(artistId);
  } catch (err) {
    _set(prev);
    throw err;
  }
}

export async function remove(reelId) {
  const prev = cache;
  _set(cache.filter((r) => r.id !== reelId));
  try {
    // No DELETE endpoint yet — backend treats publish as immutable for now.
    // Keep the local removal so the artist's profile updates immediately.
  } catch (err) {
    _set(prev);
    throw err;
  }
}

export function clear() {
  _set([]);
  lastError = null;
}
