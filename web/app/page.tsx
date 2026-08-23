'use client';

import Link from 'next/link';
import { ArrowRight, CalendarDays, CheckCircle2, MapPin, Play, ShieldCheck, Sparkles, TicketCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Artist, EventItem, Paginated } from '@/lib/types';
import { EventCard } from '@/components/event-card';
import { ArtistCard } from '@/components/artist-card';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';

export default function HomePage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const [eventResult, artistResult] = await Promise.all([
        api.get<Paginated<EventItem>>('/events?status=upcoming&take=6', false),
        api.get<Paginated<Artist>>('/artists?verifiedOnly=true&take=6', false),
      ]);
      setEvents(eventResult.items);
      setArtists(artistResult.items);
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  return (
    <>
      <section className="hero">
        <div className="hero-background"><img src="/images/stage-night-hero.webp" alt="An open-air music event under palm trees" /></div>
        <div className="hero-content">
          <span className="hero-kicker"><span className="pulse-dot" /> Sri Lanka&apos;s live event guide</span>
          <h1>YOUR NIGHT.<br /><span>YOUR STAGE.</span></h1>
          <div className="hero-copy">
            <div>
              <p>Find live music, festivals and unforgettable nights across the island. Follow the people you love and keep every plan in one place.</p>
              <div className="hero-pills" aria-label="Popular searches">
                <Link href="/events?category=Festival">Festivals</Link><Link href="/events?category=EDM">EDM</Link><Link href="/calendar">This weekend</Link>
              </div>
            </div>
            <div className="hero-actions">
              <Link className="button button-primary" href="/events">Find an event <ArrowRight size={17} /></Link>
              <Link className="button button-glass" href="/reels"><Play size={16} fill="currentColor" /> See the scene</Link>
            </div>
          </div>
          <div className="hero-trust">
            <span><ShieldCheck /> Verified organizers</span>
            <span><TicketCheck /> Simple ticket access</span>
            <span><CheckCircle2 /> Up-to-date event details</span>
          </div>
        </div>
      </section>

      <div className="marquee" aria-hidden="true"><div className="marquee-track">
        <span>Colombo</span><span>•</span><span>Live music</span><span>•</span><span>Festivals</span><span>•</span><span>Underground</span><span>•</span><span>Community</span><span>•</span>
        <span>Colombo</span><span>•</span><span>Live music</span><span>•</span><span>Festivals</span><span>•</span><span>Underground</span><span>•</span><span>Community</span><span>•</span>
      </div></div>

      <section className="section">
        <div className="section-inner">
          <div className="section-head"><div><p className="eyebrow">Happening next</p><h2>Make plans worth keeping.</h2><p>Hand-picked nights, clear details and direct ticket access.</p></div><Link className="text-link" href="/events">View all events <ArrowRight size={17} /></Link></div>
          {loading ? <LoadingState label="Finding the best nights" /> : error ? <ErrorState message={error} retry={load} /> : events.length ? <div className="event-grid">{events.slice(0, 5).map((event, index) => <EventCard key={event.id} event={event} featured={index === 0} />)}</div> : <EmptyState title="New events are on the way" copy="Check back soon or browse the calendar for future dates." />}
        </div>
      </section>

      <section className="section artist-showcase">
        <div className="section-inner">
          <div className="section-head"><div><p className="eyebrow">People behind the sound</p><h2>Follow the scene.</h2></div><p>Stay close to your favourite artists and organizers. Be first to know when their next date drops.</p></div>
          {loading ? <LoadingState label="Bringing artists on stage" /> : artists.length ? <div className="artist-grid">{artists.map((artist) => <ArtistCard key={artist.id} artist={artist} />)}</div> : <EmptyState title="Profiles are being tuned" copy="Verified artist and organizer profiles will appear here soon." />}
        </div>
      </section>

      <section className="section journey-section">
        <div className="section-inner">
          <div className="section-head"><div><p className="eyebrow">Everything in one place</p><h2>Your easiest way into the night.</h2></div></div>
          <div className="journey-grid">
            <Link href="/events" className="journey-card"><span>01</span><MapPin /><h3>Discover what fits</h3><p>Browse by date, mood or location and see the practical details up front.</p><strong>Explore nearby <ArrowRight size={16} /></strong></Link>
            <Link href="/calendar" className="journey-card"><span>02</span><CalendarDays /><h3>Plan without the noise</h3><p>Scan the month, compare your options and keep weekends easy to understand.</p><strong>Open calendar <ArrowRight size={16} /></strong></Link>
            <Link href="/studio" className="journey-card"><span>03</span><Sparkles /><h3>Bring your crowd</h3><p>Create a polished listing, add your lineup and publish with confidence.</p><strong>Open organizer studio <ArrowRight size={16} /></strong></Link>
          </div>
        </div>
      </section>
    </>
  );
}
