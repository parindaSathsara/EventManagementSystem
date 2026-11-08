import type { Metadata } from 'next';
import { EventsExplorer } from '@/components/events-explorer';

export const metadata: Metadata = { title: 'Discover events', description: 'Festivals, EDM nights, live concerts and hip hop across Sri Lanka — follow the companies you love and never miss a drop.' };

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ focus?: string; category?: string }> }) {
  const params = await searchParams;
  return <div className="page-shell"><div className="page-heading discover-heading"><p className="eyebrow">Discover the island</p><h1>Your next stage is waiting.</h1><p>Festivals, EDM nights, live concerts and hip hop from every corner of the island. Follow the companies you love and never miss a drop.</p></div><EventsExplorer focusSearch={params.focus === 'search'} initialCategory={params.category} /></div>;
}
