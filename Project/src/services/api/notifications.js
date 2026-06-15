/**
 * Notifications API surface. The backend computes a reminder feed for events
 * 1–2 days out (T-1 / T-2). Guest-readable — no token required.
 */

import { api } from './client';

export function list() {
  return api.get('/notifications');
}
