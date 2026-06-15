/**
 * Pure date-bucketing helpers used by Calendar / Search / Insights.
 *
 * Lives outside the data layer so we can delete the mock catalog without
 * losing these utilities. None of them touch storage — they operate on
 * arbitrary event arrays.
 */

export const CATEGORIES = ['All', 'Concert', 'Festival', 'Party', 'Live Set', 'Experience'];

/** Returns events whose `startsAt` ISO begins with the given YYYY-MM-DD key. */
export function eventsForDay(events, dateString) {
  if (!dateString) return [];
  return events.filter((e) => typeof e.startsAt === 'string' && e.startsAt.startsWith(dateString));
}

/** Filters events to a calendar month (UTC). */
export function eventsByMonth(events, year, monthIdx) {
  return events.filter((e) => {
    const d = new Date(e.startsAt);
    return d.getUTCFullYear() === year && d.getUTCMonth() === monthIdx;
  });
}

/** Returns a Set of YYYY-MM-DD day keys that have at least one event. */
export function dayKeysWithEvents(events) {
  const set = new Set();
  events.forEach((e) => {
    if (typeof e.startsAt === 'string') set.add(e.startsAt.slice(0, 10));
  });
  return set;
}

/**
 * Returns a Set of month indices (0–11) that have at least one event in the
 * given year. Used by the calendar's Year view to highlight active months.
 */
export function monthsWithEvents(events, year) {
  const set = new Set();
  events.forEach((e) => {
    const d = new Date(e.startsAt);
    if (d.getUTCFullYear() === year) set.add(d.getUTCMonth());
  });
  return set;
}
