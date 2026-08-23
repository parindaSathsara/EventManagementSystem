'use client';

import Link from 'next/link';
import { ArrowRight, Search, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Artist, Paginated } from '@/lib/types';
import { ArtistCard } from '@/components/artist-card';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timeout = setTimeout(async () => {
      setLoading(true); setError('');
      try {
        const result = await api.get<Paginated<Artist>>(`/artists?take=100&verifiedOnly=true${query ? `&search=${encodeURIComponent(query)}` : ''}`, false);
        setArtists(result.items);
      } catch (err) { setError((err as Error).message); }
      finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="page-shell artists-page">
      <div className="page-heading artists-heading">
        <div><p className="eyebrow">Artists & organizers</p><h1>Meet the people behind the night.</h1><p>Explore verified profiles, follow your favourites and see every upcoming date in one place.</p></div>
        <Link className="artist-join-card" href="/studio"><Sparkles /><span><strong>Are you an artist or organizer?</strong><small>Build your public profile and publish your next event.</small></span><ArrowRight /></Link>
      </div>
      <div className="search-panel artist-search"><div className="search-box"><Search size={19} /><input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by artist, organizer or handle" aria-label="Search artists" />{query && <button className="search-clear" type="button" onClick={() => setQuery('')} aria-label="Clear search"><X size={16} /></button>}</div></div>
      <div className="results-bar"><span>{loading ? 'Searching…' : <><strong>{artists.length}</strong> verified profile{artists.length === 1 ? '' : 's'}</>}</span><span>Follow now, hear about the next date first</span></div>
      {loading ? <LoadingState label="Bringing profiles on stage" /> : error ? <ErrorState message={error} /> : artists.length ? <div className="artist-grid">{artists.map((artist) => <ArtistCard key={artist.id} artist={artist} />)}</div> : <EmptyState title="No profiles match that search" copy="Check the spelling or try a shorter name." />}
    </div>
  );
}
