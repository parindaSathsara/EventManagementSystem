'use client';

import { Check, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getFollowed, setFollowing, subscribeFollows } from '@/lib/follows';

/** The followed-company ids for this browser, kept live across components and tabs. */
export function useFollows() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setIds(getFollowed());
    sync();
    return subscribeFollows(sync);
  }, []);
  return ids;
}

/**
 * Follow pill for an event company — no account needed (same as the app).
 * `onCount` receives the company's updated follower count from the server.
 */
export function FollowButton({
  companyId,
  size = 'medium',
  onCount,
  className = '',
}: {
  companyId: string;
  size?: 'small' | 'medium';
  onCount?: (count: number) => void;
  className?: string;
}) {
  const ids = useFollows();
  const following = ids.includes(companyId);
  const [busy, setBusy] = useState(false);

  async function toggle(e: React.MouseEvent) {
    // Follow buttons sit inside clickable cards — don't open the card too.
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const result = await setFollowing(companyId, !following);
    if (typeof result.followerCount === 'number') onCount?.(result.followerCount);
    setBusy(false);
  }

  return (
    <button
      type="button"
      className={`follow-button follow-${size}${following ? ' is-following' : ''}${className ? ` ${className}` : ''}`}
      onClick={toggle}
      disabled={busy}
      aria-pressed={following}
    >
      {following ? <Check size={size === 'small' ? 13 : 15} /> : <Plus size={size === 'small' ? 13 : 15} />}
      {following ? 'Following' : 'Follow'}
    </button>
  );
}
