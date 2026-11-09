'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import type { EventItem } from '@/lib/types';
import { AdminEventEditor } from '@/components/admin/admin-event-editor';
import { EventStatusBadge } from '@/components/admin/ui';

export default function AdminEditEventPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<EventItem>(`/events/${id}`).then(setEvent).catch((err: Error) => setError(err.message));
  }, [id]);

  return (
    <div className="adm-page">
      <div>
        <Link className="adm-crumb" href="/admin/events"><ArrowLeft size={14} />All events</Link>
        <div className="adm-head">
          <div>
            <div className="adm-eyebrow">Content</div>
            <h1>{event ? event.title : 'Edit event'}</h1>
            {event && <div className="adm-profile-meta"><EventStatusBadge status={event.status} /><span className="adm-text-2" style={{ fontSize: 13.5 }}>by {event.organizer?.user?.name || event.organizer?.handle}</span></div>}
          </div>
          {event && <div className="adm-head-actions"><Link className="adm-btn" href={`/events/${event.id}`} target="_blank"><ExternalLink size={15} />View on the website</Link></div>}
        </div>
      </div>
      {error && <div className="adm-notice">{error}</div>}
      {!event && !error && <div className="adm-skel" style={{ height: 420 }} />}
      {event && <AdminEventEditor event={event} />}
    </div>
  );
}
