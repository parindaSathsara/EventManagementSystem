const prisma = require('../../prisma');
const { NotFound, Conflict } = require('../../lib/errors');

const ARTIST_INCLUDE = {
  user: { select: { name: true, avatarUrl: true, city: true } },
  _count: { select: { followers: true, events: true, reels: true } },
};

async function list({ search, verifiedOnly, take, skip }, viewerUserId) {
  const where = {
    ...(verifiedOnly ? { isVerified: true } : {}),
    ...(search
      ? {
          OR: [
            { handle: { contains: search } },
            { user: { name: { contains: search } } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.artist.findMany({
      where,
      include: ARTIST_INCLUDE,
      orderBy: { followerCount: 'desc' },
      take,
      skip,
    }),
    prisma.artist.count({ where }),
  ]);

  let followedSet = new Set();
  if (viewerUserId && items.length) {
    const follows = await prisma.follow.findMany({
      where: { followerId: viewerUserId, artistId: { in: items.map((a) => a.id) } },
      select: { artistId: true },
    });
    followedSet = new Set(follows.map((f) => f.artistId));
  }

  return {
    items: items.map((a) => ({ ...a, isFollowing: followedSet.has(a.id) })),
    total,
  };
}

async function getById(id, viewerUserId) {
  const artist = await prisma.artist.findUnique({
    where: { id },
    include: ARTIST_INCLUDE,
  });
  if (!artist) throw new NotFound('Artist not found');
  let isFollowing = false;
  if (viewerUserId) {
    const follow = await prisma.follow.findUnique({
      where: { followerId_artistId: { followerId: viewerUserId, artistId: id } },
    });
    isFollowing = !!follow;
  }
  return { ...artist, isFollowing };
}

/**
 * Returns the caller's own artist profile (or null if they're not an artist).
 * Avoids the FE needing to scan the artists list to find itself.
 */
async function getMine(userId) {
  const artist = await prisma.artist.findUnique({
    where: { userId },
    include: ARTIST_INCLUDE,
  });
  return artist || null;
}

/**
 * Upgrades the requesting user into an artist (idempotent for the same handle).
 */
async function becomeArtist(userId, { handle, bio, category }) {
  const existing = await prisma.artist.findUnique({ where: { userId } });
  if (existing) return existing;

  const handleClash = await prisma.artist.findUnique({ where: { handle } });
  if (handleClash) throw new Conflict('That handle is already taken.');

  return prisma.$transaction(async (tx) => {
    const artist = await tx.artist.create({
      data: { userId, handle, bio, category },
    });
    await tx.user.update({ where: { id: userId }, data: { role: 'artist' } });
    return artist;
  });
}

async function updateArtist(userId, patch) {
  const artist = await prisma.artist.findUnique({ where: { userId } });
  if (!artist) throw new NotFound('No artist profile to update.');
  if (patch.handle && patch.handle !== artist.handle) {
    const clash = await prisma.artist.findUnique({ where: { handle: patch.handle } });
    if (clash) throw new Conflict('That handle is already taken.');
  }
  return prisma.artist.update({
    where: { userId },
    data: patch,
    include: ARTIST_INCLUDE,
  });
}

/**
 * Anonymous (guest) follow sync. Guests have no account, so the app sends a
 * per-install device id together with the desired state. Idempotent: the
 * count only moves when a GuestFollow row is actually created or deleted, so
 * retries can never double-count.
 */
async function setGuestFollow(artistId, deviceId, follow) {
  const artist = await prisma.artist.findUnique({ where: { id: artistId }, select: { id: true } });
  if (!artist) throw new NotFound('Artist not found');

  const key = { deviceId_artistId: { deviceId, artistId } };
  const existing = await prisma.guestFollow.findUnique({ where: key });

  return prisma.$transaction(async (tx) => {
    if (follow && !existing) {
      await tx.guestFollow.create({ data: { deviceId, artistId } });
      const updated = await tx.artist.update({
        where: { id: artistId },
        data: { followerCount: { increment: 1 } },
        select: { followerCount: true },
      });
      return { following: true, followerCount: updated.followerCount };
    }
    if (!follow && existing) {
      await tx.guestFollow.delete({ where: key });
      const updated = await tx.artist.update({
        where: { id: artistId },
        data: { followerCount: { decrement: 1 } },
        select: { followerCount: true },
      });
      return { following: false, followerCount: Math.max(0, updated.followerCount) };
    }
    const current = await tx.artist.findUnique({
      where: { id: artistId },
      select: { followerCount: true },
    });
    return { following: !!follow, followerCount: current.followerCount };
  });
}

async function toggleFollow(artistId, viewerUserId) {
  const key = { followerId_artistId: { followerId: viewerUserId, artistId } };
  const existing = await prisma.follow.findUnique({ where: key });

  return prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.follow.delete({ where: key });
      await tx.artist.update({
        where: { id: artistId },
        data: { followerCount: { decrement: 1 } },
      });
      return { following: false };
    }
    await tx.follow.create({ data: { followerId: viewerUserId, artistId } });
    await tx.artist.update({
      where: { id: artistId },
      data: { followerCount: { increment: 1 } },
    });
    return { following: true };
  });
}

module.exports = { list, getById, getMine, becomeArtist, updateArtist, toggleFollow, setGuestFollow };
