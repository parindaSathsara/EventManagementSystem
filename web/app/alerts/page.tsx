'use client';

import Link from 'next/link';
import { BellRing, CalendarDays, Sparkles, UsersRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { getDeviceId } from '@/lib/follows';
import { eventDate, eventTime, getImage } from '@/lib/format';
import type { EventItem, Paginated } from '@/lib/types';
import { useFollows } from '@/components/follow-button';
import { FlyerImage } from '@/components/media';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';

type Reminder = {
  id: string; eventId: string; title: string; message: string; startsAt: string;
  startTimeTba?: boolean; saved?: boolean; following?: boolean;
  companyId?: string | null; companyName?: string | null; bannerImageUrl?: string | null; coverColor?: string | null;
};

// A followed company's new event stays "new" for two weeks — same as the app.
const FRESH_MS = 14 * 24 * 60 * 60 * 1000;
type Filter = 'all' | 'upcoming' | 'new';

/**
 * Alerts — the app's model, for everyone (client feedback 2026-11-08: "show
 * alerts like the app, from the companies people follow", not only for
 * signed-in organizers).
 *
 *   Coming up  — reminders for events 1–5 days out; companies this browser
 *                follows are ranked first (the backend reads the device id).
 *   New        — events recently published by companies this browser follows.
 */
export default function AlertsPage() {
  const followed = useFollows();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  async function load() {
    setLoading(true); setError('');
    try {
      const deviceId = getDeviceId();
      const [feed, upcoming] = await Promise.all([
        api.get<{ items: Reminder[] }>(`/notifications?deviceId=${encodeURIComponent(deviceId)}`, true),
        api.get<Paginated<EventItem>>('/events?status=upcoming&take=100', false),
      ]);
      setReminders(feed.items); setEvents(upcoming.items);
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  // The backend ranks followed companies first using the device id; mirror
  // that locally so a follow made a second ago is reflected straight away.
  const comingUp = useMemo(() => [...reminders].sort((a, b) => {
    const fa = !!a.companyId && followed.includes(a.companyId);
    const fb = !!b.companyId && followed.includes(b.companyId);
    if (fa !== fb) return fa ? -1 : 1;
    return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
  }), [reminders, followed]);

  const fresh = useMemo(() => {
    const now = Date.now();
    return events
      .filter((event) => !!event.organizer?.id && followed.includes(event.organizer.id))
      .filter((event) => {
        const at = new Date(event.updatedAt || event.createdAt || 0).getTime();
        return now - at <= FRESH_MS;
      });
  }, [events, followed]);

  const showUpcoming = filter !== 'new';
  const showNew = filter !== 'upcoming';

  return (
    <div className="narrow-shell alerts-page">
      <div className="page-heading"><p className="eyebrow">Stay in the loop</p><h1>Alerts.</h1><p>Reminders for nights that are getting close, and new events from the companies you follow.</p></div>
      {loading ? <LoadingState label="Checking your alerts" /> : error ? <ErrorState message={error} retry={load} /> : (
        <>
          <div className="filter-row alerts-filters">
            <button type="button" className={filter === 'all' ? 'filter-chip active' : 'filter-chip'} onClick={() => setFilter('all')}>All · {comingUp.length + fresh.length}</button>
            <button type="button" className={filter === 'upcoming' ? 'filter-chip active' : 'filter-chip'} onClick={() => setFilter('upcoming')}>Coming up · {comingUp.length}</button>
            <button type="button" className={filter === 'new' ? 'filter-chip active' : 'filter-chip'} onClick={() => setFilter('new')}>New from following · {fresh.length}</button>
          </div>

          {!followed.length && (
            <div className="alerts-follow-prompt">
              <UsersRound />
              <div><strong>Follow event companies to get their news here</strong><span>New events and reminders from the companies you follow show up first.</span></div>
              <Link className="button button-ghost" href="/artists">Find companies</Link>
            </div>
          )}

          {showNew && fresh.length > 0 && (
            <section className="alerts-section">
              <h2><Sparkles size={16} /> New from companies you follow</h2>
              <div className="data-list">{fresh.map((event) => (
                <Link href={`/events/${event.id}`} className="data-row alert-row" key={event.id}>
                  <span className="alert-thumb flyer-frame"><FlyerImage src={getImage(event)} seed={event.id} compact /></span>
                  <div><h3>{event.organizer?.user?.name || event.organizer?.handle} announced {event.title}</h3><p><CalendarDays size={12} /> {eventDate(event.startsAt)} · {event.startTimeTba ? 'Time TBA' : eventTime(event.startsAt)}</p></div>
                  <span className="status-pill active">New</span>
                </Link>
              ))}</div>
            </section>
          )}

          {showUpcoming && comingUp.length > 0 && (
            <section className="alerts-section">
              <h2><BellRing size={16} /> Coming up</h2>
              <div className="data-list">{comingUp.map((item) => {
                const isFollowed = !!item.companyId && followed.includes(item.companyId);
                return (
                  <Link href={`/events/${item.eventId}`} className="data-row alert-row" key={item.id}>
                    <span className="alert-thumb flyer-frame"><FlyerImage src={item.bannerImageUrl} seed={item.eventId} compact /></span>
                    <div><h3>{item.message}</h3><p><CalendarDays size={12} /> {eventDate(item.startsAt)} · {item.startTimeTba ? 'Time TBA' : eventTime(item.startsAt)}</p></div>
                    {isFollowed ? <span className="status-pill active">Following</span> : item.saved ? <span className="status-pill active">Saved</span> : <span />}
                  </Link>
                );
              })}</div>
            </section>
          )}

          {((showUpcoming ? comingUp.length : 0) + (showNew ? fresh.length : 0)) === 0 && (
            <EmptyState
              title="All quiet for now"
              copy={filter === 'new' ? 'When a company you follow announces a new event, it shows up here.' : 'Reminders appear here a few days before an event.'}
            />
          )}
        </>
      )}
    </div>
  );
}
