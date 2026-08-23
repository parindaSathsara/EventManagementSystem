'use client';

import Link from 'next/link';
import { BellRing, CalendarDays } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { eventDate, eventTime } from '@/lib/format';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';

type AlertItem = { id: string; eventId: string; title: string; message: string; startsAt: string; startTimeTba?: boolean; saved?: boolean };
export default function AlertsPage() {
  const [items, setItems] = useState<AlertItem[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { api.get<{ items: AlertItem[] }>('/notifications', true).then((result) => setItems(result.items)).catch((err: Error) => setError(err.message)).finally(() => setLoading(false)); }, []);
  return <div className="narrow-shell"><div className="page-heading"><p className="eyebrow">Coming up</p><h1>Alerts.</h1><p>A timely nudge for the nights getting close.</p></div>{loading ? <LoadingState /> : error ? <ErrorState message={error} /> : items.length ? <div className="data-list">{items.map((item) => <Link href={`/events/${item.eventId}`} className="data-row" key={item.id} style={{ gridTemplateColumns: '52px 1fr auto' }}><span className="avatar avatar-medium"><BellRing size={20} /></span><div><h3>{item.message}</h3><p><CalendarDays size={12} style={{ display: 'inline' }} /> {eventDate(item.startsAt)} · {item.startTimeTba ? 'TBA' : eventTime(item.startsAt)}</p></div>{item.saved && <span className="status-pill active">Saved</span>}</Link>)}</div> : <EmptyState title="All quiet for now" copy="Upcoming reminders will appear here a few days before an event." />}</div>;
}
