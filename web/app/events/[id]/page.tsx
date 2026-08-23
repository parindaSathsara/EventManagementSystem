'use client';

import Link from 'next/link';
import { BadgeCheck, Bookmark, CalendarDays, Check, Clock3, ExternalLink, MapPin, Share2, Ticket as TicketIcon } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { EventItem, Ticket, TicketType } from '@/lib/types';
import { eventDate, eventTime, getImage } from '@/lib/format';
import { ErrorState, LoadingState } from '@/components/states';
import { useAuth } from '@/components/auth-provider';
import { Avatar, MediaImage } from '@/components/media';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [selected, setSelected] = useState<TicketType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [booking, setBooking] = useState(false);
  const [notice, setNotice] = useState('');
  const [bookError, setBookError] = useState('');
  const [contact, setContact] = useState({ holderName: '', phone: '', email: '' });

  async function load() {
    setLoading(true); setError('');
    try {
      const result = await api.get<EventItem>(`/events/${id}`, true);
      setEvent(result);
      setSelected(result.ticketTypes?.[0] || null);
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [id]);
  useEffect(() => { if (user) setContact({ holderName: user.name || '', phone: user.phone || '', email: user.email || '' }); }, [user]);

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
    else { await navigator.clipboard.writeText(window.location.href); setNotice('Event link copied.'); }
  }

  async function reserve(e: FormEvent) {
    e.preventDefault();
    if (!selected || !event) return;
    setBooking(true); setBookError(''); setNotice('');
    try {
      const ticket = await api.post<Ticket>('/tickets/reserve', { eventId: event.id, ticketTypeId: selected.id, ...contact });
      setNotice(user ? `Booked. Ticket ${ticket.qrPayload} is now in your account.` : `Reserved. Your reference is ${ticket.qrPayload}. Keep this number safe.`);
    } catch (err) { setBookError((err as Error).message); }
    finally { setBooking(false); }
  }

  if (loading) return <div className="page-shell"><LoadingState label="Opening event" /></div>;
  if (error || !event) return <div className="page-shell"><ErrorState message={error || 'Event not found'} retry={load} /></div>;
  const image = getImage(event);
  const organizerName = event.organizer?.user?.name || event.organizer?.handle || 'Stage organizer';

  return (
    <>
      <section className="detail-hero">
        <div className="detail-hero-bg" style={{ background: event.coverColor || '#211' }}><MediaImage src={image} alt={`${event.title} event artwork`} /></div>
        <div className="detail-hero-content">
          <p className="eyebrow">{event.category} · {event.status}</p>
          <h1>{event.title}</h1>
          <div className="detail-facts">
            <span><CalendarDays size={17} /> {eventDate(event.startsAt, true)}</span>
            <span><Clock3 size={17} /> {event.startTimeTba ? 'Time revealed soon' : `${eventTime(event.startsAt)} – ${eventTime(event.endsAt)}`}</span>
            <span><MapPin size={17} /> {event.venueName || 'Venue revealed soon'}, {event.cityName}</span>
          </div>
          <div className="detail-actions">
            {event.ticketUrl ? <a className="button button-primary" href={event.ticketUrl} target="_blank" rel="noreferrer"><TicketIcon size={17} /> Buy tickets <ExternalLink size={14} /></a> : <a className="button button-primary" href="#tickets"><TicketIcon size={17} /> Reserve a ticket</a>}
            <button className="button button-ghost" onClick={toggleSave}><Bookmark size={17} fill={event.isSaved ? 'currentColor' : 'none'} /> {event.isSaved ? 'Saved' : 'Save event'}</button>
            <button className="button button-ghost" onClick={share}><Share2 size={17} /> Share</button>
          </div>
        </div>
      </section>

      <div className="page-shell detail-grid">
        <div className="detail-copy">
          <p className="eyebrow">About the night</p>
          <h2 style={{ marginTop: 0 }}>Everything you need to know.</h2>
          <p>{event.description || 'More details will be announced by the organizer soon.'}</p>

          <h2>Line up</h2>
          {event.lineup?.length ? <div className="lineup-list">{event.lineup.map((artist) => <div className="lineup-person" key={artist.id}><Avatar name={artist.name} src={artist.avatarUrl} size="medium" /><strong>{artist.name}</strong></div>)}</div> : <p className="muted">Line up revealed soon.</p>}

          <h2>Presented by</h2>
          {event.organizer && <div className="organizer-strip"><Avatar name={organizerName} src={event.organizer.user?.avatarUrl || event.organizer.avatarUrl} size="medium" /><div><strong>{organizerName} {event.organizer.isVerified && <BadgeCheck size={15} className="verified" />}</strong><span>@{event.organizer.handle}</span></div><Link href={`/artists/${event.organizer.id}`} className="button button-ghost">View profile</Link></div>}

          <h2>Location</h2>
          <div className="form-card"><MapPin color="#ff3b3b" /><h3 style={{ margin: '18px 0 4px' }}>{event.venueName || 'Venue revealed soon'}</h3><p className="muted" style={{ margin: 0 }}>{event.addressLine ? `${event.addressLine}, ` : ''}{event.cityName}</p></div>
        </div>

        <aside className="booking-card" id="tickets">
          <p className="eyebrow">Tickets</p><h2>{event.ticketUrl ? 'Continue to ticketing' : 'Choose your pass'}</h2>
          {event.ticketUrl ? <><p className="muted">This organizer handles checkout on their ticketing partner.</p><a className="button button-primary button-block" href={event.ticketUrl} target="_blank" rel="noreferrer">Buy tickets <ExternalLink size={16} /></a></> : event.ticketTypes?.length ? <>
            {event.ticketTypes.map((ticket) => <button type="button" key={ticket.id} className={selected?.id === ticket.id ? 'ticket-choice active' : 'ticket-choice'} onClick={() => setSelected(ticket)}><span><strong>{ticket.name}</strong><small>{ticket.remaining > 0 ? `${ticket.remaining} available` : 'Sold out'}</small></span><strong>{ticket.priceLabel}</strong></button>)}
            <form className="booking-form" onSubmit={reserve}>
              <input className="input" required placeholder="Ticket holder name" value={contact.holderName} onChange={(e) => setContact({ ...contact, holderName: e.target.value })} />
              <input className="input" required placeholder="Phone number" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
              <input className="input" type="email" placeholder="Email (optional)" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
              {bookError && <div className="notice error-notice">{bookError}</div>}
              {notice && <div className="notice"><Check size={15} /> {notice}</div>}
              <button className="button button-primary button-block" disabled={booking || selected?.remaining === 0}>{booking ? 'Reserving…' : `Reserve ${selected?.name || 'ticket'}`}</button>
            </form>
          </> : <p className="muted">Ticket information is coming soon.</p>}
          {!user && !event.ticketUrl && <p className="muted" style={{ fontSize: 11, margin: '15px 0 0' }}>You can reserve as a guest. <Link href={`/auth?next=/events/${event.id}`} style={{ color: '#fff' }}>Sign in</Link> to keep tickets in your account.</p>}
        </aside>
      </div>
    </>
  );
}
