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

/**
 * Guest reservation — no account required. The backend uses optionalAuth:
 * the client attaches the JWT only if one exists, so a logged-in manager
 * reserving uses their account while a guest's contact details are stored
 * on the ticket instead.
 */
export function reserve({ eventId, ticketTypeId, holderName, phone, email }) {
  return api.post('/tickets/reserve', { eventId, ticketTypeId, holderName, phone, email });
}

export function updateStatus(id, status) {
  return api.patch(`/tickets/${encodeURIComponent(id)}/status`, { status });
}
