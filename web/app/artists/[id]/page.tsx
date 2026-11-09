'use client';

import Link from 'next/link';
import { BadgeCheck, CalendarDays, ExternalLink, Instagram, Music2, UsersRound } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { track } from '@/lib/analytics';
import type { Artist, EventItem, Paginated } from '@/lib/types';
import { compactNumber } from '@/lib/format';
import { EventCard } from '@/components/event-card';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Avatar } from '@/components/media';
import { FollowButton } from '@/components/follow-button';

export default function ArtistPage() {
  const { id } = useParams<{ id: string }>();
  useEffect(() => { if (id) track({ kind: 'artist', targetId: id }); }, [id]);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [followers, setFollowers] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        // Reels are left out until they ship (client feedback 2026-11-08).
        const [profile, eventResult] = await Promise.all([
          api.get<Artist>(`/artists/${id}`, true),
          api.get<Paginated<EventItem>>(`/events?organizerId=${id}&status=all&take=50`, false),
        ]);
        setArtist(profile); setFollowers(profile.followerCount || profile._count?.followers || 0);
        setEvents(eventResult.items);
      } catch (err) { setError((err as Error).message); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const socials = useMemo(() => { try { return artist?.socialsJson ? JSON.parse(artist.socialsJson) as Record<string,string> : {}; } catch { return {}; } }, [artist]);

  if (loading) return <div className="page-shell"><LoadingState label="Opening profile" /></div>;
  if (!artist) return <div className="page-shell"><ErrorState message={error || 'Artist not found'} /></div>;
  const name = artist.user?.name || artist.name || artist.handle;
  const upcomingEvents = events.filter((event) => new Date(event.startsAt) >= new Date());

  return <>
    <section className="artist-profile-hero">
      <div className="artist-profile-backdrop"><img src="/images/stage-night-hero.webp" alt="" /></div>
      <div className="section-inner artist-profile-inner profile-header">
        <Avatar name={name} src={artist.user?.avatarUrl || artist.avatarUrl} size="hero" />
        <div className="artist-profile-copy"><p className="eyebrow">{artist.category || 'Artist'}</p><h1>{name} {artist.isVerified && <BadgeCheck className="verified" aria-label="Verified profile" />}</h1><p className="artist-profile-meta">@{artist.handle}<span>•</span><UsersRound size={16} /> {compactNumber(followers)} followers</p></div>
        <div className="profile-header-actions"><FollowButton companyId={artist.id} onCount={setFollowers} />{socials.instagram && <a className="icon-link" href={socials.instagram} target="_blank" rel="noreferrer" aria-label={`${name} on Instagram`}><Instagram size={18} /></a>}</div>
      </div>
    </section>

    <section className="artist-intro"><div className="section-inner artist-intro-grid"><div><p className="eyebrow">About</p><h2>Meet {name}.</h2><p>{artist.bio || `${name} is part of the community shaping Sri Lanka's live event scene. Follow this profile for new dates and updates.`}</p></div><div className="artist-profile-stats"><div><strong>{compactNumber(followers)}</strong><span>Followers</span></div><div><strong>{upcomingEvents.length}</strong><span>Upcoming</span></div><div><strong>{events.length}</strong><span>Events</span></div></div>{Object.keys(socials).length > 0 && <div className="social-link-row">{Object.entries(socials).map(([network, url]) => <a key={network} href={url} target="_blank" rel="noreferrer">{network}<ExternalLink size={13} /></a>)}</div>}</div></section>

    <section className="section"><div className="section-inner"><div className="section-head"><div><p className="eyebrow">On the calendar</p><h2>Upcoming with {name}</h2></div><Link className="text-link" href="/calendar"><CalendarDays size={16} /> Open calendar</Link></div>{upcomingEvents.length ? <div className="event-grid">{upcomingEvents.map((event) => <EventCard key={event.id} event={event} />)}</div> : <EmptyState title="No new dates announced" copy={`Follow ${name} and come back when the next event drops.`} />}</div></section>

  </>;
}
