/**
 * Super-admin dashboard numbers.
 *
 * Everything is computed live from ViewEvent (traffic) and ActivityLog
 * (who did what), plus snapshot counts of the core tables. Day boundaries are
 * Sri Lanka days (config.push.tzOffsetMinutes, +5:30), not server-UTC days,
 * so "today" on the dashboard means the client's today.
 *
 * Every comparison is "same time last period": the 7-day window that ends
 * now is compared with the 7-day window that ended exactly 7 days ago, so a
 * half-finished today never reads as a drop.
 */

const { Prisma } = require('@prisma/client');
const prisma = require('../../prisma');
const config = require('../../config');

const OFFSET_MIN = Number.parseInt(config.push.tzOffsetMinutes, 10) || 0;
// Server-side constants are inlined as SQL literals (never user input):
// MySQL is picky about placeholders inside INTERVAL / LIMIT / GROUP BY.
const SQL_OFFSET = Prisma.raw(String(OFFSET_MIN));
const lit = (n) => Prisma.raw(String(Math.max(1, Math.floor(Number(n)) || 1)));
const DAY_MS = 24 * 60 * 60 * 1000;
const RANGE_DAYS = { today: 1, '7d': 7, '30d': 30, '90d': 90 };

/** COUNT() → BigInt, SUM() → Decimal, missing → null. All become numbers. */
const num = (v) => (v == null ? 0 : Number(typeof v === 'object' ? v.toString() : v));

function localDay(date) {
  return new Date(date.getTime() + OFFSET_MIN * 60000).toISOString().slice(0, 10);
}

/** UTC instant of local midnight `daysAgo` days back. */
function localMidnight(daysAgo) {
  const local = new Date(Date.now() + OFFSET_MIN * 60000);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - daysAgo * DAY_MS - OFFSET_MIN * 60000);
}

function windowFor(range) {
  const days = RANGE_DAYS[range] || 7;
  const to = new Date();
  const from = localMidnight(days - 1);
  const span = days * DAY_MS;
  return {
    range,
    days,
    hourly: days === 1,
    from,
    to,
    prevFrom: new Date(from.getTime() - span),
    prevTo: new Date(to.getTime() - span),
  };
}

function bucketKeys(w) {
  if (w.hourly) {
    const day = localDay(w.from);
    return Array.from({ length: 24 }, (_, h) => `${day} ${String(h).padStart(2, '0')}`);
  }
  return Array.from({ length: w.days }, (_, i) => localDay(new Date(w.from.getTime() + i * DAY_MS + 60000)));
}

// --- period totals -----------------------------------------------------------

async function periodCounts(from, to) {
  const [views, acts, newAccounts] = await Promise.all([
    prisma.$queryRaw`
      SELECT COUNT(DISTINCT visitorId) AS visitors,
             SUM(kind = 'page')     AS pageViews,
             SUM(kind = 'event')    AS eventViews,
             SUM(kind = 'artist')   AS profileViews,
             SUM(kind = 'app_open') AS appOpens
        FROM ViewEvent
       WHERE createdAt >= ${from} AND createdAt < ${to}`,
    prisma.$queryRaw`
      SELECT SUM(action = 'auth.login')        AS logins,
             SUM(action = 'auth.login_failed') AS failedLogins,
             COUNT(DISTINCT CASE WHEN action = 'auth.login' THEN actorUserId END) AS activeUsers,
             SUM(action = 'event.create')      AS eventsCreated,
             SUM(action = 'follow.add')        AS follows,
             COUNT(*)                          AS actions
        FROM ActivityLog
       WHERE createdAt >= ${from} AND createdAt < ${to}`,
    prisma.user.count({ where: { createdAt: { gte: from, lt: to } } }),
  ]);
  const v = views[0] || {};
  const a = acts[0] || {};
  return {
    visitors: num(v.visitors),
    pageViews: num(v.pageViews),
    eventViews: num(v.eventViews),
    profileViews: num(v.profileViews),
    appOpens: num(v.appOpens),
    logins: num(a.logins),
    failedLogins: num(a.failedLogins),
    activeUsers: num(a.activeUsers),
    eventsCreated: num(a.eventsCreated),
    follows: num(a.follows),
    actions: num(a.actions),
    newAccounts,
  };
}

