import Link from 'next/link';
import { ArrowUpRight, MapPin } from 'lucide-react';
import type { EventItem } from '@/lib/types';
import { eventDate, eventTime, getImage, monthDay } from '@/lib/format';
import { FlyerImage } from './media';

export function EventCard({ event, featured = false }: { event: EventItem; featured?: boolean }) {
  const date = monthDay(event.startsAt);
  const organizer = event.organizer?.user?.name || event.organizer?.handle || 'Stage';

  return (
    <Link className={featured ? 'event-card featured' : 'event-card'} href={`/events/${event.id}`}>
      <div className="event-card-media flyer-frame" style={{ backgroundColor: event.coverColor || '#211' }}>
        <FlyerImage src={getImage(event)} alt={`${event.title} event artwork`} seed={event.id} />
        <span className="event-category">{event.category}</span>
        <span className="event-arrow"><ArrowUpRight size={20} /></span>
        <div className="event-date-block"><strong>{date.day}</strong><span>{date.month}</span></div>
      </div>
      <div className="event-card-body">
        <p className="eyebrow">Presented by {organizer}</p>
        <h3>{event.title}</h3>
        <p className="event-meta"><MapPin size={15} /> {event.venueName || 'Venue revealed soon'}, {event.cityName}</p>
        {/* No ticket price on the card (client feedback 2026-11-08): it could
            only ever show one of several ticket categories. Prices live on the
            event page. */}
        <div className="event-card-foot"><span>{eventDate(event.startsAt)} · {event.startTimeTba ? 'Time TBA' : eventTime(event.startsAt)}</span><strong>View details</strong></div>
      </div>
    </Link>
  );
}
