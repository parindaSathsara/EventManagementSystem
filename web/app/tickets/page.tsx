'use client';

import Link from 'next/link';
import { CalendarDays, MapPin, QrCode, Ticket as TicketIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { api } from '@/lib/api';
import type { Paginated, Ticket } from '@/lib/types';
import { eventDate, eventTime } from '@/lib/format';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';

export default function TicketsPage() {
  const router = useRouter(); const { user, ready } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { if (ready && !user) router.replace('/auth?next=/tickets'); if (user) api.get<Paginated<Ticket>>('/tickets').then((result) => setTickets(result.items)).catch((err: Error) => setError(err.message)).finally(() => setLoading(false)); }, [ready, user, router]);
  if (!ready || loading) return <div className="page-shell"><LoadingState label="Finding your tickets" /></div>;
  return <div className="page-shell"><div className="page-heading"><p className="eyebrow">Your passes</p><h1>Tickets, ready when you are.</h1><p>Everything you have booked, in one place.</p></div>{error ? <ErrorState message={error} /> : tickets.length ? <div style={{ display: 'grid', gap: 18 }}>{tickets.map((ticket) => <article className="form-card" key={ticket.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 22, alignItems: 'center' }}><div><span className={`status-pill ${ticket.status}`}>{ticket.status}</span><h2 style={{ margin: '18px 0 10px' }}>{ticket.event.title}</h2><p className="muted"><CalendarDays size={15} style={{ display: 'inline' }} /> {eventDate(ticket.event.startsAt, true)} · {eventTime(ticket.event.startsAt)}</p><p className="muted"><MapPin size={15} style={{ display: 'inline' }} /> {ticket.event.venueName || 'Venue TBA'}, {ticket.event.cityName}</p><strong>{ticket.typeName} · {ticket.holderName}</strong><p className="eyebrow" style={{ marginTop: 18 }}>{ticket.qrPayload}</p><Link className="text-link" href={`/events/${ticket.event.id}`}>Open event</Link></div><div style={{ width: 130, aspectRatio: 1, background: '#fff', color: '#000', display: 'grid', placeItems: 'center', borderRadius: 14 }}><QrCode size={82} /><span style={{ position: 'absolute', opacity: 0 }}>{ticket.qrPayload}</span></div></article>)}</div> : <EmptyState title="No tickets yet" copy="When you book an event while signed in, your ticket will appear here." />}<div style={{ marginTop: 26 }}><Link className="button button-primary" href="/events"><TicketIcon size={17} /> Find an event</Link></div></div>;
}
