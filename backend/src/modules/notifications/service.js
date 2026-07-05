const prisma = require('../../prisma');

const DAY_MS = 24 * 3600 * 1000;

function startOfUtcDay(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Whole-day difference between two dates (event day minus today). */
function daysUntil(eventStart, now) {
  return Math.round((startOfUtcDay(eventStart) - startOfUtcDay(now)) / DAY_MS);
}

/**
 * Build a reminder feed for events happening within the next `windowDays`
 * days (default 5 — per client feedback, 2 days' notice was too short).
 * Every event due in 1..windowDays days yields one reminder item, and each
 * item carries the organizer (event company) name so alerts always read
 * "<Company> · <Event>".
 *
 * `viewerUserId` (optional) is used to prioritise the viewer's saved events;
 * guests simply get reminders for all upcoming published events.
 */
async function feed(viewerUserId, { windowDays = 5 } = {}) {
  const now = new Date();
  const horizon = new Date(now.getTime() + (windowDays + 1) * DAY_MS);

  const events = await prisma.event.findMany({
    where: {
      status: { in: ['published', 'live'] },
      startsAt: { gt: now, lt: horizon },
    },
    orderBy: { startsAt: 'asc' },
    select: {
      id: true,
      title: true,
      startsAt: true,
      venueName: true,
      cityName: true,
      coverColor: true,
      bannerImageUrl: true,
      organizer: {
        select: {
          id: true,
          handle: true,
          user: { select: { name: true, avatarUrl: true } },
        },
      },
    },
  });

  let savedSet = new Set();
  if (viewerUserId && events.length) {
    const saved = await prisma.savedEvent.findMany({
      where: { userId: viewerUserId, eventId: { in: events.map((e) => e.id) } },
      select: { eventId: true },
    });
    savedSet = new Set(saved.map((s) => s.eventId));
  }

  const items = [];
  for (const e of events) {
    const d = daysUntil(e.startsAt, now);
    if (d < 1 || d > windowDays) continue;
    const kind = `T-${d}`;
    const companyName = e.organizer?.user?.name || e.organizer?.handle || null;
    const prefix = d === 1 ? 'Tomorrow' : `In ${d} days`;
    items.push({
      id: `${e.id}-${kind}`,
      eventId: e.id,
      kind,
      daysUntil: d,
      title: e.title,
      companyName,
      companyId: e.organizer?.id || null,
      companyAvatarUrl: e.organizer?.user?.avatarUrl || null,
      startsAt: e.startsAt,
      venueName: e.venueName,
      cityName: e.cityName,
      coverColor: e.coverColor,
      bannerImageUrl: e.bannerImageUrl,
      saved: savedSet.has(e.id),
      message: `${prefix}: ${companyName ? `${companyName} · ` : ''}${e.title} at ${e.venueName}`,
    });
  }

  // Saved events first, then soonest.
  items.sort((a, b) => {
    if (a.saved !== b.saved) return a.saved ? -1 : 1;
    return new Date(a.startsAt) - new Date(b.startsAt);
  });

  return { items, total: items.length };
}

module.exports = { feed };
