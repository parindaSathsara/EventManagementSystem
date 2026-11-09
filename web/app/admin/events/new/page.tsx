'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AdminEventEditor } from '@/components/admin/admin-event-editor';

export default function AdminNewEventPage() {
  // undefined = not read yet; null = no preselected organizer.
  const [organizerId, setOrganizerId] = useState<string | null | undefined>(undefined);
  useEffect(() => { setOrganizerId(new URLSearchParams(window.location.search).get('organizer')); }, []);

  return (
    <div className="adm-page">
      <div>
        <Link className="adm-crumb" href="/admin/events"><ArrowLeft size={14} />All events</Link>
        <div className="adm-head">
          <div>
            <div className="adm-eyebrow">Content</div>
            <h1>Create an event</h1>
            <p>Publish for any organizer. It appears on the website and in the app straight away, and their followers are alerted.</p>
          </div>
        </div>
      </div>
      {organizerId !== undefined && <AdminEventEditor initialOrganizerId={organizerId} />}
    </div>
  );
}
