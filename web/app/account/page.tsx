'use client';

import Link from 'next/link';
import { Bookmark, CalendarDays, LogOut, Settings, Ticket, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { api } from '@/lib/api';
import type { EventItem, Paginated } from '@/lib/types';
import { initials, mediaUrl } from '@/lib/format';
import { EventCard } from '@/components/event-card';
import { LoadingState } from '@/components/states';

export default function AccountPage() {
  const router = useRouter();
  const { user, ready, logout, refreshUser } = useAuth();
  const [saved, setSaved] = useState<EventItem[]>([]);
  const [form, setForm] = useState({ name: '', phone: '', city: '' });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (ready && !user) router.replace('/auth?next=/account'); }, [ready, user, router]);
  useEffect(() => { if (user) { setForm({ name: user.name || '', phone: user.phone || '', city: user.city || '' }); api.get<Paginated<EventItem>>('/events?status=all&take=100').then((result) => setSaved(result.items.filter((event) => event.isSaved))).catch(() => undefined); } }, [user]);
  async function update(event: FormEvent) { event.preventDefault(); setBusy(true); setMessage(''); try { await api.patch('/auth/complete-profile', form); await refreshUser(); setMessage('Profile updated.'); } catch (err) { setMessage((err as Error).message); } finally { setBusy(false); } }
  if (!ready || !user) return <div className="page-shell"><LoadingState label="Opening your account" /></div>;
  return <div className="page-shell"><div className="profile-header"><span className="avatar avatar-hero">{user.avatarUrl ? <img src={mediaUrl(user.avatarUrl) || user.avatarUrl} alt="" /> : initials(user.name)}</span><div><p className="eyebrow">{user.role}</p><h1>{user.name}</h1><p>{user.email}</p></div><div className="profile-header-actions"><Link className="button button-primary" href="/tickets"><Ticket size={17} /> My tickets</Link></div></div><div className="account-grid"><nav className="side-nav"><a className="active" href="#profile"><UserRound size={17} /> Profile</a><a href="#saved"><Bookmark size={17} /> Saved</a><Link href="/calendar"><CalendarDays size={17} /> Calendar</Link><button onClick={() => { logout(); router.push('/'); }}><LogOut size={17} /> Sign out</button></nav><div><section id="profile" className="form-card"><Settings /><h2 style={{ marginTop: 20 }}>Account details</h2><p>Keep your ticket contact information current.</p><form className="form-grid" onSubmit={update}><div className="field field-full"><label>Name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div><div className="field"><label>Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div><div className="field"><label>City</label><input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>{message && <div className="notice field-full">{message}</div>}<div className="form-actions field-full"><button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : 'Save details'}</button></div></form></section><section id="saved" style={{ marginTop: 45 }}><div className="section-head"><div><p className="eyebrow">Your shortlist</p><h2>Saved events</h2></div></div>{saved.length ? <div className="event-grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))' }}>{saved.map((event) => <EventCard event={event} key={event.id} />)}</div> : <div className="state-card"><Bookmark /><p>Save an event and it will appear here.</p></div>}</section></div></div></div>;
}
