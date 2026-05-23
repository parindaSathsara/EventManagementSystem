import { useEffect, useState, useCallback } from 'react';
import { ticketsRepo, eventsRepo, subscribe, CHANNELS } from '../../services';

/**
 * User's tickets, denormalised with their event payload so the UI can render
 * past/upcoming flags without a second lookup. Triggers a backend fetch on
 * mount and re-derives whenever tickets OR events change.
 */
export default function useTicketsData() {
  const [snapshot, setSnapshot] = useState(() => makeSnapshot());

  const refresh = useCallback(async () => {
    try {
      await ticketsRepo.fetch();
    } catch {
      /* surfaced via getLastError */
    }
  }, []);

  useEffect(() => {
    refresh();
    setSnapshot(makeSnapshot());
    const unsubT = subscribe(CHANNELS.TICKETS, () => setSnapshot(makeSnapshot()));
    const unsubE = subscribe(CHANNELS.EVENTS, () => setSnapshot(makeSnapshot()));
    return () => { unsubT(); unsubE(); };
  }, [refresh]);

  const result = snapshot.data;
  result.data = snapshot.data;
  result.loading = snapshot.loading;
  result.error = snapshot.error;
  result.refresh = refresh;
  return result;
}

function joinTickets() {
  const now = Date.now();
  return ticketsRepo.getAll().map((t) => {
    // The backend already inlines `event` on each ticket; fall back to the
    // cached events list if the API shape didn't include it.
    const event = t.event || eventsRepo.getById(t.eventId) || null;
    const isPast = event ? new Date(event.endsAt).getTime() < now : false;
    return { ...t, event, isPast };
  });
}

function makeSnapshot() {
  return {
    data: joinTickets(),
    loading: ticketsRepo.isLoading(),
    error: ticketsRepo.getLastError(),
  };
}