// --- time series -------------------------------------------------------------

async function timeSeries(w) {
  const fmt = Prisma.raw(w.hourly ? "'%Y-%m-%d %H'" : "'%Y-%m-%d'");
  const [views, acts] = await Promise.all([
    prisma.$queryRaw`
      SELECT DATE_FORMAT(DATE_ADD(createdAt, INTERVAL ${SQL_OFFSET} MINUTE), ${fmt}) AS bucket,
             COUNT(*)                   AS views,
             COUNT(DISTINCT visitorId)  AS visitors,
             SUM(kind = 'event')        AS eventViews,
             SUM(source = 'web')        AS webViews,
             SUM(source = 'app')        AS appViews
        FROM ViewEvent
       WHERE createdAt >= ${w.from} AND createdAt < ${w.to}
       GROUP BY bucket`,
    prisma.$queryRaw`
      SELECT DATE_FORMAT(DATE_ADD(createdAt, INTERVAL ${SQL_OFFSET} MINUTE), ${fmt}) AS bucket,
             SUM(action = 'auth.login')        AS logins,
             SUM(action = 'auth.login_failed') AS failedLogins,
             SUM(action = 'auth.signup')       AS signups,
             COUNT(*)                          AS actions
        FROM ActivityLog
       WHERE createdAt >= ${w.from} AND createdAt < ${w.to}
       GROUP BY bucket`,
  ]);
  const vBy = new Map(views.map((r) => [r.bucket, r]));
  const aBy = new Map(acts.map((r) => [r.bucket, r]));
  return bucketKeys(w).map((bucket) => {
    const v = vBy.get(bucket) || {};
    const a = aBy.get(bucket) || {};
    return {
      bucket,
      views: num(v.views),
      visitors: num(v.visitors),
      eventViews: num(v.eventViews),
      webViews: num(v.webViews),
      appViews: num(v.appViews),
      logins: num(a.logins),
      failedLogins: num(a.failedLogins),
      signups: num(a.signups),
      actions: num(a.actions),
    };
  });
}

// --- leaderboards -------------------------------------------------------------

function flyerOf(e) {
  if (e.bannerImageUrl) return e.bannerImageUrl;
  if (e.coverImageUrl) return e.coverImageUrl;
  try {
    const list = JSON.parse(e.flyersJson || '[]');
    return Array.isArray(list) && list[0] ? list[0] : null;
  } catch {
    return null;
  }
}

const EVENT_CARD_SELECT = {
  id: true,
  title: true,
  startsAt: true,
  status: true,
  cityName: true,
  venueName: true,
  bannerImageUrl: true,
  coverImageUrl: true,
  flyersJson: true,
  organizer: { select: { id: true, handle: true, user: { select: { name: true } } } },
};

function eventCard(e) {
  return {
    id: e.id,
    title: e.title,
    startsAt: e.startsAt,
    status: e.status,
    cityName: e.cityName,
    venueName: e.venueName,
    flyerUrl: flyerOf(e),
    organizer: e.organizer
      ? { id: e.organizer.id, handle: e.organizer.handle, name: e.organizer.user?.name || e.organizer.handle }
      : null,
  };
}

async function topEvents(from, to, limit = 8) {
  const rows = await prisma.$queryRaw`
    SELECT targetId, COUNT(*) AS views, COUNT(DISTINCT visitorId) AS visitors, SUM(source = 'app') AS appViews
      FROM ViewEvent
     WHERE kind = 'event' AND createdAt >= ${from} AND createdAt < ${to}
     GROUP BY targetId
     ORDER BY views DESC
     LIMIT ${lit(limit + 4)}`;
  if (!rows.length) return [];
  const events = await prisma.event.findMany({
    where: { id: { in: rows.map((r) => r.targetId) } },
    select: EVENT_CARD_SELECT,
  });
  const byId = new Map(events.map((e) => [e.id, e]));
  return rows
    .filter((r) => byId.has(r.targetId)) // deleted events drop off the board
    .slice(0, limit)
    .map((r) => ({
      ...eventCard(byId.get(r.targetId)),
      views: num(r.views),
      visitors: num(r.visitors),
      appViews: num(r.appViews),
    }));
}

