'use client';

import Link from 'next/link';
import { BadgeCheck, BarChart3, Bookmark, CalendarDays, Check, Edit3, Eye, Hourglass, Plus, Settings, Sparkles, Trash2, UserRound, UsersRound } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { StudioGuard } from '@/components/studio-guard';
import { useAuth } from '@/components/auth-provider';
import { api } from '@/lib/api';
import type { Artist, EventItem, Paginated } from '@/lib/types';
import { eventDate, getImage } from '@/lib/format';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { FlyerImage } from '@/components/media';

export default function StudioPage() { return <StudioGuard><StudioDashboard /></StudioGuard>; }

function StudioDashboard() {
  const { user, artist, refreshArtist } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [profile, setProfile] = useState({ handle: '', bio: '', category: 'Event Company' }); const [creating, setCreating] = useState(false);
  async function load() { const mine = artist || await refreshArtist(); if (mine) { try { const result = await api.get<Paginated<EventItem>>(`/events?organizerId=${mine.id}&status=all&take=100`); setEvents(result.items); } catch (err) { setError((err as Error).message); } } setLoading(false); }
  useEffect(() => { load(); }, [artist]);
  async function become(e: FormEvent) { e.preventDefault(); setCreating(true); setError(''); try { await api.post<Artist>('/artists/become', { ...profile, handle: profile.handle.toLowerCase() }); await refreshArtist(); } catch (err) { setError((err as Error).message); } finally { setCreating(false); } }
  async function remove(event: EventItem) { if (!window.confirm(`Delete “${event.title}”? This cannot be undone.`)) return; try { await api.delete(`/events/${event.id}`); setEvents((current) => current.filter((item) => item.id !== event.id)); } catch (err) { setError((err as Error).message); } }
  // Overview tiles (client feedback 2026-11-08): Upcoming events · Follow
  // count · Event saves · Day count. Day count is the organizer's countdown:
  // calendar days until their next published event, and which one it is.
  const stats = useMemo(() => {
    const now = new Date();
    const upcoming = events
      .filter((event) => new Date(event.startsAt).getTime() > now.getTime() && event.status !== 'draft' && event.status !== 'cancelled')
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    const next = upcoming[0] || null;
    // Calendar days (midnight to midnight), so "tomorrow" is always 1.
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    return {
      upcoming: upcoming.length,
      followers: artist?.followerCount ?? artist?._count?.followers ?? 0,
      saves: events.reduce((sum, event) => sum + (event._count?.savedBy || 0), 0),
      next,
      daysToNext: next ? Math.round((startOfDay(new Date(next.startsAt)) - startOfDay(now)) / 86400000) : null,
    };
  }, [events, artist]);
  if (!artist && loading) return <div className="page-shell"><LoadingState label="Opening organizer studio" /></div>;

  if (!artist) return <div className="onboarding-shell"><div className="onboarding-story"><p className="eyebrow">Organizer onboarding</p><h1>Turn your next idea into an event people remember.</h1><p>Create a public organizer profile, then publish polished event pages from one simple studio.</p><div className="onboarding-benefits"><span><Check /> A searchable public profile</span><span><Check /> Event and ticket management</span><span><Check /> Follower and audience insights</span></div></div><form className="form-card onboarding-form" onSubmit={become}><span className="onboarding-step">Takes about 2 minutes</span><h2>Create your organizer profile</h2><p>This is what customers will see when they discover your events.</p><div className="form-grid"><div className="field field-full"><label htmlFor="public-handle">Public handle <em>Required</em></label><div className="handle-input"><span>stage.lk/</span><input id="public-handle" className="input" required minLength={2} pattern="[a-zA-Z0-9_.]+" value={profile.handle} onChange={(e) => setProfile({ ...profile, handle: e.target.value.replace(/\s/g, '') })} placeholder="yourcompany" /></div><span className="field-hint">Letters, numbers, dots and underscores only.</span></div><div className="field field-full"><label htmlFor="organizer-category">What best describes you?</label><select id="organizer-category" className="select" value={profile.category} onChange={(e) => setProfile({ ...profile, category: e.target.value })}><option>Event Company</option><option>Artist</option><option>DJ</option><option>Band</option><option>Venue</option><option>Promoter</option></select></div><div className="field field-full"><label htmlFor="organizer-bio">Short introduction</label><textarea id="organizer-bio" className="textarea" maxLength={2000} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="Tell customers what you create, your sound and what they can expect…" /><span className="field-hint">You can add a photo and social links next.</span></div>{error && <div className="notice error-notice field-full">{error}</div>}<div className="form-actions field-full"><button className="button button-primary button-block" disabled={creating}><Sparkles size={16} /> {creating ? 'Creating your profile…' : 'Create profile & continue'}</button></div></div></form></div>;

  const name = artist.user?.name || user?.name || artist.handle;
  return <div className="page-shell studio-page"><div className="dashboard-head studio-dashboard-head"><div><p className="eyebrow">Organizer studio</p><h1>Good to see you, {name}. {artist.isVerified && <BadgeCheck className="verified" />}</h1><p className="muted">Here&apos;s how your events are performing and what needs your attention.</p></div><Link className="button button-primary" href="/studio/events/new"><Plus size={17} /> Create event</Link></div><div className="account-grid studio-grid"><nav className="side-nav"><span className="side-nav-label">Workspace</span><Link className="active" href="/studio"><BarChart3 size={17} /> Overview</Link><Link href="/studio/events/new"><CalendarDays size={17} /> New event</Link><Link href="/studio/profile"><Settings size={17} /> Public profile</Link><Link href={`/artists/${artist.id}`}><UserRound size={17} /> View as user</Link></nav><div><div className="metric-grid"><div className="metric"><CalendarDays /><span>Upcoming events</span><strong>{stats.upcoming}</strong><small>Currently published</small></div><div className="metric"><UsersRound /><span>Follow count</span><strong>{stats.followers}</strong><small>People following you</small></div><div className="metric"><Bookmark /><span>Event saves</span><strong>{stats.saves}</strong><small>Customer interest</small></div><div className="metric metric-countdown"><Hourglass /><span>Day count</span>{stats.next ? <><strong>{stats.daysToNext === 0 ? 'Today' : stats.daysToNext}</strong><small>{stats.daysToNext === 0 ? <>It&apos;s showtime — <Link href={`/events/${stats.next.id}`}>{stats.next.title}</Link></> : <>{stats.daysToNext === 1 ? 'day' : 'days'} until <Link href={`/events/${stats.next.id}`}>{stats.next.title}</Link></>}</small></> : <><strong>—</strong><small><Link href="/studio/events/new">Plan your next event</Link></small></>}</div></div><div className="dashboard-head list-heading"><div><h2>Your events</h2><p className="muted">Keep artwork, dates and ticket details fresh.</p></div><span className="count-badge">{events.length} total</span></div>{error ? <ErrorState message={error} /> : loading ? <LoadingState /> : events.length ? <div className="data-list">{events.map((event) => <div className="data-row" key={event.id}><span className="data-row-image flyer-frame"><FlyerImage src={getImage(event)} alt={`${event.title} artwork`} seed={event.id} compact /></span><div><h3>{event.title}</h3><p>{eventDate(event.startsAt, true)} · {event.cityName}</p></div><span className={`status-pill ${event.status}`}>{event.status}</span><div className="row-actions"><Link className="icon-link" href={`/events/${event.id}`} title="View event"><Eye size={15} /></Link><Link className="icon-link" href={`/studio/events/${event.id}/edit`} title="Edit event"><Edit3 size={15} /></Link><button className="icon-link danger-icon" onClick={() => remove(event)} title="Delete event"><Trash2 size={15} /></button></div></div>)}</div> : <div className="studio-empty"><EmptyState title="Your first event starts here" copy="Create a complete listing with artwork, lineup and tickets in a few guided steps." /><Link className="button button-primary" href="/studio/events/new"><Plus size={16} /> Create your first event</Link></div>}</div></div></div>;
}
