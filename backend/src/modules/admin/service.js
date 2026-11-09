/**
 * Super-admin operations: account management, event moderation, audit log.
 *
 * "Super admin" is the existing `admin` role — the mobile app and the events
 * / tickets services already treat it as "may act on anything", so no new
 * role (and no enum migration) is needed.
 *
 * Guard rails that hold no matter what the UI sends:
 *   - an admin can't suspend, demote or delete themselves;
 *   - the last active admin can't be suspended, demoted or deleted.
 */

const prisma = require('../../prisma');
const { hash } = require('../../lib/password');
const { BadRequest, Conflict, NotFound } = require('../../lib/errors');
const reports = require('./reports');

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  phone: true,
  city: true,
  avatarUrl: true,
  role: true,
  lastLoginAt: true,
  loginCount: true,
  disabledAt: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  artist: {
    select: {
      id: true,
      handle: true,
      category: true,
      bio: true,
      isVerified: true,
      isPreferred: true,
      followerCount: true,
      socialsJson: true,
      _count: { select: { events: true, reels: true } },
    },
  },
  _count: { select: { tickets: true, follows: true } },
};

/** `{ facebook, instagram, tiktok }` to stored JSON, dropping blanks. */
function socialsJsonOf(socials) {
  if (!socials) return null;
  const clean = Object.fromEntries(Object.entries(socials).filter(([, v]) => typeof v === 'string' && v.trim()));
  return Object.keys(clean).length ? JSON.stringify(clean) : null;
}

/** Shape the console reads: socialsJson parsed into `socials`. */
function shapeUser(user) {
  if (!user?.artist) return user;
  const { socialsJson, ...artist } = user.artist;
  let socials = null;
  try { socials = socialsJson ? JSON.parse(socialsJson) : null; } catch { socials = null; }
  return { ...user, artist: { ...artist, socials } };
}

// --- users -------------------------------------------------------------------

function userWhere({ q, role, status }) {
  const where = {};
  if (role) where.role = role;
  if (status === 'disabled') where.disabledAt = { not: null };
  if (status === 'active') where.disabledAt = null;
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
      { phone: { contains: q } },
      { artist: { handle: { contains: q.replace(/^@/, '') } } },
    ];
  }
  return where;
}

const USER_ORDER = {
  newest: [{ createdAt: 'desc' }],
  last_login: [{ lastLoginAt: 'desc' }, { createdAt: 'desc' }], // MySQL sorts NULLs last on DESC
  most_logins: [{ loginCount: 'desc' }, { createdAt: 'desc' }],
  name: [{ name: 'asc' }],
};

async function listUsers(query) {
  const where = userWhere(query);
  const [items, total, roleCounts] = await Promise.all([
    prisma.user.findMany({
      where,
      select: USER_SELECT,
      orderBy: USER_ORDER[query.sort] || USER_ORDER.newest,
      take: query.take,
      skip: query.skip,
    }),
    prisma.user.count({ where }),
    prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
  ]);
  return {
    items: items.map(shapeUser),
    total,
    counts: Object.fromEntries(roleCounts.map((r) => [r.role, r._count._all])),
  };
}

async function getUser(id) {
  const user = await prisma.user.findUnique({ where: { id }, select: USER_SELECT });
  if (!user) throw new NotFound('User not found');

  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [activity, failedLogins, events, createdBy] = await Promise.all([
    prisma.activityLog.findMany({
      where: { OR: [{ actorUserId: id }, { targetType: 'user', targetId: id }] },
      orderBy: { createdAt: 'desc' },
      take: 40,
      include: { actor: reports.ACTOR_SELECT },
    }),
    prisma.activityLog.count({
      where: { action: 'auth.login_failed', actorEmail: user.email, createdAt: { gte: monthAgo } },
    }),
    user.artist
      ? prisma.event.findMany({
          where: { organizerArtistId: user.artist.id },
          orderBy: { startsAt: 'desc' },
          take: 30,
          select: reports.EVENT_CARD_SELECT,
        })
      : [],
    user.createdById
      ? prisma.user.findUnique({ where: { id: user.createdById }, select: { id: true, name: true } })
      : null,
  ]);
  const views = await reports.viewsForEvents(events.map((e) => e.id));
  return {
    user: shapeUser(user),
    createdBy,
    failedLoginsLast30d: failedLogins,
    activity,
    events: events.map((e) => ({ ...reports.eventCard(e), ...(views.get(e.id) || { views: 0, visitors: 0 }) })),
  };
}

async function assertHandleFree(handle, exceptArtistId) {
  const clash = await prisma.artist.findUnique({ where: { handle }, select: { id: true } });
  if (clash && clash.id !== exceptArtistId) throw new Conflict(`The handle @${handle} is already taken.`);
}

