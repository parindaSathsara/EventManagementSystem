'use client';

import Link from 'next/link';
import {
  ArrowUpRight,
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import type { EventItem, Paginated } from '@/lib/types';
import { eventDate, eventTime, getImage } from '@/lib/format';
import { ErrorState, LoadingState } from '@/components/states';
import { MediaImage } from '@/components/media';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type CalendarDay = {
  date: Date;
  key: string;
  inMonth: boolean;
  isToday: boolean;
};

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildCalendar(cursor: Date): CalendarDay[] {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - first.getDay());
  const today = dayKey(new Date());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const key = dayKey(date);
    return { date, key, inMonth: date.getMonth() === month, isToday: key === today };
  });
}

export default function CalendarPage() {
  const [cursor, setCursor] = useState(() => {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const [selectedKey, setSelectedKey] = useState(() => dayKey(new Date()));
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const result = await api.get<Paginated<EventItem>>('/events?status=all&take=100', false);
      setEvents(result.items);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const days = useMemo(() => buildCalendar(cursor), [cursor]);
  const eventMap = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const event of events) {
      const key = dayKey(new Date(event.startsAt));
      map.set(key, [...(map.get(key) || []), event]);
    }
    return map;
  }, [events]);

  const monthEvents = useMemo(
    () => events.filter((event) => {
      const date = new Date(event.startsAt);
      return date.getFullYear() === cursor.getFullYear() && date.getMonth() === cursor.getMonth();
    }),
    [cursor, events],
  );
  const selectedEvents = eventMap.get(selectedKey) || [];
  const selectedDate = days.find((day) => day.key === selectedKey)?.date || new Date(`${selectedKey}T12:00:00`);
  const upcoming = useMemo(
    () => events.filter((event) => new Date(event.startsAt) >= new Date()).slice(0, 5),
    [events],
  );
  const monthLabel = new Intl.DateTimeFormat('en-LK', { month: 'long' }).format(cursor);
  const yearLabel = cursor.getFullYear();

  function move(offset: number) {
    const next = new Date(cursor.getFullYear(), cursor.getMonth() + offset, 1);
    setCursor(next);
    setSelectedKey(dayKey(next));
  }

  function goToday() {
    const today = new Date();
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedKey(dayKey(today));
  }

  function selectDay(day: CalendarDay) {
    setSelectedKey(day.key);
    if (!day.inMonth) setCursor(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
  }

  return (
    <div className="page-shell calendar-page">
      <div className="page-heading calendar-heading">
        <div>
          <p className="eyebrow"><Sparkles size={13} /> Live schedule</p>
          <h1>Your month.<br /><span className="outline-text">Fully charged.</span></h1>
        </div>
        <p>One clear view of every date worth leaving the house for. Pick a day to see its complete agenda.</p>
      </div>

      {loading ? <LoadingState label="Synchronizing the calendar" /> : error ? <ErrorState message={error} retry={load} /> : (
        <div className="calendar-layout">
          <section className="calendar-console" aria-label="Event calendar">
            <div className="calendar-toolbar">
              <div className="calendar-title-group">
                <span className="calendar-signal"><CalendarCheck2 size={17} /> Event matrix</span>
                <div className="calendar-month"><strong>{monthLabel}</strong><span>{yearLabel}</span></div>
              </div>
              <div className="calendar-controls">
                <button className="button button-ghost calendar-today" onClick={goToday}>Today</button>
                <div className="calendar-stepper">
                  <button type="button" onClick={() => move(-1)} aria-label="Previous month"><ChevronLeft /></button>
                  <button type="button" onClick={() => move(1)} aria-label="Next month"><ChevronRight /></button>
                </div>
              </div>
            </div>

            <div className="calendar-summary">
              <span><i className="legend-dot live" /> {monthEvents.length} scheduled this month</span>
              <span><i className="legend-dot selected" /> Selected day</span>
              <span className="calendar-zone">GMT +05:30 · Colombo</span>
            </div>

            <div className="calendar-grid">
              {dayNames.map((name) => <div key={name} className="calendar-day-name"><span>{name.slice(0, 3)}</span><b>{name[0]}</b></div>)}
              {days.map((day) => {
                const dayEvents = eventMap.get(day.key) || [];
                const selected = selectedKey === day.key;
                return (
                  <div key={day.key} className={`calendar-cell${day.inMonth ? '' : ' outside'}${day.isToday ? ' today' : ''}${selected ? ' selected' : ''}`}>
                    <button type="button" className="calendar-date" onClick={() => selectDay(day)} aria-label={`Select ${eventDate(day.date.toISOString(), true)}`} aria-pressed={selected}>
                      <span>{day.date.getDate()}</span>
                      {day.isToday && <small>NOW</small>}
                    </button>
                    <div className="calendar-cell-events">
                      {dayEvents.slice(0, 2).map((event) => (
                        <Link className="calendar-event" href={`/events/${event.id}`} key={event.id} title={event.title}>
                          <span className="calendar-event-time">{event.startTimeTba ? 'TBA' : eventTime(event.startsAt)}</span>
                          <span className="calendar-event-title">{event.title}</span>
                        </Link>
                      ))}
                      {dayEvents.length > 2 && <button className="calendar-more" onClick={() => selectDay(day)}>+{dayEvents.length - 2} more</button>}
                    </div>
                    {dayEvents.length > 0 && <div className="calendar-mobile-dots" aria-hidden>{dayEvents.slice(0, 4).map((event) => <i key={event.id} />)}</div>}
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="calendar-agenda">
            <div className="agenda-head">
              <p className="eyebrow">Selected transmission</p>
              <h2>{new Intl.DateTimeFormat('en-LK', { weekday: 'long', day: 'numeric', month: 'long' }).format(selectedDate)}</h2>
              <span>{selectedEvents.length ? `${selectedEvents.length} event${selectedEvents.length === 1 ? '' : 's'} scheduled` : 'Open channel'}</span>
            </div>
            <div className="agenda-events">
              {selectedEvents.length ? selectedEvents.map((event) => <AgendaEvent key={event.id} event={event} />) : (
                <div className="agenda-empty"><span>00</span><p>No event signal detected for this day.</p><Link href="/events">Scan all events <ArrowUpRight size={15} /></Link></div>
              )}
            </div>

            <div className="upcoming-rail">
              <div className="upcoming-rail-head"><span>Next on Stage</span><Link href="/events">View all</Link></div>
              {upcoming.map((event) => (
                <Link className="upcoming-mini" href={`/events/${event.id}`} key={event.id}>
                  <span className="upcoming-mini-date"><b>{new Date(event.startsAt).getDate()}</b><small>{new Intl.DateTimeFormat('en-LK', { month: 'short' }).format(new Date(event.startsAt)).toUpperCase()}</small></span>
                  <span><strong>{event.title}</strong><small>{event.cityName} · {event.startTimeTba ? 'TBA' : eventTime(event.startsAt)}</small></span>
                  <ArrowUpRight size={15} />
                </Link>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function AgendaEvent({ event }: { event: EventItem }) {
  const image = getImage(event);
  return (
    <Link className="agenda-event" href={`/events/${event.id}`}>
      <div className="agenda-event-image" style={{ backgroundColor: event.coverColor || '#211' }}><MediaImage src={image} alt={`${event.title} artwork`} /></div>
      <div className="agenda-event-copy">
        <p>{event.category}</p>
        <h3>{event.title}</h3>
        <span><Clock3 size={13} /> {event.startTimeTba ? 'Time TBA' : eventTime(event.startsAt)}</span>
        <span><MapPin size={13} /> {event.venueName || 'Venue TBA'}</span>
      </div>
      <ArrowUpRight className="agenda-arrow" size={18} />
    </Link>
  );
}
