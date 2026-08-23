'use client';

import { BadgeCheck, Clapperboard, Play, Radio } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { compactNumber, mediaUrl } from '@/lib/format';
import type { Paginated, Reel } from '@/lib/types';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { ReelPlayer } from '@/components/reel-player';

export default function ReelsPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [feed, setFeed] = useState<'forYou' | 'following'>('forYou');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(nextFeed = feed) {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<Paginated<Reel>>(`/reels?feed=${nextFeed}&take=50`, true);
      setReels(data.items);
      setActiveIndex(0);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(feed); }, [feed]);
  const active = reels[activeIndex];

  return (
    <div className="page-shell reels-page">
      <div className="page-heading reels-heading">
        <div>
          <p className="eyebrow"><Radio size={13} /> Live visual feed</p>
          <h1>Inside the<br /><span className="outline-text">moment.</span></h1>
        </div>
        <div className="reel-feed-switch" role="tablist" aria-label="Reel feed">
          <button role="tab" aria-selected={feed === 'forYou'} className={feed === 'forYou' ? 'active' : ''} onClick={() => setFeed('forYou')}>For you</button>
          <button role="tab" aria-selected={feed === 'following'} className={feed === 'following' ? 'active' : ''} onClick={() => setFeed('following')}>Following</button>
        </div>
      </div>

      {loading ? <LoadingState label="Tuning the visual feed" /> : error ? <ErrorState message={error} retry={() => load(feed)} /> : active ? (
        <div className="reel-experience">
          <ReelPlayer key={active.id} reel={active} />
          <aside className="reel-queue">
            <div className="reel-queue-head">
              <span><Clapperboard size={16} /> Up next</span>
              <small>{reels.length} transmission{reels.length === 1 ? '' : 's'}</small>
            </div>
            <div className="reel-queue-list">
              {reels.map((reel, index) => {
                const name = reel.artist?.name || reel.artist?.user?.name || reel.artist?.handle || 'Stage artist';
                const reactions = Object.values(reel.stats?.reactions || {}).reduce((sum, value) => sum + value, 0);
                return (
                  <button key={reel.id} type="button" className={`reel-queue-item${index === activeIndex ? ' active' : ''}`} onClick={() => setActiveIndex(index)}>
                    <span className="reel-queue-visual" style={{ backgroundColor: reel.coverColor || '#160b19' }}>
                      {reel.coverImageUrl ? <img src={mediaUrl(reel.coverImageUrl) || reel.coverImageUrl} alt="" /> : reel.videoUrl ? <video src={mediaUrl(reel.videoUrl) || reel.videoUrl} muted playsInline preload="metadata" /> : <span className="reel-queue-placeholder"><Play size={18} /></span>}
                      <i>{index === activeIndex ? 'PLAYING' : String(index + 1).padStart(2, '0')}</i>
                    </span>
                    <span className="reel-queue-copy">
                      <span className="reel-queue-artist">{name} {reel.artist?.isVerified && <BadgeCheck size={13} className="verified" />}</span>
                      <strong>{reel.caption}</strong>
                      <small>{reel.videoUrl ? 'Video' : 'Visual pending'} · {compactNumber(reactions)} reactions</small>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="reel-queue-note"><i /> Clips play muted first so they start reliably. Tap the sound control when you are ready.</div>
          </aside>
        </div>
      ) : <EmptyState title="The feed is warming up" copy="Fresh artist reels will appear here as soon as they are published." />}
    </div>
  );
}
