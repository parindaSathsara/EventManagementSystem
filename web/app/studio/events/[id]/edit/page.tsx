'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { StudioGuard } from '@/components/studio-guard';
import { EventEditor } from '@/components/event-editor';
import { api } from '@/lib/api';
import type { EventItem } from '@/lib/types';
import { ErrorState, LoadingState } from '@/components/states';

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>(); const [event, setEvent] = useState<EventItem | null>(null); const [error, setError] = useState('');
  useEffect(() => { api.get<EventItem>(`/events/${id}`).then(setEvent).catch((err: Error) => setError(err.message)); }, [id]);
  return <StudioGuard><div className="editor-shell">{error ? <ErrorState message={error} /> : event ? <EventEditor event={event} /> : <LoadingState label="Loading event editor" />}</div></StudioGuard>;
}
