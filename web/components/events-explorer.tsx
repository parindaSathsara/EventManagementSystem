'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { EventItem, Paginated } from '@/lib/types';
import { EventCard } from './event-card';
import { EmptyState, ErrorState, LoadingState } from './states';

const categories = ['All', 'Festival', 'Party', 'Concert', 'Live Set', 'EDM'];

export function EventsExplorer({ focusSearch = false, initialCategory = 'All' }: { focusSearch?: boolean; initialCategory?: string }) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(categories.includes(initialCategory) ? initialCategory : 'All');
  const [status, setStatus] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { if (focusSearch) input.current?.focus(); }, [focusSearch]);
  useEffect(() => {
    const timeout = setTimeout(async () => {
      setLoading(true); setError('');
      const params = new URLSearchParams({ status, take: '100' });
      if (query.trim()) params.set('search', query.trim());
      if (category !== 'All') params.set('category', category);
      try {
        const result = await api.get<Paginated<EventItem>>(`/events?${params}`, false);
        setEvents(result.items); setTotal(result.total);
      } catch (err) { setError((err as Error).message); }
      finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, category, status]);

  return (
    <section className="explorer" aria-label="Explore events">
      <div className="search-panel">
        <div className="search-box"><Search size={19} /><input ref={input} className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search events, venues, cities or organizers" aria-label="Search events" />{query && <button type="button" className="search-clear" onClick={() => setQuery('')} aria-label="Clear search"><X size={16} /></button>}</div>
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Event timing"><option value="upcoming">Upcoming events</option><option value="live">Live now</option><option value="past">Past events</option><option value="all">All events</option></select>
      </div>
      <div className="filter-row"><span className="filter-label"><SlidersHorizontal size={13} /> Browse by</span>{categories.map((item) => <button type="button" key={item} className={category === item ? 'filter-chip active' : 'filter-chip'} onClick={() => setCategory(item)} aria-pressed={category === item}>{item}</button>)}</div>
      <div className="results-bar"><span>{loading ? 'Searching…' : <><strong>{total}</strong> event{total === 1 ? '' : 's'} found</>}</span><span>Colombo & beyond</span></div>
      {loading ? <LoadingState label="Finding events for you" /> : error ? <ErrorState message={error} /> : events.length ? <div className="event-grid">{events.map((event) => <EventCard key={event.id} event={event} />)}</div> : <EmptyState title="Nothing matches just yet" copy="Try clearing your search or choosing another category." />}
    </section>
  );
}
