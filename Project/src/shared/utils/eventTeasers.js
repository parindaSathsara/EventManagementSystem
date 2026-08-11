/**
 * "Stay tuned" helpers.
 *
 * Event managers publish early — often before the venue is locked, before the
 * lineup is announced and before prices are set. Empty fields must never read
 * as broken UI: every missing piece is shown to the guest as a promise
 * ("revealed soon"), which is also what builds the surprise (client feedback
 * 2026-08-10).
 *
 * Single source of truth so the Timeline card, the event page, the calendar
 * tiles and the alert cards all say the same thing.
 */

/** Price label written by the creator when the organizer hasn't priced yet. */
export const PRICE_TBA = 'Coming soon';

export const TEASER = {
  venue: 'Venue revealed soon',
  lineup: 'Line up revealed soon',
  tickets: 'Ticket details coming soon',
  time: 'Time revealed soon',
  timeShort: 'Time TBA',
  price: PRICE_TBA,
  stayTuned: 'Stay tuned',
};

function isBlank(v) {
  return !v || !String(v).trim();
}

export function hasVenue(event) {
  return !isBlank(event?.venueName);
}

export function hasLineup(event) {
  return Array.isArray(event?.lineup) && event.lineup.length > 0;
}

/**
 * False when only the day is announced. `startsAt` still holds a real date —
 * noon of that day — so never render its clock time in that case.
 */
export function hasStartTime(event) {
  return !event?.startTimeTba;
}

/**
 * Clock time for an event, or the "revealed soon" promise when the organizer
 * hasn't announced one. `short` fits tight rows (poster overlay, list metas).
 */
export function timeLabel(event, { short = false } = {}) {
  if (!hasStartTime(event)) return short ? TEASER.timeShort : TEASER.time;
  const iso = event?.startsAt;
  if (!iso) return short ? TEASER.timeShort : TEASER.time;
  return new Date(iso).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' });
}

/** A ticket type counts as priced once it carries a real price or "Free". */
export function isPriced(ticket) {
  const label = (ticket?.priceLabel || '').trim().toLowerCase();
  if (!label) return false;
  return label !== PRICE_TBA.toLowerCase() && label !== 'tba';
}

export function hasTicketInfo(event) {
  const types = event?.ticketTypes || [];
  return types.length > 0 && types.some(isPriced);
}

/**
 * Venue text for a one-line meta row: the venue + city when known, the
 * "revealed soon" promise when not.
 */
export function venueLine(event, { withCity = true } = {}) {
  const venue = hasVenue(event) ? event.venueName.trim() : null;
  const city = isBlank(event?.cityName) ? null : event.cityName.trim();
  if (venue && city && withCity) return `${venue} · ${city}`;
  if (venue) return venue;
  // City alone is still useful — "Colombo · venue revealed soon".
  if (city && withCity) return `${city} · ${TEASER.venue.toLowerCase()}`;
  return TEASER.venue;
}

/**
 * What this event still has to reveal, as short labels ready for a single
 * teaser line. Returns `[]` for a fully detailed event.
 */
export function pendingDetails(event) {
  if (!event) return [];
  const pending = [];
  if (!hasStartTime(event)) pending.push('Start time');
  if (!hasLineup(event)) pending.push('Line up');
  if (!hasVenue(event)) pending.push('Venue');
  if (!hasTicketInfo(event)) pending.push('Ticket prices');
  return pending;
}

/**
 * One-line teaser for an incomplete event, e.g.
 * "Line up · Venue coming soon — stay tuned". `null` when nothing is missing.
 */
export function teaserLine(event) {
  const pending = pendingDetails(event);
  if (!pending.length) return null;
  return `${pending.join(' · ')} coming soon — ${TEASER.stayTuned.toLowerCase()}`;
}
