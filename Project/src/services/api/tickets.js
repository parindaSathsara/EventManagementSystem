/**
 * Tickets API surface. All endpoints are auth-required: tickets are
 * user-owned and the backend filters by the JWT subject automatically.
 */

import { api } from './client';

export function listMine() {
  return api.get('/tickets');
}

export function getById(id) {
  return api.get(`/tickets/${encodeURIComponent(id)}`);
}

export function purchase({ eventId, ticketTypeId, holderName }) {
  return api.post('/tickets', { eventId, ticketTypeId, holderName });
}

export function updateStatus(id, status) {
  return api.patch(`/tickets/${encodeURIComponent(id)}/status`, { status });
}
