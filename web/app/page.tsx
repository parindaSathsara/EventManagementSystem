'use client';

import Link from 'next/link';
import { ArrowRight, Bell, CalendarDays, Flame, MapPin, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Artist, EventItem, Paginated } from '@/lib/types';
import { EventCard } from '@/components/event-card';
import { ArtistCard } from '@/components/artist-card';
import { EmptyState, ErrorState, EventGridSkeleton, LoadingState } from '@/components/states';
import { FlyerImage } from '@/components/media';
import { eventDate, eventTime, getImage } from '@/lib/format';
import { BrandLogo } from '@/components/brand-logo';

export default function HomePage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const [eventResult, artistResult] = await Promise.all([
        api.get<Paginated<EventItem>>('/events?status=upcoming&take=9', false),
        api.get<Paginated<Artist>>('/artists?verifiedOnly=true&take=6', false),
      ]);
      setEvents(eventResult.items);
      setArtists(artistResult.items);
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);
  const cities = new Set(events.map((event) => event.cityName).filter(Boolean)).size;

  return (
    <>
      <section className="stage-hero">
        <span className="stage-hero-glow stage-hero-glow-one" />
        <span className="stage-hero-glow stage-hero-glow-two" />
        <div className="stage-hero-inner">
          <div className="stage-hero-copy">
            <h2 className="stage-hero-wordmark" aria-label="Stage"><BrandLogo variant="mark" /></h2>
            <p className="stage-hero-kicker"><Flame size={14} fill="currentColor" /> Every event has a place here</p>
            <h1>ONE ISLAND.<br /><span>EVERY SCENE.</span></h1>
            <p className="stage-hero-lead">Stage brings festivals, live music, underground nights, artists and organizers into one constantly moving feed.</p>
            <div className="stage-hero-actions">
              <Link className="button button-primary" href="/events">Explore all events <ArrowRight size={17} /></Link>
              <Link className="button button-ghost" href="/calendar"><CalendarDays size={16} /> Open calendar</Link>
            </div>
            <div className="hero-pills" aria-label="Popular event categories">
              <Link href="/events?category=Festival">Festival</Link><Link href="/events?category=EDM">EDM</Link><Link href="/events?category=Live%20Event">Live Event</Link><Link href="/events?category=Concert">Concert</Link><Link href="/events?category=Hip%20Hop">Hip Hop</Link>
            </div>
          </div>

          <div className="stage-feed" aria-label="Upcoming events on Stage">
            <div className="stage-feed-head"><div><span className="active">For you</span><span>Across Sri Lanka</span></div><small><i /> Live event feed</small></div>
            <div className="stage-feed-events">
              {events.slice(0, 3).map((event) => <HeroEvent event={event} key={event.id} />)}
              {loading && [0, 1, 2].map((index) => <div className="hero-event-card hero-event-loading" key={index}><span /><b /></div>)}
              {!loading && !events.length && <Link className="hero-event-empty" href="/events"><Sparkles /><strong>New events land here</strong><span>Explore the full calendar</span></Link>}
            </div>
            <div className="stage-feed-foot"><span>Fresh dates from verified organizers</span><Link href="/events">See the full feed <ArrowRight size={14} /></Link></div>
          </div>
        </div>
        <div className="stage-hero-stats">
          <span><strong>{loading ? '—' : events.length}</strong><small>in today&apos;s feed</small></span>
          <span><strong>{loading ? '—' : artists.length}</strong><small>featured profiles</small></span>
          <span><strong>{loading ? '—' : cities}</strong><small>cities in this feed</small></span>
          <span className="stage-promise"><i /> Find it. Follow it. Be there.</span>
        </div>
      </section>

      <div className="marquee" aria-hidden="true"><div className="marquee-track">
        <span>STAGE</span><span>•</span><span>Colombo</span><span>•</span><span>Live music</span><span>•</span><span>Festivals</span><span>•</span><span>Underground</span><span>•</span><span>Community</span><span>•</span>
        <span>STAGE</span><span>•</span><span>Colombo</span><span>•</span><span>Live music</span><span>•</span><span>Festivals</span><span>•</span><span>Underground</span><span>•</span><span>Community</span><span>•</span>
      </div></div>

      <section className="section">
        <div className="section-inner">
          <div className="section-head"><div><p className="eyebrow">Happening next</p><h2>This week on Stage.</h2><p>Every event gets the same clear space to be discovered—no single headliner taking over the platform.</p></div><Link className="text-link" href="/events">View all events <ArrowRight size={17} /></Link></div>
          {loading ? <EventGridSkeleton /> : error ? <ErrorState message={error} retry={load} /> : events.length ? <div className="event-grid home-event-grid">{events.slice(0, 6).map((event) => <EventCard key={event.id} event={event} />)}</div> : <EmptyState title="New events are on the way" copy="Check back soon or browse the calendar for future dates." />}
        </div>
      </section>

      <section className="section artist-showcase">
        <div className="section-inner">
          <div className="section-head"><div><p className="eyebrow">People behind the sound</p><h2>Follow the whole scene.</h2></div><p>Stay close to artists and organizers across genres. Be first to know when any of their next dates drop.</p></div>
          {loading ? <LoadingState label="Bringing profiles on Stage" /> : artists.length ? <div className="artist-grid">{artists.map((artist) => <ArtistCard key={artist.id} artist={artist} />)}</div> : <EmptyState title="Profiles are being tuned" copy="Verified artist and organizer profiles will appear here soon." />}
        </div>
      </section>

      <section className="section journey-section">
        <div className="section-inner">
          <div className="section-head"><div><p className="eyebrow">The Stage experience</p><h2>One rhythm, everywhere.</h2><p>The same simple flow as the mobile app—from discovery to calendar to the event itself.</p></div></div>
          <div className="journey-grid">
            <Link href="/events" className="journey-card"><span>01</span><MapPin /><h3>Discover every scene</h3><p>Browse by date, genre or location with the details you need up front.</p><strong>Explore events <ArrowRight size={16} /></strong></Link>
            <Link href="/calendar" className="journey-card"><span>02</span><CalendarDays /><h3>Plan without the noise</h3><p>Scan the month, compare options and keep every weekend easy to understand.</p><strong>Open calendar <ArrowRight size={16} /></strong></Link>
            <Link href="/alerts" className="journey-card"><span>03</span><Bell /><h3>Follow and never miss it</h3><p>Follow the companies you love and get alerts when they announce something new.</p><strong>Open alerts <ArrowRight size={16} /></strong></Link>
          </div>
        </div>
      </section>
    </>
  );
}

function HeroEvent({ event }: { event: EventItem }) {
  return (
    <Link className="hero-event-card flyer-frame" href={`/events/${event.id}`}>
      <FlyerImage src={getImage(event)} alt={`${event.title} event artwork`} seed={event.id} compact />
      <span className="hero-event-shade" />
      <span className="hero-event-category">{event.category}</span>
      <span className="hero-event-copy"><small>{eventDate(event.startsAt)} · {event.startTimeTba ? 'Time TBA' : eventTime(event.startsAt)}</small><strong>{event.title}</strong><em><MapPin size={12} /> {event.cityName}</em></span>
    </Link>
  );
}
