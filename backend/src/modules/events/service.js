const prisma = require('../../prisma');
const { NotFound, Forbidden, BadRequest } = require('../../lib/errors');
const push = require('../notifications/service');

// Edits that followers actually care about. Tweaking the description or
// swapping a flyer is not worth waking someone's phone; moving the date,
// renaming the show, or announcing the venue is.
const PUSHWORTHY_FIELDS = ['title', 'startsAt', 'venueName', 'cityName', 'ticketUrl', 'startTimeTba'];

function hasPushworthyChange(before, after) {
  return PUSHWORTHY_FIELDS.some((field) => {
    const a = before[field];
    const b = after[field];
    if (a instanceof Date || b instanceof Date) {
      return new Date(a || 0).getTime() !== new Date(b || 0).getTime();
    }
    return (a ?? null) !== (b ?? null);
  });
}

const EVENT_INCLUDE = {
  ticketTypes: { orderBy: { createdAt: 'asc' } },
  lineup: {
    include: {
      artist: {
        select: {
          id: true,
          handle: true,
          socialsJson: true,
          user: { select: { name: true, avatarUrl: true } },
        },
      },
    },
  },
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
  // Refund / cancellation policies are no longer part of the product — drop
  // them from the API contract so legacy rows stop leaking them to the app.
  // eslint-disable-next-line no-unused-vars
  const { refundPolicy, cancellationPolicy, ...event } = row;
  return {
    ...event,
    geo: row.geoLat != null && row.geoLng != null
      ? { lat: row.geoLat, lng: row.geoLng }
      : null,
    flyers: safeParse(row.flyersJson, []),
    socials: safeParse(row.socialsJson, null),
    organizer: row.organizer
      ? { ...row.organizer, socials: safeParse(row.organizer.socialsJson, null) }
      : row.organizer,
    storylineReelIds: (row.linkedReels || []).map((r) => r.id),
    lineup: buildLineup(row),
    isSaved,
  };
}

/**
 * Lineup display list. Free-form `lineupJson` (artists the manager typed in,
 * each with their own socials) takes precedence; otherwise we fall back to the
 * relational lineup (registered artist accounts, socials from their profile).
 *
 * The organizer is never part of the displayed lineup. Events used to be
 * created with the organising company as their own lineup entry, so an event
 * with no artists announced showed the company's name under "Line Up" — the
 * guest side now shows "Line up revealed soon" instead (client feedback
 * 2026-08-10). Legacy rows still carry that entry, hence the filter here.
 */
function buildLineup(row) {
  // No role labels at all — "Support" went first, then "Headliner" (client
  // feedback 2026-07-26). The lineup is just names; order carries the billing.
  const free = safeParse(row.lineupJson, null);
  if (Array.isArray(free) && free.length) {
    return free.map((a, idx) => ({
      id: `g${idx}`,
      name: a?.name || 'Artist',
      avatarUrl: a?.avatarUrl || null,
      role: '',
      socials: a?.socials || null,
    }));
  }
  return (row.lineup || [])
    .filter((entry) => (entry.artist?.id || entry.artistId) !== row.organizerArtistId)
    .map((entry) => ({
      id: entry.artist?.id || entry.artistId,
      name: entry.artist?.user?.name || entry.artist?.handle || 'Artist',
      avatarUrl: entry.artist?.user?.avatarUrl || null,
      role: '',
      socials: safeParse(entry.artist?.socialsJson, null),
    }));
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
            // Match the event company too, so searching a company name (or a
            // town like "Ella") surfaces that organizer's events.
            { organizer: { handle: { contains: search } } },
            { organizer: { user: { name: { contains: search } } } },
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
  const { ticketTypes, lineupArtistIds, lineup, flyers, socials, ...rest } = input;
  // Only artists explicitly put on the bill get a lineup entry. The organizer
  // used to be added to their own lineup, which surfaced the company name as
  // a performing artist on events with nothing announced yet.
  const lineupIds = lineupArtistIds;

  const created = await prisma.event.create({
    data: {
      ...rest,
      ...(flyers !== undefined ? { flyersJson: JSON.stringify(flyers || []) } : {}),
      ...(socials !== undefined ? { socialsJson: socials ? JSON.stringify(socials) : null } : {}),
      ...(lineup !== undefined ? { lineupJson: lineup && lineup.length ? JSON.stringify(lineup) : null } : {}),
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

  // Announce it to the company's followers. Fire-and-forget: a push outage
  // must never turn a successful publish into a failed save. The scheduler
  // re-runs the same dedupe key later, so a miss here is caught up, not lost.
  if (['published', 'live'].includes(created.status)) {
    push.dispatchEventAsync(created.id, push.TYPES.PUBLISHED);
  }

  return shape(created);
}

async function update(id, input, requesterArtistId, requesterRole) {
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) throw new NotFound('Event not found');
  const canEdit =
    requesterRole === 'admin' || existing.organizerArtistId === requesterArtistId;
  if (!canEdit) throw new Forbidden('You can only edit your own events.');

  const { ticketTypes, lineupArtistIds, lineup, flyers, socials, ...rest } = input;

  // Editing a published event may change ticket types (organizers adjust
  // prices / add categories post-publish). Match rows in order: update the
  // ones that exist, create extras, delete surplus.
  if (ticketTypes !== undefined) {
    const existingTts = await prisma.ticketType.findMany({
      where: { eventId: id },
      orderBy: { createdAt: 'asc' },
    });
    const ops = [];
    ticketTypes.forEach((t, i) => {
      if (existingTts[i]) {
        ops.push(
          prisma.ticketType.update({
            where: { id: existingTts[i].id },
            data: {
              name: t.name,
              priceLabel: t.priceLabel,
              priceCents: t.priceCents,
              currency: t.currency,
            },
          }),
        );
      } else {
        ops.push(
          prisma.ticketType.create({
            data: {
              eventId: id,
              name: t.name,
              priceLabel: t.priceLabel,
              priceCents: t.priceCents,
              currency: t.currency,
              total: t.total,
              remaining: t.total,
            },
          }),
        );
      }
    });
    existingTts
      .slice(ticketTypes.length)
      .forEach((tt) => ops.push(prisma.ticketType.delete({ where: { id: tt.id } })));
    if (ops.length) await prisma.$transaction(ops);
  }

  const updated = await prisma.event.update({
    where: { id },
    data: {
      ...rest,
      ...(flyers !== undefined ? { flyersJson: JSON.stringify(flyers || []) } : {}),
      ...(socials !== undefined ? { socialsJson: socials ? JSON.stringify(socials) : null } : {}),
      ...(lineup !== undefined ? { lineupJson: lineup && lineup.length ? JSON.stringify(lineup) : null } : {}),
    },
    include: EVENT_INCLUDE,
  });

  const wasPublic = ['published', 'live'].includes(existing.status);
  const isPublic = ['published', 'live'].includes(updated.status);
  if (updated.status === 'cancelled' && wasPublic) {
    push.dispatchEventAsync(updated.id, push.TYPES.CANCELLED);
  } else if (isPublic && !wasPublic) {
    // Draft → published is an announcement, not an edit.
    push.dispatchEventAsync(updated.id, push.TYPES.PUBLISHED);
  } else if (isPublic && hasPushworthyChange(existing, updated)) {
    push.dispatchEventAsync(updated.id, push.TYPES.UPDATED);
  }

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