async function createUser(input, adminId) {
  const exists = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (exists) throw new Conflict('An account with that email already exists.');
  const organizer = input.role === 'artist' ? input.organizer : null;
  if (organizer) await assertHandleFree(organizer.handle);

  const passwordHash = await hash(input.password);
  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        phone: input.phone || null,
        avatarUrl: input.avatarUrl || null,
        role: input.role,
        createdById: adminId,
      },
    });
    if (organizer) {
      await tx.artist.create({
        data: {
          userId: user.id,
          handle: organizer.handle,
          category: organizer.category || null,
          bio: organizer.bio || null,
          isVerified: !!organizer.isVerified,
          isPreferred: !!organizer.isPreferred,
          socialsJson: socialsJsonOf(organizer.socials),
        },
      });
    }
    return user;
  });
  return shapeUser(await prisma.user.findUnique({ where: { id: created.id }, select: USER_SELECT }));
}

async function activeAdminCount() {
  return prisma.user.count({ where: { role: 'admin', disabledAt: null } });
}

/** Throws when the change would lock the platform out of its own console. */
async function guardAdminChange(target, adminId, { demote, disable, remove }) {
  const self = target.id === adminId;
  if (self && remove) throw new BadRequest("You can't delete your own account.");
  if (self && disable) throw new BadRequest("You can't suspend your own account.");
  if (self && demote) throw new BadRequest("You can't change your own role.");
  if (target.role === 'admin' && !target.disabledAt && (demote || disable || remove)) {
    if ((await activeAdminCount()) <= 1) {
      throw new Conflict('This is the only active super admin. Create another one first.');
    }
  }
}

async function updateUser(id, input, adminId) {
  const target = await prisma.user.findUnique({ where: { id }, include: { artist: true } });
  if (!target) throw new NotFound('User not found');

  const demote = input.role !== undefined && target.role === 'admin' && input.role !== 'admin';
  const disable = input.disabled === true && !target.disabledAt;
  await guardAdminChange(target, adminId, { demote, disable });

  if (input.email && input.email !== target.email) {
    const clash = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
    if (clash) throw new Conflict('An account with that email already exists.');
  }

  // Becoming an organizer needs an organizer profile to publish under.
  const org = input.organizer || null;
  const needsProfile = input.role === 'artist' && !target.artist;
  if (needsProfile && !org?.handle) {
    throw new BadRequest('Give the organizer a public handle.', {
      details: [{ path: 'organizer.handle', message: 'Required for organizer accounts' }],
    });
  }
  if (org?.handle) await assertHandleFree(org.handle, target.artist?.id);

  const changed = [];
  const data = {};
  for (const key of ['name', 'email', 'phone', 'avatarUrl', 'role']) {
    if (input[key] !== undefined && input[key] !== target[key]) {
      data[key] = input[key];
      changed.push(key);
    }
  }
  if (input.disabled !== undefined && input.disabled !== !!target.disabledAt) {
    data.disabledAt = input.disabled ? new Date() : null;
    changed.push(input.disabled ? 'suspended' : 'reactivated');
  }

  await prisma.$transaction(async (tx) => {
    if (Object.keys(data).length) await tx.user.update({ where: { id }, data });
    if (org) {
      const orgData = {};
      for (const key of ['handle', 'category', 'bio', 'isVerified', 'isPreferred']) {
        if (org[key] !== undefined) orgData[key] = org[key];
      }
      if (org.socials !== undefined) orgData.socialsJson = socialsJsonOf(org.socials);
      if (target.artist) {
        const diff = Object.keys(orgData).filter((k) => (orgData[k] ?? null) !== (target.artist[k] ?? null));
        if (diff.length) {
          await tx.artist.update({ where: { id: target.artist.id }, data: orgData });
          changed.push(...diff.map((k) => `organizer.${k === 'socialsJson' ? 'socials' : k}`));
        }
      } else if (orgData.handle) {
        await tx.artist.create({ data: { userId: id, ...orgData } });
        changed.push('organizer.created');
      }
    }
  });

  const user = shapeUser(await prisma.user.findUnique({ where: { id }, select: USER_SELECT }));
  return { user, changed, before: target };
}

async function resetPassword(id, password) {
  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true } });
  if (!target) throw new NotFound('User not found');
  await prisma.user.update({ where: { id }, data: { passwordHash: await hash(password) } });
  return target;
}

async function deleteUser(id, adminId) {
  const target = await prisma.user.findUnique({ where: { id }, include: { artist: { select: { id: true, handle: true } } } });
  if (!target) throw new NotFound('User not found');
  await guardAdminChange(target, adminId, { remove: true });
  // Cascades: organizer profile → their events, reels, follows.
  await prisma.user.delete({ where: { id } });
  return target;
}

