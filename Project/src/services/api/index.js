/**
 * Single entry point for every backend call.
 *
 *   import { auth, events, reels, tickets, artists, api } from '@/services/api';
 *
 * Each module is feature-scoped and dependency-free beyond the shared
 * `client.js` (which handles base URL, JWT, and error normalisation).
 */

export * as auth from './auth';
export * as events from './events';
export * as reels from './reels';
export * as tickets from './tickets';
export * as artists from './artists';
export * as uploads from './uploads';
export * as notifications from './notifications';
export { api, ApiError, setBaseUrl, getBaseUrl } from './client';
