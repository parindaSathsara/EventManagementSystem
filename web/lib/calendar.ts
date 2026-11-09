import type { EventItem } from './types';

/**
 * "Add to calendar" for an event page — a Google Calendar link and a
 * standards .ics file (Apple Calendar, Outlook, everything else). Day-only
 * events (start time TBA) become all-day entries rather than a fake hour.
 */

function utcStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function dayStamp(date: Date) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
}

function span(event: EventItem): { start: string; end: string; allDay: boolean } {
  const start = new Date(event.startsAt);
  if (event.startTimeTba) {
    const next = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
    return { start: dayStamp(start), end: dayStamp(next), allDay: true };
  }
  const end = event.endsAt ? new Date(event.endsAt) : new Date(start.getTime() + 4 * 3600 * 1000);
  return { start: utcStamp(start), end: utcStamp(end), allDay: false };
}

function where(event: EventItem) {
  return [event.venueName, event.addressLine, event.cityName].filter(Boolean).join(', ');
}

export function googleCalendarUrl(event: EventItem, pageUrl: string) {
  const { start, end } = span(event);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details: `${event.description ? `${event.description}\n\n` : ''}${pageUrl}`,
    location: where(event),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

export function downloadIcs(event: EventItem, pageUrl: string) {
  const { start, end, allDay } = span(event);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Stage//Events//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.id}@stage.lk`,
    `DTSTAMP:${utcStamp(new Date())}`,
    allDay ? `DTSTART;VALUE=DATE:${start}` : `DTSTART:${start}`,
    allDay ? `DTEND;VALUE=DATE:${end}` : `DTEND:${end}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(`${event.description ? `${event.description}\n\n` : ''}${pageUrl}`)}`,
    `LOCATION:${escapeIcs(where(event))}`,
    `URL:${pageUrl}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${event.title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'stage-event'}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

/** Google Maps search for the venue (events carry no coordinates). */
export function directionsUrl(event: EventItem) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(where(event))}`;
}

/** "Today"/"Tonight", "Tomorrow", "In 16 days", "Happening now", "Ended". */
export function countdownLabel(event: EventItem, now = new Date()) {
  const start = new Date(event.startsAt);
  const end = event.endsAt ? new Date(event.endsAt) : new Date(start.getTime() + 4 * 3600 * 1000);
  if (end < now) return { label: 'Ended', tone: 'muted' as const };
  if (start <= now) return { label: 'Happening now', tone: 'live' as const };
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((day(start) - day(now)) / 86400000);
  // Not every event is a night event — only say "Tonight" when it starts in the evening.
  if (days === 0) return { label: !event.startTimeTba && start.getHours() >= 17 ? 'Tonight' : 'Today', tone: 'hot' as const };
  if (days === 1) return { label: 'Tomorrow', tone: 'hot' as const };
  if (days <= 7) return { label: `In ${days} days`, tone: 'hot' as const };
  return { label: `In ${days} days`, tone: 'calm' as const };
}
