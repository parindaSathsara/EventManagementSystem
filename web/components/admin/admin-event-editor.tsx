'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EventEditor } from '@/components/event-editor';
import type { EventItem } from '@/lib/types';
import { type OrganizerOption, adminApi } from '@/lib/admin';
import { OrganizerPicker } from './organizer-picker';

function optionFromEvent(event: EventItem): OrganizerOption | null {
  const o = event.organizer;
  if (!o) return null;
  return {
    id: o.id,
    userId: o.userId || '',
    handle: o.handle,
    name: o.user?.name || o.name || o.handle,
    avatarUrl: o.user?.avatarUrl || o.avatarUrl || null,
    category: o.category || null,
    isVerified: !!o.isVerified,
    suspended: false,
    followerCount: o.followerCount || 0,
    events: 0,
  };
}

/**
 * The organizers' event editor, in console mode: pick the organizer, choose
 * visibility, and land back on the console's event list after saving.
 */
export function AdminEventEditor({ event, initialOrganizerId }: { event?: EventItem; initialOrganizerId?: string | null }) {
  const router = useRouter();
  const [organizer, setOrganizer] = useState<OrganizerOption | null>(() => (event ? optionFromEvent(event) : null));

  // Fill in the full organizer card (event count, followers, suspension).
  useEffect(() => {
    const id = event?.organizerArtistId || event?.organizer?.id || initialOrganizerId;
    if (!id) return;
    adminApi.organizers({ id, take: 1 }).then((rows) => { if (rows[0]) setOrganizer(rows[0]); }).catch(() => {});
  }, [event, initialOrganizerId]);

  return (
    <div className="adm-editor">
      <EventEditor
        event={event}
        admin={{
          organizerArtistId: organizer?.id ?? null,
          organizerSlot: <OrganizerPicker value={organizer} onChange={setOrganizer} />,
          onSaved: (saved, created) => {
            const params = new URLSearchParams({ saved: created ? 'created' : 'updated', title: saved.title });
            router.push(`/admin/events?${params.toString()}`);
          },
        }}
      />
    </div>
  );
}
