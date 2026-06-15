import { useEffect, useState, useCallback } from 'react';
import { followRepo, subscribe, CHANNELS } from '../../services';

/**
 * Local "following" set for guests. Returns `{ ids, isFollowing, toggle }`.
 * Re-renders whenever the follow set changes (FOLLOWS channel).
 */
export default function useFollows() {
  const [ids, setIds] = useState(() => followRepo.getAll());

  useEffect(() => {
    followRepo.hydrate();
    setIds(followRepo.getAll());
    return subscribe(CHANNELS.FOLLOWS, () => setIds(followRepo.getAll()));
  }, []);

  const isFollowing = useCallback((id) => followRepo.isFollowing(id), []);
  const toggle = useCallback((id) => followRepo.toggle(id), []);

  return { ids, isFollowing, toggle };
}