async function topOrganizers(from, to, limit = 6) {
  const [eventRows, profileRows] = await Promise.all([
    prisma.$queryRaw`
      SELECT e.organizerArtistId AS artistId, COUNT(*) AS views
        FROM ViewEvent v
        JOIN Event e ON e.id = v.targetId
       WHERE v.kind = 'event' AND v.createdAt >= ${from} AND v.createdAt < ${to}
       GROUP BY e.organizerArtistId`,
    prisma.$queryRaw`
      SELECT targetId AS artistId, COUNT(*) AS views
        FROM ViewEvent
       WHERE kind = 'artist' AND createdAt >= ${from} AND createdAt < ${to}
       GROUP BY targetId`,
  ]);
  const reach = new Map();
  for (const r of eventRows) reach.set(r.artistId, { eventViews: num(r.views), profileViews: 0 });
  for (const r of profileRows) {
    const cur = reach.get(r.artistId) || { eventViews: 0, profileViews: 0 };
    cur.profileViews = num(r.views);
    reach.set(r.artistId, cur);
  }
  const ranked = [...reach.entries()]
    .map(([artistId, v]) => ({ artistId, ...v, total: v.eventViews + v.profileViews }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit + 4);
  if (!ranked.length) return [];
  const artists = await prisma.artist.findMany({
    where: { id: { in: ranked.map((r) => r.artistId) } },
    select: {
      id: true,
      handle: true,
      isVerified: true,
      followerCount: true,
      userId: true,
      user: { select: { name: true, avatarUrl: true } },
      _count: { select: { events: true } },
    },
  });
  const byId = new Map(artists.map((a) => [a.id, a]));
  return ranked
    .filter((r) => byId.has(r.artistId))
    .slice(0, limit)
    .map((r) => {
      const a = byId.get(r.artistId);
      return {
        id: a.id,
        userId: a.userId,
        handle: a.handle,
        name: a.user?.name || a.handle,
        avatarUrl: a.user?.avatarUrl || null,
        isVerified: a.isVerified,
        followerCount: a.followerCount,
        events: a._count.events,
        eventViews: r.eventViews,
        profileViews: r.profileViews,
        total: r.total,
      };
    });
}

async function topPages(from, to, limit = 8) {
  const rows = await prisma.$queryRaw`
    SELECT path, COUNT(*) AS views, COUNT(DISTINCT visitorId) AS visitors
      FROM ViewEvent
     WHERE kind = 'page' AND createdAt >= ${from} AND createdAt < ${to}
     GROUP BY path
     ORDER BY views DESC
     LIMIT ${lit(limit)}`;
  // `/events/<id>` and `/artists/<id>` read better as the thing's name.
  const eventIds = [];
  const artistIds = [];
  for (const r of rows) {
    const m = /^\/(events|artists)\/([^/]+)$/.exec(r.path || '');
    if (m) (m[1] === 'events' ? eventIds : artistIds).push(m[2]);
  }
  const [events, artists] = await Promise.all([
    eventIds.length
      ? prisma.event.findMany({ where: { id: { in: eventIds } }, select: { id: true, title: true } })
      : [],
    artistIds.length
      ? prisma.artist.findMany({ where: { id: { in: artistIds } }, select: { id: true, handle: true, user: { select: { name: true } } } })
      : [],
  ]);
  const names = new Map([
    ...events.map((e) => [`/events/${e.id}`, e.title]),
    ...artists.map((a) => [`/artists/${a.id}`, a.user?.name || `@${a.handle}`]),
  ]);
  return rows.map((r) => ({
    path: r.path || '/',
    label: names.get(r.path) || null,
    views: num(r.views),
    visitors: num(r.visitors),
  }));
}

async function sources(from, to) {
  const rows = await prisma.$queryRaw`
    SELECT source, COUNT(*) AS views, COUNT(DISTINCT visitorId) AS visitors
      FROM ViewEvent
     WHERE createdAt >= ${from} AND createdAt < ${to}
     GROUP BY source`;
  const by = new Map(rows.map((r) => [r.source, r]));
  return ['web', 'app'].map((source) => ({
    source,
    views: num(by.get(source)?.views),
    visitors: num(by.get(source)?.visitors),
  }));
}

// --- platform snapshot ---------------------------------------------------------

async function totals() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const [
    usersByRole,
    disabledUsers,
    artists,
    verifiedArtists,
    eventsByStatus,
    upcomingEvents,
    reels,
    guestFollows,
    accountFollows,
    devices,
    activeDevices,
    pushReady,
    allTime,
  ] = await Promise.all([
    prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
    prisma.user.count({ where: { disabledAt: { not: null } } }),
    prisma.artist.count(),
    prisma.artist.count({ where: { isVerified: true } }),
    prisma.event.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.event.count({ where: { endsAt: { gte: now }, status: { in: ['published', 'live'] } } }),
    prisma.reel.count(),
    prisma.guestFollow.count(),
    prisma.follow.count(),
    prisma.pushDevice.count(),
    prisma.pushDevice.count({ where: { lastSeenAt: { gte: weekAgo } } }),
    prisma.pushDevice.count({ where: { enabled: true, expoPushToken: { not: null } } }),
    prisma.$queryRaw`SELECT COUNT(*) AS views, COUNT(DISTINCT visitorId) AS visitors FROM ViewEvent`,
  ]);
  const roles = Object.fromEntries(usersByRole.map((r) => [r.role, r._count._all]));
  const statuses = Object.fromEntries(eventsByStatus.map((r) => [r.status, r._count._all]));
  return {
    users: {
      total: Object.values(roles).reduce((s, n) => s + n, 0),
      customers: roles.customer || 0,
      organizers: roles.artist || 0,
      admins: roles.admin || 0,
      disabled: disabledUsers,
    },
    organizers: { total: artists, verified: verifiedArtists },
    events: {
      total: Object.values(statuses).reduce((s, n) => s + n, 0),
      upcoming: upcomingEvents,
      byStatus: statuses,
    },
    reels,
    followers: { guests: guestFollows, accounts: accountFollows, total: guestFollows + accountFollows },
    devices: { total: devices, activeWeek: activeDevices, pushReady },
    allTime: { views: num(allTime[0]?.views), visitors: num(allTime[0]?.visitors) },
  };
}

