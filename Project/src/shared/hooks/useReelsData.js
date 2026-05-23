import { useEffect, useState, useCallback } from 'react';
import { reelsRepo, subscribe, CHANNELS } from '../../services';

/**
 * Live reels list. Triggers a backend fetch on mount + on every repo emit.
 *
 * Returns an array for backward-compat; loading / error / refresh hang off
 * the array as properties for screens that want them.
 */
export default function useReelsData() {
  const [snapshot, setSnapshot] = useState(() => makeSnapshot());

  const refresh = useCallback(async () => {
    try {
      await reelsRepo.fetch();
    } catch {
      /* surfaced via getLastError */
    }
  }, []);

  useEffect(() => {
    refresh();
    setSnapshot(makeSnapshot());
    return subscribe(CHANNELS.REELS, () => setSnapshot(makeSnapshot()));
  }, [refresh]);

  const result = snapshot.data;
  result.data = snapshot.data;
  result.loading = snapshot.loading;
  result.error = snapshot.error;
  result.refresh = refresh;
  return result;
}

function makeSnapshot() {
  const data = [...reelsRepo.getAll()];
  return {
    data,
    loading: reelsRepo.isLoading(),
    error: reelsRepo.getLastError(),
  };
}
