import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  eventsRepo,
  notificationsRepo,
  followRepo,
  alertsSeenRepo,
  subscribe,
  CHANNELS,
} from '../../services';

const FRESH_WINDOW_MS = 14 * 24 * 3600 * 1000; // publish alerts stay "new" 14 days

/**
 * Unseen-alerts state for the guest tab badge.
 *
 * "Unseen" =
 *   - an upcoming event published by a company the guest follows, created
 *     after the guest last opened the Alerts tab (the follow→publish alert), or
 *   - any reminder feed item for an event starting after last-seen.
 *
 * Returns `{ count, newFromFollowed, markSeen }`. `newFromFollowed` is the
 * list of freshly published followed-company events (newest first) so the
 * Alerts screen can render them as "New event" cards.
 */
export default function useUnseenAlerts() {
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  useEffect(() => {
    const subs = [
      subscribe(CHANNELS.EVENTS, rerender),
      subscribe(CHANNELS.NOTIFICATIONS, rerender),
      subscribe(CHANNELS.FOLLOWS, rerender),
      subscribe(CHANNELS.ALERTS_SEEN, rerender),
    ];
    return () => subs.forEach((un) => un());
  }, []);

  const seenAt = alertsSeenRepo.getSeenAt();
  const events = eventsRepo.getAll();
  const reminders = notificationsRepo.getAll();

  const newFromFollowed = useMemo(() => {
    const now = Date.now();
    return events
      .filter((e) => {
        if (!e?.organizer?.id || !followRepo.isFollowing(e.organizer.id)) return false;
        if (e.status && e.status !== 'published' && e.status !== 'live') return false;
        const created = new Date(e.createdAt || 0).getTime();
        // Only recently published events, and only upcoming ones.
        if (now - created > FRESH_WINDOW_MS) return false;
        return new Date(e.startsAt).getTime() > now;
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [events]); // followRepo/seenAt changes re-render via subscriptions

  const count = useMemo(() => {
    const unseenPublishes = newFromFollowed.filter(
      (e) => new Date(e.createdAt || 0).getTime() > seenAt,
    ).length;
    // Reminders are computed daily (T-1..T-5), so treat them as unseen when
    // the guest hasn't opened Alerts since the start of today.
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const unseenReminders = seenAt < startOfToday.getTime() ? reminders.length : 0;
    return unseenPublishes + unseenReminders;
  }, [newFromFollowed, reminders, seenAt]);

  const markSeen = useCallback(() => alertsSeenRepo.markSeen(), []);

  return { count, newFromFollowed, markSeen };
}
