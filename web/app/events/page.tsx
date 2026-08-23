import type { Metadata } from 'next';
import { EventsExplorer } from '@/components/events-explorer';

export const metadata: Metadata = { title: 'Discover events', description: 'Find live music, festivals and events across Sri Lanka.' };

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ focus?: string; category?: string }> }) {
  const params = await searchParams;
  return <div className="page-shell"><div className="page-heading discover-heading"><p className="eyebrow">Discover the island</p><h1>Find your next night out.</h1><p>Real event details, clear ticket options and the best of Sri Lanka&apos;s live scene—all in one place.</p></div><EventsExplorer focusSearch={params.focus === 'search'} initialCategory={params.category} /></div>;
}
