const prisma = require('../../prisma');
const { NotFound, Forbidden, BadRequest } = require('../../lib/errors');

const EVENT_INCLUDE = {
  ticketTypes: { orderBy: { createdAt: 'asc' } },
  lineup: { include: { artist: { include: { user: { select: { name: true, avatarUrl: true } } } } } },
  organizer: {
    select: {
      id: true,
      handle: true,
      isVerified: true,
      bio: true,
      category: true,
      socialsJson: true,
      user: { select: { name: true, avatarUrl: true } },
    },
  },
  linkedReels: { select: { id: true } },
  _count: { select: { savedBy: true, tickets: true } },
};

/**
 * Reshape a Prisma Event row into the JSON contract the mobile app expects.
 *   - `geoLat` / `geoLng` -> nested `geo: { lat, lng }`
 *   - `linkedReels[]` -> flat `storylineReelIds[]`
 *   - `lineup[]` (LineupEntry rows) -> flat `[{ id, name, avatarUrl, role }]`
 *
 * Centralising the shape here means every screen reads the same object
 * whether it came from list, getById, create, or update.
 */
function safeParse(json, fallback) {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function shape(row, { isSaved = false } = {}) {
  if (!row) return row;
  return {
    ...row,
    geo: row.geoLat != null && row.geoLng != null
      ? { lat: row.geoLat, lng: row.geoLng }
      : null,
    flyers: safeParse(row.flyersJson, []),
    socials: safeParse(row.socialsJson, null),
    organizer: row.organizer
      ? { ...row.organizer, socials: safeParse(row.organizer.socialsJson, null) }
      : row.organizer,
    storylineReelIds: (row.linkedReels || []).map((r) => r.id),
    lineup: (row.lineup || []).map((entry, idx) => ({
      id: entry.artist?.id || entry.artistId,
      name: entry.artist?.user?.name || entry.artist?.handle || 'Artist',
      avatarUrl: entry.artist?.user?.avatarUrl || null,
      role: idx === 0 ? 'Headliner' : 'Support',
    })),
    isSaved,
  };
}

function whereForStatus(status) {
  const now = new Date();
  if (status === 'upcoming') {
    return { status: { in: ['published', 'live'] }, startsAt: { gt: now } };
  }
  if (status === 'live') return { status: 'live' };
  if (status === 'past') return { endsAt: { lt: now } };
  if (status === 'draft') return { status: 'draft' };
  return {};
}

async function list({ status, organizerId, cityName, category, search, take, skip }, viewerUserId) {
  const where = {
    ...whereForStatus(status),
    ...(organizerId ? { organizerArtistId: organizerId } : {}),
    ...(cityName ? { cityName: { contains: cityName } } : {}),
    ...(category ? { category } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search } },
            { venueName: { contains: search } },
            { cityName: { contains: search } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: EVENT_INCLUDE,
      orderBy: { startsAt: 'asc' },
      take,
      skip,
    }),
    prisma.event.count({ where }),
  ]);

  // Annotate `isSaved` for the viewer in one extra query.
  let savedSet = new Set();
  if (viewerUserId && items.length) {
    const saved = await prisma.savedEvent.findMany({
      where: { userId: viewerUserId, eventId: { in: items.map((i) => i.id) } },
      select: { eventId: true },
    });
    savedSet = new Set(saved.map((s) => s.eventId));
  }

  return {
    items: items.map((e) => shape(e, { isSaved: savedSet.has(e.id) })),
    total,
  };
}

async function getById(id, viewerUserId) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: EVENT_INCLUDE,
  });
  if (!event) throw new NotFound('Event not found');
  let isSaved = false;
  if (viewerUserId) {
    const saved = await prisma.savedEvent.findUnique({
      where: { userId_eventId: { userId: viewerUserId, eventId: id } },
    });
    isSaved = !!saved;
  }
  return shape(event, { isSaved });
}

async function create(input, artistId) {
  if (!artistId) {
    throw new Forbidden('Only verified artists can create events.');
  }
  if (input.endsAt <= input.startsAt) {
    throw new BadRequest('Event endsAt must be after startsAt.');
  }
  const { ticketTypes, lineupArtistIds, flyers, socials, ...rest } = input;
  // The organizer is always part of their own event's lineup if not already.
  const lineupIds = lineupArtistIds.length ? lineupArtistIds : [artistId];

  const created = await prisma.event.create({
    data: {
      ...rest,
      ...(flyers !== undefined ? { flyersJson: JSON.stringify(flyers || []) } : {}),
      ...(socials !== undefined ? { socialsJson: socials ? JSON.stringify(socials) : null } : {}),
      organizerArtistId: artistId,
      ticketTypes: {
        create: ticketTypes.map((t) => ({
          name: t.name,
          priceLabel: t.priceLabel,
          priceCents: t.priceCents,
          currency: t.currency,
          total: t.total,
          remaining: t.total,
        })),
      },
      lineup: {
        create: lineupIds.map((aid, i) => ({ artistId: aid, order: i })),
      },
    },
    include: EVENT_INCLUDE,
  });
  return shape(created);
}

async function update(id, input, requesterArtistId, requesterRole) {
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) throw new NotFound('Event not found');
  const canEdit =
    requesterRole === 'admin' || existing.organizerArtistId === requesterArtistId;
  if (!canEdit) throw new Forbidden('You can only edit your own events.');

  const { ticketTypes, lineupArtistIds, flyers, socials, ...rest } = input;
  const updated = await prisma.event.update({
    where: { id },
    data: {
      ...rest,
      ...(flyers !== undefined ? { flyersJson: JSON.stringify(flyers || []) } : {}),
      ...(socials !== undefined ? { socialsJson: socials ? JSON.stringify(socials) : null } : {}),
    },
    include: EVENT_INCLUDE,
  });
  return shape(updated);
}

async function remove(id, requesterArtistId, requesterRole) {
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) throw new NotFound('Event not found');
  const canDelete =
    requesterRole === 'admin' || existing.organizerArtistId === requesterArtistId;
  if (!canDelete) throw new Forbidden('You can only delete your own events.');
  await prisma.event.delete({ where: { id } });
}

async function toggleSave(eventId, userId) {
  const key = { userId_eventId: { userId, eventId } };
  const existing = await prisma.savedEvent.findUnique({ where: key });
  if (existing) {
    await prisma.savedEvent.delete({ where: key });
    return { saved: false };
  }
  await prisma.savedEvent.create({ data: { userId, eventId } });
  return { saved: true };
}

module.exports = { list, getById, create, update, remove, toggleSave };
