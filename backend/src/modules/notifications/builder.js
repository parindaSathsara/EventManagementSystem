/**
 * Notification copy, in one place.
 *
 * Every alert the product sends exists twice — once as a card in the Alerts
 * tab, once as an OS push — and the two must read the same. So both are built
 * from the same `notification()` call here: the feed renders `.title`/`.body`,
 * the push sends `.title`/`.body`, and `.dedupeKey` is what stops a device
 * being told the same thing twice.
 *
 * Pure functions only — no Prisma, no I/O.
 */

const DAY_MS = 24 * 3600 * 1000;

const TYPES = {
  PUBLISHED: 'event_published',
  UPDATED: 'event_updated',
  CANCELLED: 'event_cancelled',
  REMINDER: 'event_reminder',
};

// Android notification channels. Mirrored exactly in the app
// (Project/src/services/notifications.js) — a channelId the client never
// created falls back to "default", which is why these two lists must agree.
const CHANNELS = {
  REMINDERS: 'reminders',
  NEW_EVENTS: 'new-events',
  DEFAULT: 'default',
};

function startOfUtcDay(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Whole-day difference: the event's day minus today's. */
function daysUntil(eventStart, now = new Date()) {
  return Math.round((startOfUtcDay(new Date(eventStart)) - startOfUtcDay(now)) / DAY_MS);
}

/** "Company · " prefix, or "" when the organizer has no display name. */
function companyName(event) {
  return event?.organizer?.user?.name || event?.organizer?.handle || null;
}

/**
 * The venue half of a line. Events can be published before the venue is
 * announced (client feedback 2026-08-10), so this must never render
 * "at undefined" — it renders nothing.
 */
function venueSuffix(event) {
  return event?.venueName ? ` · ${event.venueName}` : '';
}

function dayLabel(daysOut) {
  if (daysOut <= 0) return 'Today';
  if (daysOut === 1) return 'Tomorrow';
  return `In ${daysOut} days`;
}

/**
 * Build one notification.
 *
 * @param {string} type    One of TYPES.
 * @param {object} event   Event row (with `organizer.user` selected).
 * @param {object} [opts]
 * @param {number} [opts.daysOut] Required for TYPES.REMINDER.
 * @returns {{
 *   key: string, dedupeKey: string, type: string, eventId: string,
 *   title: string, body: string, channelId: string, data: object
 * }}
 */
function notification(type, event, { daysOut } = {}) {
  const company = companyName(event);
  const withCompany = company ? `${company} · ` : '';
  let title;
  let body;
  let channelId = CHANNELS.DEFAULT;
  let dedupeKey;

  switch (type) {
    case TYPES.REMINDER: {
      const d = daysOut ?? daysUntil(event.startsAt);
      title = `${dayLabel(d)} 🎉`;
      body = `${withCompany}${event.title}${venueSuffix(event)}`;
      channelId = CHANNELS.REMINDERS;
      dedupeKey = `evt:${event.id}:T-${d}`;
      break;
    }
    case TYPES.UPDATED:
      title = company ? `${company} updated an event` : 'An event was updated';
      body = `${event.title}${venueSuffix(event)}`;
      channelId = CHANNELS.NEW_EVENTS;
      // One "updated" push per event per day, however many edits land — the
      // organizer tweaking prices five times running is not five alerts.
      dedupeKey = `evt:${event.id}:updated:${startOfUtcDay(new Date()).toISOString().slice(0, 10)}`;
      break;
    case TYPES.CANCELLED:
      title = 'Event cancelled';
      body = `${withCompany}${event.title} won't be going ahead.`;
      channelId = CHANNELS.NEW_EVENTS;
      dedupeKey = `evt:${event.id}:cancelled`;
      break;
    case TYPES.PUBLISHED:
    default:
      title = company ? `${company} just announced` : 'New event announced';
      body = `${event.title}${venueSuffix(event)}`;
      channelId = CHANNELS.NEW_EVENTS;
      dedupeKey = `evt:${event.id}:published`;
      break;
  }

  return {
    // `key` is the client-side identity of the card (stable across refetches
    // so "unread" state sticks); `dedupeKey` is the server-side identity of
    // the *delivery*. They're the same string today, deliberately kept apart
    // so push dedupe can get smarter without breaking the feed.
    key: dedupeKey,
    dedupeKey,
    type: type || TYPES.PUBLISHED,
    eventId: event.id,
    title,
    body,
    channelId,
    // Payload the app reads on tap → opens the event. Keep it small and
    // string-valued: FCM data payloads are string maps.
    data: { type: type || TYPES.PUBLISHED, eventId: event.id, key: dedupeKey },
  };
}

module.exports = { TYPES, CHANNELS, notification, daysUntil, companyName, dayLabel };