const ACTOR_SELECT = { select: { id: true, name: true, email: true, role: true, avatarUrl: true } };

async function overview({ range }) {
  const w = windowFor(range);
  const liveSince = new Date(Date.now() - 5 * 60 * 1000);
  const [current, previous, series, srcs, events, organizers, pages, snapshot, live, recentActivity, recentLogins] =
    await Promise.all([
      periodCounts(w.from, w.to),
      periodCounts(w.prevFrom, w.prevTo),
      timeSeries(w),
      sources(w.from, w.to),
      topEvents(w.from, w.to),
      topOrganizers(w.from, w.to),
      topPages(w.from, w.to),
      totals(),
      prisma.$queryRaw`SELECT COUNT(DISTINCT visitorId) AS visitors FROM ViewEvent WHERE createdAt >= ${liveSince}`,
      prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 14, include: { actor: ACTOR_SELECT } }),
      prisma.activityLog.findMany({
        where: { action: { in: ['auth.login', 'auth.login_failed'] } },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { actor: ACTOR_SELECT },
      }),
    ]);

  return {
    range: w.range,
    generatedAt: new Date().toISOString(),
    window: { from: w.from, to: w.to, hourly: w.hourly, days: w.days },
    current,
    previous,
    series,
    sources: srcs,
    topEvents: events,
    topOrganizers: organizers,
    topPages: pages,
    totals: snapshot,
    live: { visitors: num(live[0]?.visitors) },
    recentActivity,
    recentLogins,
  };
}

/** View totals for a set of events (admin events table + user detail). */
async function viewsForEvents(ids) {
  if (!ids.length) return new Map();
  const rows = await prisma.$queryRaw`
    SELECT targetId, COUNT(*) AS views, COUNT(DISTINCT visitorId) AS visitors
      FROM ViewEvent
     WHERE kind = 'event' AND targetId IN (${Prisma.join(ids)})
     GROUP BY targetId`;
  return new Map(rows.map((r) => [r.targetId, { views: num(r.views), visitors: num(r.visitors) }]));
}

module.exports = { overview, viewsForEvents, windowFor, flyerOf, EVENT_CARD_SELECT, eventCard, ACTOR_SELECT };