// --- organizers ----------------------------------------------------------------

/** Picker data for "publish this event as": small, searchable, newest first. */
async function listOrganizers({ q, id, take }) {
  const handle = q ? q.replace(/^@/, '') : null;
  const rows = await prisma.artist.findMany({
    where: id
      ? { id }
      : q
        ? { OR: [{ handle: { contains: handle } }, { user: { name: { contains: q } } }, { user: { email: { contains: q } } }] }
        : {},
    orderBy: { createdAt: 'desc' },
    take,
    select: {
      id: true,
      handle: true,
      category: true,
      isVerified: true,
      followerCount: true,
      userId: true,
      user: { select: { name: true, avatarUrl: true, disabledAt: true } },
      _count: { select: { events: true } },
    },
  });
  return rows.map((a) => ({
    id: a.id,
    userId: a.userId,
    handle: a.handle,
    name: a.user?.name || a.handle,
    avatarUrl: a.user?.avatarUrl || null,
    category: a.category,
    isVerified: a.isVerified,
    suspended: !!a.user?.disabledAt,
    followerCount: a.followerCount,
    events: a._count.events,
  }));
}

// --- events -------------------------------------------------------------------

async function listEvents(query) {
  const now = new Date();
  const where = {};
  if (query.status) where.status = query.status;
  if (query.organizerId) where.organizerArtistId = query.organizerId;
  if (query.when === 'upcoming') where.endsAt = { gte: now };
  if (query.when === 'past') where.endsAt = { lt: now };
  if (query.q) {
    where.OR = [
      { title: { contains: query.q } },
      { venueName: { contains: query.q } },
      { cityName: { contains: query.q } },
      { organizer: { handle: { contains: query.q.replace(/^@/, '') } } },
      { organizer: { user: { name: { contains: query.q } } } },
    ];
  }
  const [rows, total, statusCounts] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { startsAt: query.when === 'upcoming' ? 'asc' : 'desc' },
      take: query.take,
      skip: query.skip,
      select: { ...reports.EVENT_CARD_SELECT, createdAt: true, updatedAt: true, ticketUrl: true, _count: { select: { savedBy: true, tickets: true } } },
    }),
    prisma.event.count({ where }),
    prisma.event.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);
  const views = await reports.viewsForEvents(rows.map((r) => r.id));
  return {
    total,
    counts: Object.fromEntries(statusCounts.map((r) => [r.status, r._count._all])),
    items: rows.map((r) => ({
      ...reports.eventCard(r),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      hasTicketLink: !!r.ticketUrl,
      saves: r._count.savedBy,
      reservations: r._count.tickets,
      ...(views.get(r.id) || { views: 0, visitors: 0 }),
    })),
  };
}

async function setEventStatus(id, status) {
  const before = await prisma.event.findUnique({ where: { id }, select: { id: true, title: true, status: true } });
  if (!before) throw new NotFound('Event not found');
  await prisma.event.update({ where: { id }, data: { status } });
  return before;
}

async function deleteEvent(id) {
  const before = await prisma.event.findUnique({ where: { id }, select: { id: true, title: true } });
  if (!before) throw new NotFound('Event not found');
  await prisma.event.delete({ where: { id } });
  return before;
}

// --- activity log ---------------------------------------------------------------

async function listActivity(query) {
  const where = {};
  if (query.range !== 'all') where.createdAt = { gte: reports.windowFor(query.range).from };
  const scoped = { ...where }; // facets ignore the category/action filter
  if (query.category) where.action = { startsWith: `${query.category}.` };
  if (query.action) where.action = query.action;
  if (query.actorId) {
    where.actorUserId = query.actorId;
    scoped.actorUserId = query.actorId;
  }
  if (query.q) {
    const OR = [{ summary: { contains: query.q } }, { actorEmail: { contains: query.q } }, { ip: { contains: query.q } }];
    where.OR = OR;
    scoped.OR = OR;
  }
  const [items, total, facets] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.take,
      skip: query.skip,
      include: { actor: reports.ACTOR_SELECT },
    }),
    prisma.activityLog.count({ where }),
    prisma.activityLog.groupBy({ by: ['action'], where: scoped, _count: { _all: true } }),
  ]);
  return {
    items,
    total,
    facets: Object.fromEntries(facets.map((f) => [f.action, f._count._all])),
  };
}

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  resetPassword,
  deleteUser,
  listOrganizers,
  listEvents,
  setEventStatus,
  deleteEvent,
  listActivity,
};
