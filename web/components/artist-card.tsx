import Link from 'next/link';
import { BadgeCheck, ChevronRight, UsersRound } from 'lucide-react';
import { compactNumber } from '@/lib/format';
import type { Artist } from '@/lib/types';
import { Avatar } from './media';

export function ArtistCard({ artist }: { artist: Artist }) {
  const name = artist.user?.name || artist.name || artist.handle;
  return (
    <Link href={`/artists/${artist.id}`} className="artist-card">
      <Avatar name={name} src={artist.user?.avatarUrl || artist.avatarUrl} size="large" />
      <span className="artist-card-copy">
        <span className="artist-name">{name} {artist.isVerified && <BadgeCheck size={16} className="verified" />}</span>
        <span className="artist-handle">@{artist.handle}</span>
        <span className="artist-followers"><UsersRound size={13} /> {compactNumber(artist.followerCount || artist._count?.followers)} followers · {artist.category || 'Artist'}</span>
      </span>
      <span className="artist-card-action">View profile <ChevronRight size={16} /></span>
    </Link>
  );
}
