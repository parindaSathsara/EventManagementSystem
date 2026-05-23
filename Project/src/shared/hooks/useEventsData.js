import { useEffect, useState, useCallback } from 'react';
import { eventsRepo, subscribe, CHANNELS } from '../../services';

/**
 * Live events list. Triggers a backend fetch on mount, subscribes to repo
 * updates, and exposes `{ data, loading, error, refresh }` so screens can
 * render proper loading / connection-error states.
 *
 * Backwards-compatible: legacy callers can still treat the return value as
 * an array via the `events` alias OR by reading `data` directly.
 */
export default function useEventsData() {
  const [snapshot, setSnapshot] = useState(() => makeSnapshot());

  const refresh = useCallback(async () => {
    try {
      await eventsRepo.fetch();
    } catch {
      // Error is captured by the repo and surfaced via getLastError().
    }
  }, []);

  useEffect(() => {
    // Pull-to-refresh on mount.
    refresh();
    setSnapshot(makeSnapshot());
    return subscribe(CHANNELS.EVENTS, () => setSnapshot(makeSnapshot()));
  }, [refresh]);

  // Make the hook usable both as `const events = useEventsData()` (legacy)
  // and `const { data, loading, error, refresh } = useEventsData()`.
  const result = snapshot.data;
  result.data = snapshot.data;
  result.loading = snapshot.loading;
  result.error = snapshot.error;
  result.refresh = refresh;
  return result;
}

function makeSnapshot() {
  const data = [...eventsRepo.getAll()];
  return {
    data,
    loading: eventsRepo.isLoading(),
    error: eventsRepo.getLastError(),
  };
}
