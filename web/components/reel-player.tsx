'use client';

import Link from 'next/link';
import {
  BadgeCheck,
  Flame,
  Maximize2,
  Music2,
  Pause,
  Play,
  Share2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { compactNumber, initials, mediaUrl } from '@/lib/format';
import type { Reel } from '@/lib/types';

function clock(value: number) {
  if (!Number.isFinite(value)) return '0:00';
  const minutes = Math.floor(value / 60);
  return `${minutes}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
}

export function ReelPlayer({ reel }: { reel: Reel }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [resolution, setResolution] = useState('HD');
  const [shareNotice, setShareNotice] = useState('');
  const source = mediaUrl(reel.videoUrl);
  const poster = mediaUrl(reel.coverImageUrl);
  const artistName = reel.artist?.name || reel.artist?.user?.name || reel.artist?.handle || 'Stage artist';
  const reactionCount = useMemo(
    () => Object.values(reel.stats?.reactions || {}).reduce((sum, value) => sum + value, 0),
    [reel.stats?.reactions],
  );

  useEffect(() => {
    setPlaying(false);
    setReady(false);
    setMediaError('');
    setCurrentTime(0);
    setDuration(0);
  }, [reel.id]);

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video || mediaError) return;
    if (video.paused) {
      try { await video.play(); } catch { setMediaError('Playback was blocked. Press play once more to continue.'); }
    } else video.pause();
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  function seek(value: number) {
    if (!videoRef.current) return;
    videoRef.current.currentTime = value;
    setCurrentTime(value);
  }

  async function fullscreen() {
    if (playerRef.current?.requestFullscreen) await playerRef.current.requestFullscreen();
  }

  async function share() {
    const data = { title: `${artistName} on Stage`, text: reel.caption, url: window.location.href };
    if (navigator.share) await navigator.share(data).catch(() => undefined);
    else {
      await navigator.clipboard.writeText(window.location.href);
      setShareNotice('Link copied');
      window.setTimeout(() => setShareNotice(''), 1800);
    }
  }

  return (
    <article className="reel-player-shell">
      <div className="reel-player" ref={playerRef} style={{ backgroundColor: reel.coverColor || '#160b19' }}>
        {source ? (
          <video
            ref={videoRef}
            key={source}
            className="reel-video"
            playsInline
            muted={muted}
            loop
            preload="metadata"
            poster={poster || undefined}
            aria-label={`${artistName}: ${reel.caption}`}
            onLoadedMetadata={(event) => {
              const video = event.currentTarget;
              setDuration(video.duration);
              setResolution(video.videoHeight >= 1080 ? 'FHD' : video.videoHeight >= 720 ? 'HD' : 'SD');
            }}
            onCanPlay={(event) => {
              setReady(true);
              event.currentTarget.play().catch(() => setPlaying(false));
            }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
            onError={() => setMediaError('This clip could not be decoded by your browser.')}
          >
            <source src={source} type="video/mp4" />
            Your browser does not support HTML video.
          </video>
        ) : poster ? (
          <img className="reel-video reel-still" src={poster} alt={reel.caption} />
        ) : (
          <div className="reel-visualizer" aria-label="No video is attached to this reel">
            <span className="reel-orbit" />
            <span className="avatar avatar-hero">{reel.artist?.avatarUrl ? <img src={mediaUrl(reel.artist.avatarUrl) || reel.artist.avatarUrl} alt="" /> : initials(artistName)}</span>
            <div className="reel-bars" aria-hidden>{[18, 42, 29, 64, 37, 76, 46, 58, 26, 48, 20].map((height, index) => <i key={index} style={{ height }} />)}</div>
            <p>Audio transmission</p>
          </div>
        )}

        <div className="reel-player-shade" />
        <div className="reel-player-status"><span><i /> {source ? (ready ? 'Streaming' : 'Buffering') : 'Visual pending'}</span><b>{resolution}</b></div>

        {source && !mediaError && (
          <button className={`reel-center-play${playing ? ' is-playing' : ''}`} type="button" onClick={togglePlayback} aria-label={playing ? 'Pause reel' : 'Play reel'}>
            {playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
          </button>
        )}

        {mediaError && <div className="reel-media-error"><span>Signal interrupted</span><p>{mediaError}</p><button onClick={() => { setMediaError(''); videoRef.current?.load(); }}>Reload clip</button></div>}

        <div className="reel-overlay-copy">
          <Link href={`/artists/${reel.artist?.id}`} className="reel-artist-line">
            <span className="avatar avatar-medium">{reel.artist?.avatarUrl ? <img src={mediaUrl(reel.artist.avatarUrl) || reel.artist.avatarUrl} alt="" /> : initials(artistName)}</span>
            <span><strong>{artistName} {reel.artist?.isVerified && <BadgeCheck className="verified" size={15} />}</strong><small>@{reel.artist?.handle}</small></span>
          </Link>
          <p>{reel.caption}</p>
          {reel.musicTrack && <span className="reel-track"><Music2 size={13} /> {reel.musicTrack.title} · {reel.musicTrack.artistName}</span>}
          <div className="reel-tag-row">{reel.tags?.map((tag) => <span key={typeof tag === 'string' ? tag : tag.tag}>#{typeof tag === 'string' ? tag : tag.tag}</span>)}</div>
        </div>

        <div className="reel-action-rail">
          <span><Flame size={20} /><small>{compactNumber(reactionCount)}</small></span>
          <button onClick={share} aria-label="Share reel"><Share2 size={19} /><small>{shareNotice || 'Share'}</small></button>
        </div>

        {source && !mediaError && (
          <div className="reel-controls" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={togglePlayback} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</button>
            <span className="reel-clock">{clock(currentTime)}</span>
            <input
              aria-label="Reel progress"
              type="range"
              min="0"
              max={duration || 0}
              step="0.05"
              value={Math.min(currentTime, duration || 0)}
              onChange={(event) => seek(Number(event.target.value))}
              style={{ '--reel-progress': `${duration ? (currentTime / duration) * 100 : 0}%` } as CSSProperties}
            />
            <span className="reel-clock">{clock(duration)}</span>
            <button type="button" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
            <button type="button" onClick={fullscreen} aria-label="Enter fullscreen"><Maximize2 size={17} /></button>
          </div>
        )}
      </div>
    </article>
  );
}
