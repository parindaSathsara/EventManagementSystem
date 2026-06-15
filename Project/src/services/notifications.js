/**
 * On-device local notification scheduler (Expo).
 *
 * Schedules T-2 / T-1 reminders for the events a guest follows. Everything is
 * loaded defensively: `expo-notifications` is a native module that may be
 * unavailable (e.g. Expo Go on recent SDKs). When it's missing, every export
 * becomes a safe no-op so the app keeps working and the in-app feed still shows.
 */

let Notifications = null;
try {
  // eslint-disable-next-line global-require
  Notifications = require('expo-notifications');
} catch {
  Notifications = null;
}

const DAY_MS = 24 * 3600 * 1000;
let permissionAsked = false;

function available() {
  return !!(Notifications && Notifications.scheduleNotificationAsync);
}

export async function ensurePermission() {
  if (!available() || permissionAsked) return available();
  permissionAsked = true;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return !!req.granted;
  } catch {
    return false;
  }
}

/** A reminder fires at 10:00 local on the day(s) before the event. */
function reminderDate(startsAt, daysBefore) {
  const start = new Date(startsAt);
  const d = new Date(start.getTime() - daysBefore * DAY_MS);
  d.setHours(10, 0, 0, 0);
  return d;
}

/**
 * Reschedule local reminders for the given followed events. Clears any
 * previously scheduled reminders first so we never stack duplicates.
 *
 * @param {Array<{id,title,startsAt,venueName}>} events
 */
export async function syncReminders(events = []) {
  if (!available()) return;
  const ok = await ensurePermission();
  if (!ok) return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    /* ignore — proceed to (re)schedule */
  }

  const now = Date.now();
  for (const e of events) {
    if (!e?.startsAt) continue;
    for (const daysBefore of [2, 1]) {
      const when = reminderDate(e.startsAt, daysBefore);
      if (when.getTime() <= now) continue;
      try {
        // eslint-disable-next-line no-await-in-loop
        await Notifications.scheduleNotificationAsync({
          content: {
            title: daysBefore === 1 ? 'Tomorrow 🎉' : 'In 2 days',
            body: `${e.title}${e.venueName ? ` · ${e.venueName}` : ''}`,
            data: { eventId: e.id },
          },
          trigger: when,
        });
      } catch {
        /* skip this one; keep scheduling the rest */
      }
    }
  }
}
