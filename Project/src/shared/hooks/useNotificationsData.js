import { useEffect, useState, useCallback } from 'react';
import { notificationsRepo, subscribe, CHANNELS } from '../../services';

/**
 * Live reminder feed (events 1–2 days out). Same shape as useEventsData:
 * returns the array with `{ data, loading, error, refresh }` attached.
 */
export default function useNotificationsData() {
  const [snapshot, setSnapshot] = useState(() => makeSnapshot());

  const refresh = useCallback(async () => {
    try {
      await notificationsRepo.fetch();
    } catch {
      /* surfaced via getLastError() */
    }
  }, []);

  useEffect(() => {
    refresh();
    setSnapshot(makeSnapshot());
    return subscribe(CHANNELS.NOTIFICATIONS, () => setSnapshot(makeSnapshot()));
  }, [refresh]);

  const result = snapshot.data;
  result.data = snapshot.data;
  result.loading = snapshot.loading;
  result.error = snapshot.error;
  result.refresh = refresh;
  return result;
}

function makeSnapshot() {
  const data = [...notificationsRepo.getAll()];
  return {
    data,
    loading: notificationsRepo.isLoading(),
    error: notificationsRepo.getLastError(),
  };
}
