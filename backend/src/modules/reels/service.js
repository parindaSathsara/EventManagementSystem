const prisma = require('../../prisma');
const { NotFound, Forbidden } = require('../../lib/errors');

const REEL_INCLUDE = {
  artist: { include: { user: { select: { name: true, avatarUrl: true } } } },
  linkedEvent: { select: { id: true, title: true, startsAt: true, venueName: true, cityName: true } },
  tags: { select: { tag: true } },
  _count: {
    select: { reactions: true, reposts: true, saves: true },
  },
};

/**
 * Shapes a Prisma reel record into the JSON the mobile app expects.
 * Centralised so every list/detail/create call returns identical shape.
 */
async function decorateForViewer(reels, viewerUserId) {
  if (!reels.length) return [];
  const ids = reels.map((r) => r.id);

  // Per-viewer state (reactions, saves, reposts, follow status) in 3 lookups.
  const [myReactions, mySaves, myReposts, myFollows] = viewerUserId
    ? await Promise.all([
        prisma.reelReaction.findMany({
          where: { userId: viewerUserId, reelId: { in: ids } },
          select: { reelId: true, reactionCode: true },
        }),
        prisma.savedReel.findMany({
          where: { userId: viewerUserId, reelId: { in: ids } },
          select: { reelId: true },
        }),
        prisma.reelRepost.findMany({
          where: { userId: viewerUserId, reelId: { in: ids } },
          select: { reelId: true },
        }),
        prisma.follow.findMany({
          where: {
            followerId: viewerUserId,
            artistId: { in: reels.map((r) => r.artistId) },
          },
          select: { artistId: true },
        }),
      ])
    : [[], [], [], []];

  const reactionByReel = new Map(myReactions.map((r) => [r.reelId, r.reactionCode]));
  const savedSet = new Set(mySaves.map((s) => s.reelId));
  const repostedSet = new Set(myReposts.map((s) => s.reelId));
  const followedArtists = new Set(myFollows.map((f) => f.artistId));

  // Per-reel reaction breakdown (one aggregate query).
  const breakdown = await prisma.reelReaction.groupBy({
    by: ['reelId', 'reactionCode'],
    where: { reelId: { in: ids } },
    _count: { reactionCode: true },
  });
  const reactionsByReel = new Map();
  for (const row of breakdown) {
    if (!reactionsByReel.has(row.reelId)) {
      reactionsByReel.set(row.reelId, { fire: 0, love: 0, handsUp: 0, wow: 0, party: 0 });
    }
    reactionsByReel.get(row.reelId)[row.reactionCode] = row._count.reactionCode;
  }

  return reels.map((r) => ({
    id: r.id,
    artist: {
      id: r.artist.id,
      name: r.artist.user.name,
      handle: r.artist.handle,
      avatarUrl: r.artist.user.avatarUrl,
      isVerified: r.artist.isVerified,
      isFollowing: followedArtists.has(r.artist.id),
    },
    caption: r.caption,
    musicTrack:
      r.musicTrackTitle && r.musicTrackArtistName
        ? { title: r.musicTrackTitle, artistName: r.musicTrackArtistName }
        : null,
    linkedEvent: r.linkedEvent,
    tags: r.tags.map((t) => t.tag),
    coverColor: r.coverColor,
    coverImageUrl: r.coverImageUrl,
    videoUrl: r.videoUrl,
    visibility: r.visibility,
    status: r.status,
    views: r.views,
    publishedAt: r.publishedAt,
    stats: {
      reactions:
        reactionsByReel.get(r.id) || { fire: 0, love: 0, handsUp: 0, wow: 0, party: 0 },
      reposts: r._count.reposts,
      saves: r._count.saves,
      shares: 0, // TODO: stop tracking shares as count; FE shows 0 today.
    },
    userReaction: reactionByReel.get(r.id) || null,
    isSaved: savedSet.has(r.id),
    isReposted: repostedSet.has(r.id),
  }));
}

async function list({ artistId, tag, eventId, feed, take, skip }, viewerUserId) {
  const where = {
    ...(artistId ? { artistId } : {}),
    ...(eventId ? { linkedEventId: eventId } : {}),
    ...(tag ? { tags: { some: { tag } } } : {}),
    visibility: 'public',
    // Customers only see published reels; pending/draft/etc. stay hidden.
    status: 'published',
  };

  // Following feed — filter to artists the viewer follows.
  if (feed === 'following' && viewerUserId) {
    const follows = await prisma.follow.findMany({
      where: { followerId: viewerUserId },
      select: { artistId: true },
    });
    where.artistId = { in: follows.map((f) => f.artistId) };
  }

  const [rows, total] = await Promise.all([
    prisma.reel.findMany({
      where,
      include: REEL_INCLUDE,
      orderBy: { publishedAt: 'desc' },
      take,
      skip,
    }),
    prisma.reel.count({ where }),
  ]);

  return { items: await decorateForViewer(rows, viewerUserId), total };
}

async function getById(id, viewerUserId) {
  const reel = await prisma.reel.findUnique({ where: { id }, include: REEL_INCLUDE });
  if (!reel) throw new NotFound('Reel not found');
  const [decorated] = await decorateForViewer([reel], viewerUserId);
  return decorated;
}

async function create(input, artistId) {
  if (!artistId) throw new Forbidden('Only artists can publish reels.');
  // Per FR-S5b: preferred artists auto-publish; everyone else enters
  // the approval queue. We look this up once here so the FE doesn't
  // have to know about the rule.
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: { isPreferred: true, isVerified: true },
  });
  if (!artist) throw new Forbidden('Artist profile not found.');
  if (!artist.isVerified) {
    throw new Forbidden('Your artist profile must be verified before publishing reels.');
  }

  const { tags, ...rest } = input;
  const initialStatus = artist.isPreferred ? 'published' : 'pending_approval';

  const reel = await prisma.reel.create({
    data: {
      ...rest,
      artistId,
      status: initialStatus,
      tags: tags.length ? { create: tags.map((t) => ({ tag: t.toLowerCase() })) } : undefined,
    },
    include: REEL_INCLUDE,
  });
  const [decorated] = await decorateForViewer([reel], null);
  // Annotate status so the artist UI can show "pending review".
  return { ...decorated, status: reel.status };
}

async function react(reelId, userId, code) {
  const key = { userId_reelId: { userId, reelId } };
  if (!code) {
    await prisma.reelReaction.deleteMany({ where: { userId, reelId } });
    return { userReaction: null };
  }
  await prisma.reelReaction.upsert({
    where: key,
    update: { reactionCode: code },
    create: { userId, reelId, reactionCode: code },
  });
  return { userReaction: code };
}

async function toggleSave(reelId, userId) {
  const key = { userId_reelId: { userId, reelId } };
  const existing = await prisma.savedReel.findUnique({ where: key });
  if (existing) {
    await prisma.savedReel.delete({ where: key });
    return { saved: false };
  }
  await prisma.savedReel.create({ data: { userId, reelId } });
  return { saved: true };
}

async function toggleRepost(reelId, userId) {
  const key = { userId_reelId: { userId, reelId } };
  const existing = await prisma.reelRepost.findUnique({ where: key });
  if (existing) {
    await prisma.reelRepost.delete({ where: key });
    return { reposted: false };
  }
  await prisma.reelRepost.create({ data: { userId, reelId } });
  return { reposted: true };
}

module.exports = { list, getById, create, react, toggleSave, toggleRepost };
