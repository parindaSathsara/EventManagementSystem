export type User = {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  city?: string | null;
  avatarUrl?: string | null;
  role: 'customer' | 'artist' | 'admin';
};

export type Artist = {
  id: string;
  name?: string;
  avatarUrl?: string | null;
  userId?: string;
  handle: string;
  bio?: string | null;
  category?: string | null;
  isVerified?: boolean;
  isPreferred?: boolean;
  followerCount?: number;
  isFollowing?: boolean;
  socialsJson?: string | null;
  user?: { name: string; avatarUrl?: string | null; city?: string | null };
  _count?: { followers?: number; events?: number; reels?: number };
};

export type TicketType = {
  id: string;
  name: string;
  priceLabel: string;
  priceCents: number;
  currency: string;
  total: number;
  remaining: number;
};

export type LineupArtist = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role?: string;
  socials?: Record<string, string> | null;
};

export type EventItem = {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  coverColor?: string | null;
  coverImageUrl?: string | null;
  bannerImageUrl?: string | null;
  flyers?: string[];
  ticketUrl?: string | null;
  startsAt: string;
  endsAt: string;
  startTimeTba?: boolean;
  venueName?: string | null;
  cityName: string;
  addressLine?: string | null;
  ageRestriction?: string | null;
  status: string;
  organizerArtistId?: string;
  organizer?: Artist & { socials?: Record<string, string> | null };
  ticketTypes?: TicketType[];
  lineup?: LineupArtist[];
  isSaved?: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: { savedBy?: number; tickets?: number };
};

export type Reel = {
  id: string;
  caption: string;
  coverColor?: string;
  coverImageUrl?: string | null;
  videoUrl?: string | null;
  musicTrackTitle?: string | null;
  musicTrackArtistName?: string | null;
  musicTrack?: { title: string; artistName: string } | null;
  artist?: Artist;
  linkedEvent?: EventItem | null;
  tags?: Array<{ tag?: string } | string>;
  stats?: { reactions?: Record<string, number>; reposts?: number; saves?: number; shares?: number };
  isSaved?: boolean;
};

export type Ticket = {
  id: string;
  holderName: string;
  status: string;
  qrPayload: string;
  typeName?: string | null;
  issuedAt: string;
  event: EventItem;
};

export type Paginated<T> = { items: T[]; total: number };
