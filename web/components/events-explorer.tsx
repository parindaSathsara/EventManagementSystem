'use client';

import Link from 'next/link';
import { Search, SlidersHorizontal, UsersRound, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { EventItem, Paginated } from '@/lib/types';
import { EventCard } from './event-card';
import { useFollows } from './follow-button';
import { EmptyState, ErrorState, EventGridSkeleton } from './states';

/**
 * "Browse by" — exactly the client's list (2026-11-08): All, Festival, EDM,
 * Live Event, Concert, Hip Hop, Others. Each chip covers every
 * category value organizers actually use for it (the app and the old web
 * editor used different names, e.g. "Concert" vs "Live Concert").
 */
const BROWSE: Array<{ label: string; values: string[] | null }> = [
  { label: 'All', values: null },
  { label: 'Festival', values: ['festival'] },
  { label: 'EDM', values: ['edm'] },
  { label: 'Live Event', values: ['live event', 'event', 'live set'] },
  { label: 'Concert', values: ['concert', 'live concert'] },
  { label: 'Hip Hop', values: ['hip hop', 'hiphop', 'hip-hop'] },
];
const KNOWN = new Set(BROWSE.flatMap((group) => group.values || []));
// "Others" catches everything else (Party, Other, anything new).
const CHIPS = [...BROWSE.map((group) => group.label), 'Others'];

function inChip(event: EventItem, chip: string) {
  const value = (event.category || '').trim().toLowerCase();
  if (chip === 'All') return true;
  if (chip === 'Others') return !KNOWN.has(value);
  const group = BROWSE.find((item) => item.label === chip);
  return !!group?.values?.includes(value);
}

type View = 'all' | 'following';

export function EventsExplorer({ focusSearch = false, initialCategory = 'All' }: { focusSearch?: boolean; initialCategory?: string }) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState(CHIPS.find((item) => item.toLowerCase() === initialCategory?.toLowerCase()) || 'All');
  const [view, setView] = useState<View>('all');
  const [status, setStatus] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const followed = useFollows();

  useEffect(() => { if (focusSearch) input.current?.focus(); }, [focusSearch]);
  useEffect(() => {
    const timeout = setTimeout(async () => {
      setLoading(true); setError('');
      try {
        // Category grouping and the Following view are applied here, so fetch
        // the whole result set (the API pages at 100).
        const all: EventItem[] = [];
        for (let skip = 0; skip < 1000; skip += 100) {
          const params = new URLSearchParams({ status, take: '100', skip: String(skip) });
          if (query.trim()) params.set('search', query.trim());
          const page = await api.get<Paginated<EventItem>>(`/events?${params}`, false);
          all.push(...page.items);
          if (all.length >= page.total || !page.items.length) break;
        }
        setEvents(all);
      } catch (err) { setError((err as Error).message); }
      finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, status]);

  const visible = useMemo(() => events.filter((event) => {
    if (!inChip(event, chip)) return false;
    if (view === 'following') return !!event.organizer?.id && followed.includes(event.organizer.id);
    return true;
  }), [events, chip, view, followed]);

  return (
    <section className="explorer" aria-label="Explore events">
      <div className="search-panel">
        <div className="search-box"><Search size={19} /><input ref={input} className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search events, venues, cities or organizers" aria-label="Search events" />{query && <button type="button" className="search-clear" onClick={() => setQuery('')} aria-label="Clear search"><X size={16} /></button>}</div>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Event timing"><option value="upcoming">Upcoming events</option><option value="live">Live now</option><option value="past">Past events</option><option value="all">All events</option></select>
      </div>
      {/* Same two feeds as the app's Timeline: everything, or only the
          companies this visitor follows. */}
      <div className="view-tabs" role="tablist" aria-label="Which events">
        <button type="button" role="tab" aria-selected={view === 'all'} className={view === 'all' ? 'active' : ''} onClick={() => setView('all')}>For you</button>
        <button type="button" role="tab" aria-selected={view === 'following'} className={view === 'following' ? 'active' : ''} onClick={() => setView('following')}>Following{followed.length ? <span>{followed.length}</span> : null}</button>
      </div>
      <div className="filter-row"><span className="filter-label"><SlidersHorizontal size={13} /> Browse by</span>{CHIPS.map((item) => <button type="button" key={item} className={chip === item ? 'filter-chip active' : 'filter-chip'} onClick={() => setChip(item)} aria-pressed={chip === item}>{item}</button>)}</div>
      <div className="results-bar"><span>{loading ? 'Searching…' : <><strong>{visible.length}</strong> event{visible.length === 1 ? '' : 's'} found</>}</span><span>{view === 'following' ? 'From companies you follow' : 'Colombo & beyond'}</span></div>
      {loading ? <EventGridSkeleton />
        : error ? <ErrorState message={error} />
        : visible.length ? <div className="event-grid">{visible.map((event) => <EventCard key={event.id} event={event} />)}</div>
        : view === 'following' && !followed.length
          ? <div className="following-empty"><EmptyState title="You're not following anyone yet" copy="Follow event companies and artists to see all their events here, and get alerts when they announce something new." /><Link className="button button-primary" href="/artists"><UsersRound size={16} /> Find companies to follow</Link></div>
          : <EmptyState title="Nothing matches just yet" copy={view === 'following' ? 'The companies you follow have nothing here yet. Try another category or check back soon.' : 'Try clearing your search or choosing another category.'} />}
    </section>
  );
}
