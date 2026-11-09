'use client';

import Link from 'next/link';
import { ArrowRight, BadgeCheck, Bell, Bookmark, CalendarDays, CalendarPlus, Check, Clock3, Download, ExternalLink, MapPin, Navigation, Share2, ShieldCheck, Sparkles, Ticket as TicketIcon } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { EventItem, Paginated, TicketType } from '@/lib/types';
import { eventDate, eventTime, getImage } from '@/lib/format';
import { countdownLabel, directionsUrl, downloadIcs, googleCalendarUrl } from '@/lib/calendar';
import { ErrorState, LoadingState } from '@/components/states';
import { useAuth } from '@/components/auth-provider';
import { Avatar } from '@/components/media';
import { EventCard } from '@/components/event-card';
import { FollowButton } from '@/components/follow-button';
import { SocialLinks } from '@/components/social-links';

/**
 * A ticket the organizer actually priced. Events created before 2026-11-08
 * could carry an auto-filled "General admission · Coming soon" row the
 * organizer never chose — that is "no tickets yet", not a ticket.
 */
function isRealTicket(ticket: TicketType) {
  const label = (ticket.priceLabel || '').trim().toLowerCase();
  return ticket.priceCents > 0 || label === 'free';
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [more, setMore] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [flyerFailed, setFlyerFailed] = useState(false);
  const [readMore, setReadMore] = useState(false);

  async function load() {
    setLoading(true); setError('');
    try {
      const result = await api.get<EventItem>(`/events/${id}`, true);
      setEvent(result);
      // "More from this company" — their other upcoming dates.
      const organizerId = result.organizer?.id;
      if (organizerId) {
        api.get<Paginated<EventItem>>(`/events?organizerId=${organizerId}&status=upcoming&take=8`, false)
          .then((page) => setMore(page.items.filter((item) => item.id !== result.id).slice(0, 3)))
          .catch(() => setMore([]));
      }
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [id]);
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(''), 3200); return () => clearTimeout(t); }, [notice]);

  async function toggleSave() {
    if (!user) { router.push(`/auth?next=/events/${id}`); return; }
    if (!event || saving) return;
    setSaving(true);
    try {
      const result = await api.post<{ saved: boolean }>(`/events/${id}/save`);
      setEvent({ ...event, isSaved: result.saved });
    } catch (err) { setNotice((err as Error).message); }
    finally { setSaving(false); }
  }

  async function share() {
    const data = { title: event?.title || 'Stage event', text: event?.description || 'See this event on Stage', url: window.location.href };
    if (navigator.share) await navigator.share(data).catch(() => undefined);
    else { await navigator.clipboard.writeText(window.location.href); setNotice('Event link copied — send it to your crew.'); }
  }

  if (loading) return <div className="page-shell"><LoadingState label="Opening event" /></div>;
  if (error || !event) return <div className="page-shell"><ErrorState message={error || 'Event not found'} retry={load} /></div>;
  const image = flyerFailed ? null : getImage(event);
  const organizerName = event.organizer?.user?.name || event.organizer?.handle || 'Stage organizer';
  const tickets = (event.ticketTypes || []).filter(isRealTicket);
  const countdown = countdownLabel(event);
  const ended = countdown.label === 'Ended';
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const description = event.description?.trim() || '';
  const longDescription = description.length > 420;

  return (
    <>
      {/* Hero: the WHOLE flyer, never centre-cropped, over a blurred copy of
          itself that fills the band (client feedback 2026-11-08). */}
      <section className={`detail-hero${image ? ' has-flyer' : ''}`}>
        <div className="detail-hero-bg" style={{ background: event.coverColor || '#211' }}>
          {image && <img src={image} alt="" aria-hidden />}
        </div>
        <div className={`detail-hero-content${image ? ' has-flyer' : ''}`}>
          {image && (
            <div className="detail-flyer">
              <img src={image} alt={`${event.title} flyer`} onError={() => setFlyerFailed(true)} />
            </div>
          )}
          <div className="detail-hero-copy">
            <div className="detail-kicker">
              <span className={`countdown-chip tone-${countdown.tone}`}><i />{countdown.label}</span>
              <span className="detail-category">{event.category}</span>
            </div>
            <h1>{event.title}</h1>
            <p className="detail-presenter">Presented by <Link href={event.organizer ? `/artists/${event.organizer.id}` : '/artists'}>{organizerName}</Link>{event.organizer?.isVerified && <BadgeCheck size={15} className="verified" />}</p>
            <div className="detail-facts">
              <span><CalendarDays size={17} /> {eventDate(event.startsAt, true)}</span>
              <span><Clock3 size={17} /> {event.startTimeTba ? 'Time revealed soon' : `${eventTime(event.startsAt)} – ${eventTime(event.endsAt)}`}</span>
              <span><MapPin size={17} /> {event.venueName || 'Venue revealed soon'}, {event.cityName}</span>
            </div>
            <div className="detail-actions">
              {ended
                ? <span className="button button-ghost is-static"><TicketIcon size={17} /> Event ended</span>
                : event.ticketUrl
                  ? <a className="button button-primary" href={event.ticketUrl} target="_blank" rel="noreferrer"><TicketIcon size={17} /> Buy tickets <ExternalLink size={14} /></a>
                  : <a className="button button-ghost" href="#tickets"><TicketIcon size={17} /> Tickets coming soon</a>}
              {!ended && (
                <details className="calendar-menu">
                  <summary className="button button-ghost"><CalendarPlus size={17} /> Add to calendar</summary>
                  <div className="calendar-menu-panel">
                    <a href={googleCalendarUrl(event, pageUrl)} target="_blank" rel="noreferrer"><CalendarDays size={15} /> Google Calendar <ExternalLink size={12} /></a>
                    <button type="button" onClick={() => downloadIcs(event, pageUrl)}><Download size={15} /> Apple / Outlook (.ics)</button>
                  </div>
                </details>
              )}
              <button className="button button-ghost icon-only" onClick={toggleSave} disabled={saving} aria-label={event.isSaved ? 'Saved' : 'Save event'} title={event.isSaved ? 'Saved' : 'Save event'}><Bookmark size={17} fill={event.isSaved ? 'currentColor' : 'none'} /></button>
              <button className="button button-ghost icon-only" onClick={share} aria-label="Share" title="Share"><Share2 size={17} /></button>
            </div>
          </div>
        </div>
      </section>

      {notice && <div className="toast" role="status"><Check size={15} /> {notice}</div>}

      <div className="page-shell detail-grid">
        <div className="detail-copy">
          {/* The essentials at a glance. */}
          <div className="fact-grid">
            <div className="fact-tile"><CalendarDays /><span>When</span><strong>{eventDate(event.startsAt, true)}</strong></div>
            <div className="fact-tile"><Clock3 /><span>Time</span><strong>{event.startTimeTba ? 'Revealed soon' : `${eventTime(event.startsAt)} – ${eventTime(event.endsAt)}`}</strong></div>
            <div className="fact-tile"><MapPin /><span>Where</span><strong>{event.venueName || 'Revealed soon'}</strong><small>{event.cityName}</small></div>
            <div className="fact-tile"><ShieldCheck /><span>Entry</span><strong>{event.ageRestriction || 'All ages'}</strong></div>
          </div>

          <section className="detail-section">
            <p className="eyebrow">About the event</p>
            {description ? (
              <>
                <p className={`detail-description${longDescription && !readMore ? ' is-clamped' : ''}`}>{description}</p>
                {longDescription && <button type="button" className="text-link read-more" onClick={() => setReadMore((v) => !v)}>{readMore ? 'Show less' : 'Read more'}</button>}
              </>
            ) : (
              <div className="teaser-card"><Sparkles /><div><strong>The full story drops soon</strong><span>{organizerName} is still writing this one. Follow them to see the update in your alerts.</span></div></div>
            )}
          </section>

          <section className="detail-section">
            <p className="eyebrow">Line up</p>
            {event.lineup?.length ? (
              <div className="lineup-grid">
                {event.lineup.map((artist, index) => {
                  // The app's "surprise slot" — an act the organizer hasn't revealed yet.
                  const surprise = artist.name.trim().toLowerCase() === 'revealed soon';
                  return (
                    <div className={`lineup-tile${surprise ? ' is-surprise' : ''}`} key={artist.id || index}>
                      <span className="lineup-tile-order">{String(index + 1).padStart(2, '0')}</span>
                      {surprise ? <span className="avatar avatar-large surprise-avatar" aria-hidden>?</span> : <Avatar name={artist.name} src={artist.avatarUrl} size="large" />}
                      <strong>{surprise ? 'Surprise act' : artist.name}</strong>
                      {surprise
                        ? <small className="surprise-note">Revealed soon</small>
                        : <SocialLinks socials={artist.socials} name={artist.name} />}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="teaser-card"><Sparkles /><div><strong>Line up revealed soon</strong><span>Artists are announced closer to the date — stay tuned.</span></div></div>
            )}
          </section>

          {event.organizer && (
            <section className="detail-section">
              <p className="eyebrow">Presented by</p>
              <div className="organizer-card">
                <Avatar name={organizerName} src={event.organizer.user?.avatarUrl || event.organizer.avatarUrl} size="large" />
                <div className="organizer-card-copy">
                  <strong>{organizerName} {event.organizer.isVerified && <BadgeCheck size={16} className="verified" />}</strong>
                  <span>@{event.organizer.handle}{event.organizer.category ? ` · ${event.organizer.category}` : ''}</span>
                  {event.organizer.bio && <p>{event.organizer.bio}</p>}
                </div>
                <div className="organizer-card-actions">
                  <FollowButton companyId={event.organizer.id} />
                  <Link href={`/artists/${event.organizer.id}`} className="button button-ghost">View profile</Link>
                </div>
              </div>
            </section>
          )}

          <section className="detail-section">
            <p className="eyebrow">Location</p>
            <div className="location-card">
              <span className="location-map" aria-hidden><i /><MapPin /></span>
              <div>
                <strong>{event.venueName || 'Venue revealed soon'}</strong>
                <span>{event.addressLine ? `${event.addressLine}, ` : ''}{event.cityName}</span>
              </div>
              {event.venueName
                ? <a className="button button-ghost" href={directionsUrl(event)} target="_blank" rel="noreferrer"><Navigation size={16} /> Get directions</a>
                : <span className="location-soon">Secret location — stay tuned</span>}
            </div>
          </section>
        </div>

        {/* Tickets: bought on the organizer's ticketing partner. No link yet →
            "coming soon", never a placeholder ticket. */}
        <aside className="booking-card" id="tickets">
          <p className="eyebrow">Tickets</p>
          {ended ? (
            <><h2>This event has ended</h2><p className="muted">Follow {organizerName} to hear about their next one.</p>{event.organizer && <FollowButton companyId={event.organizer.id} className="button-block" />}</>
          ) : event.ticketUrl ? (
            <>
              <h2>Get your tickets</h2>
              {tickets.length > 0 && <div className="ticket-price-list">{tickets.map((ticket) => <div key={ticket.id}><span>{ticket.name}</span><strong>{ticket.priceLabel}</strong></div>)}</div>}
              <p className="muted">Checkout happens on the organizer&apos;s ticketing partner.</p>
              <a className="button button-primary button-block" href={event.ticketUrl} target="_blank" rel="noreferrer">Buy tickets <ExternalLink size={16} /></a>
            </>
          ) : (
            <>
              <h2>Tickets coming soon</h2>
              {tickets.length > 0 && <div className="ticket-price-list">{tickets.map((ticket) => <div key={ticket.id}><span>{ticket.name}</span><strong>{ticket.priceLabel}</strong></div>)}</div>}
              <p className="muted">Stay tuned. Follow {organizerName} to see their updates in your alerts.</p>
              {event.organizer && <FollowButton companyId={event.organizer.id} className="button-block" />}
              <Link className="text-link tickets-alerts-link" href="/alerts"><Bell size={14} /> See your alerts</Link>
            </>
          )}
          <div className="booking-card-foot">
            <span className={`countdown-chip tone-${countdown.tone}`}><i />{countdown.label}</span>
            <span>{eventDate(event.startsAt)}</span>
          </div>
        </aside>
      </div>

      {more.length > 0 && (
        <section className="section more-from">
          <div className="section-inner">
            <div className="section-head"><div><p className="eyebrow">More from {organizerName}</p><h2>Keep the weekend going.</h2></div>{event.organizer && <Link className="text-link" href={`/artists/${event.organizer.id}`}>All their events <ArrowRight size={15} /></Link>}</div>
            <div className="event-grid">{more.map((item) => <EventCard key={item.id} event={item} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}
