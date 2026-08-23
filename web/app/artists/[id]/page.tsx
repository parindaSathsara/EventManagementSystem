'use client';

import Link from 'next/link';
import { BadgeCheck, CalendarDays, ExternalLink, Instagram, Music2, Play, UsersRound } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import type { Artist, EventItem, Paginated, Reel } from '@/lib/types';
import { compactNumber } from '@/lib/format';
import { useAuth } from '@/components/auth-provider';
import { EventCard } from '@/components/event-card';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Avatar, MediaImage } from '@/components/media';

export default function ArtistPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [profile, eventResult, reelResult] = await Promise.all([
          api.get<Artist>(`/artists/${id}`, true),
          api.get<Paginated<EventItem>>(`/events?organizerId=${id}&status=all&take=50`, false),
          api.get<Paginated<Reel>>(`/reels?artistId=${id}&take=20`, false),
        ]);
        setArtist(profile); setFollowing(!!profile.isFollowing); setFollowers(profile.followerCount || profile._count?.followers || 0);
        setEvents(eventResult.items); setReels(reelResult.items);
      } catch (err) { setError((err as Error).message); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const socials = useMemo(() => { try { return artist?.socialsJson ? JSON.parse(artist.socialsJson) as Record<string,string> : {}; } catch { return {}; } }, [artist]);
  async function follow() {
    if (!artist || followBusy) return;
    setFollowBusy(true); setError('');
    try {
      if (user) {
        const result = await api.post<{ following: boolean }>(`/artists/${id}/follow`);
        setFollowing(result.following); setFollowers((n) => Math.max(0, n + (result.following ? 1 : -1)));
      } else {
        let deviceId = window.localStorage.getItem('stage.web.deviceId');
        if (!deviceId) { deviceId = crypto.randomUUID(); window.localStorage.setItem('stage.web.deviceId', deviceId); }
        const result = await api.post<{ following: boolean; followerCount: number }>(`/artists/${id}/guest-follow`, { deviceId, follow: !following }, false);
        setFollowing(result.following); setFollowers(result.followerCount);
      }
    } catch (err) { setError((err as Error).message); }
    finally { setFollowBusy(false); }
  }

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
        <div className="profile-header-actions"><button className={following ? 'button button-secondary' : 'button button-primary'} onClick={follow} disabled={followBusy}>{followBusy ? 'Updating…' : following ? 'Following' : 'Follow profile'}</button>{socials.instagram && <a className="icon-link" href={socials.instagram} target="_blank" rel="noreferrer" aria-label={`${name} on Instagram`}><Instagram size={18} /></a>}</div>
      </div>
    </section>

    <section className="artist-intro"><div className="section-inner artist-intro-grid"><div><p className="eyebrow">About</p><h2>Meet {name}.</h2><p>{artist.bio || `${name} is part of the community shaping Sri Lanka's live event scene. Follow this profile for new dates and updates.`}</p></div><div className="artist-profile-stats"><div><strong>{compactNumber(followers)}</strong><span>Followers</span></div><div><strong>{upcomingEvents.length}</strong><span>Upcoming</span></div><div><strong>{reels.length}</strong><span>Reels</span></div></div>{Object.keys(socials).length > 0 && <div className="social-link-row">{Object.entries(socials).map(([network, url]) => <a key={network} href={url} target="_blank" rel="noreferrer">{network}<ExternalLink size={13} /></a>)}</div>}</div></section>

    <section className="section"><div className="section-inner"><div className="section-head"><div><p className="eyebrow">On the calendar</p><h2>Upcoming with {name}</h2></div><Link className="text-link" href="/calendar"><CalendarDays size={16} /> Open calendar</Link></div>{upcomingEvents.length ? <div className="event-grid">{upcomingEvents.map((event) => <EventCard key={event.id} event={event} />)}</div> : <EmptyState title="No new dates announced" copy={`Follow ${name} and come back when the next event drops.`} />}</div></section>

    <section className="section artist-reels-section"><div className="section-inner"><div className="section-head"><div><p className="eyebrow">From the crowd</p><h2>Recent moments.</h2></div><Link className="text-link" href="/reels">Watch all reels <Play size={15} /></Link></div>{reels.length ? <div className="artist-reel-grid">{reels.slice(0, 4).map((reel) => <Link href="/reels" className="artist-reel-card" key={reel.id}><div><MediaImage src={reel.coverImageUrl} alt={reel.caption} />{reel.videoUrl && <span className="reel-play"><Play fill="currentColor" /></span>}</div><span><strong>{reel.caption}</strong><small>{reel.musicTrack?.title || reel.musicTrackTitle || 'Stage reel'}</small></span></Link>)}</div> : <div className="state-card"><Music2 /><h3>No reels just yet</h3><p>Backstage clips and crowd moments will appear here.</p></div>}</div></section>
  </>;
}
