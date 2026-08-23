import Link from 'next/link';
import { ArrowUpRight, MapPin } from 'lucide-react';
import type { EventItem } from '@/lib/types';
import { eventDate, eventTime, getImage, monthDay } from '@/lib/format';
import { MediaImage } from './media';

export function EventCard({ event, featured = false }: { event: EventItem; featured?: boolean }) {
  const date = monthDay(event.startsAt);
  const fromPrice = event.ticketTypes?.[0]?.priceLabel;
  const organizer = event.organizer?.user?.name || event.organizer?.handle || 'Stage';

  return (
    <Link className={featured ? 'event-card featured' : 'event-card'} href={`/events/${event.id}`}>
      <div className="event-card-media" style={{ backgroundColor: event.coverColor || '#211' }}>
        <MediaImage src={getImage(event)} alt={`${event.title} event artwork`} decoding="async" />
        <span className="event-category">{event.category}</span>
        <span className="event-arrow"><ArrowUpRight size={20} /></span>
        <div className="event-date-block"><strong>{date.day}</strong><span>{date.month}</span></div>
      </div>
      <div className="event-card-body">
        <p className="eyebrow">Presented by {organizer}</p>
        <h3>{event.title}</h3>
        <p className="event-meta"><MapPin size={15} /> {event.venueName || 'Venue revealed soon'}, {event.cityName}</p>
        <div className="event-card-foot"><span>{eventDate(event.startsAt)} · {event.startTimeTba ? 'Time TBA' : eventTime(event.startsAt)}</span><strong>{fromPrice || 'View details'}</strong></div>
      </div>
    </Link>
  );
}
