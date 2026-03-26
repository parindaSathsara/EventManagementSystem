/**
 * Mock reel data for development.
 * Replace with actual API calls in services/reelService.js when backend is ready.
 */

const MOCK_REELS = [
  {
    id: 'reel-1',
    artist: {
      id: 'artist-1',
      name: 'DJ Nova',
      handle: '@djnova',
      avatar: null,
      isFollowing: false,
    },
    caption: 'Dropping this new set at Neon Nights next Friday 🔥 Who\'s coming?',
    musicTrack: {
      title: 'Midnight Pulse',
      artistName: 'DJ Nova',
    },
    linkedEvent: {
      id: 'event-1',
      title: 'Neon Nights Festival',
    },
    tags: ['#NeonNights', '#EDM', '#LiveSet'],
    stats: {
      reactions: { fire: 234, love: 89, handsUp: 56, wow: 12, party: 145 },
      reposts: 67,
      saves: 203,
      shares: 45,
    },
    userReaction: null,
    isSaved: false,
    isReposted: false,
    coverColor: '#1a0533',
    publishedAt: '2026-03-07T20:00:00Z',
  },
  {
    id: 'reel-2',
    artist: {
      id: 'artist-2',
      name: 'Luna Ray',
      handle: '@lunaray',
      avatar: null,
      isFollowing: true,
    },
    caption: 'Backstage vibes before the storm 🌙✨',
    musicTrack: {
      title: 'Electric Dreams',
      artistName: 'Luna Ray',
    },
    linkedEvent: null,
    tags: ['#Backstage', '#LiveMusic'],
    stats: {
      reactions: { fire: 567, love: 312, handsUp: 198, wow: 45, party: 89 },
      reposts: 134,
      saves: 456,
      shares: 98,
    },
    userReaction: 'fire',
    isSaved: true,
    isReposted: false,
    coverColor: '#0d1b2a',
    publishedAt: '2026-03-07T18:30:00Z',
  },
  {
    id: 'reel-3',
    artist: {
      id: 'artist-3',
      name: 'KRSNA',
      handle: '@krsnaofficial',
      avatar: null,
      isFollowing: false,
    },
    caption: 'New track preview — full release dropping soon. Stay locked 🎤',
    musicTrack: {
      title: 'Vyanjan',
      artistName: 'KRSNA',
    },
    linkedEvent: {
      id: 'event-3',
      title: 'Hip Hop India Tour',
    },
    tags: ['#HipHop', '#NewRelease', '#KRSNA'],
    stats: {
      reactions: { fire: 1203, love: 876, handsUp: 543, wow: 234, party: 321 },
      reposts: 567,
      saves: 890,
      shares: 345,
    },
    userReaction: null,
    isSaved: false,
    isReposted: false,
    coverColor: '#1c1c1c',
    publishedAt: '2026-03-06T22:00:00Z',
  },
  {
    id: 'reel-4',
    artist: {
      id: 'artist-4',
      name: 'Aisha Beats',
      handle: '@aishabeats',
      avatar: null,
      isFollowing: true,
    },
    caption: 'When the bass hits different at 2AM 🎧💜 Aftermovie from last weekend',
    musicTrack: {
      title: 'Bass Cathedral',
      artistName: 'Aisha Beats',
    },
    linkedEvent: {
      id: 'event-4',
      title: 'Underground Warehouse Party',
    },
    tags: ['#Bass', '#Underground', '#Aftermovie'],
    stats: {
      reactions: { fire: 432, love: 265, handsUp: 189, wow: 78, party: 156 },
      reposts: 89,
      saves: 312,
      shares: 67,
    },
    userReaction: 'love',
    isSaved: false,
    isReposted: true,
    coverColor: '#0a0a1a',
    publishedAt: '2026-03-06T14:00:00Z',
  },
  {
    id: 'reel-5',
    artist: {
      id: 'artist-5',
      name: 'Prism Collective',
      handle: '@prismcollective',
      avatar: null,
      isFollowing: false,
    },
    caption: 'Art meets sound. Our immersive installation is LIVE this weekend 🎨🔊',
    musicTrack: {
      title: 'Chromatic',
      artistName: 'Prism Collective',
    },
    linkedEvent: {
      id: 'event-5',
      title: 'Prism Art + Sound Experience',
    },
    tags: ['#ArtInstallation', '#Immersive', '#LiveExperience'],
    stats: {
      reactions: { fire: 189, love: 456, handsUp: 98, wow: 234, party: 67 },
      reposts: 45,
      saves: 567,
      shares: 123,
    },
    userReaction: null,
    isSaved: true,
    isReposted: false,
    coverColor: '#1a0a2e',
    publishedAt: '2026-03-05T16:00:00Z',
  },
];

export default MOCK_REELS;
