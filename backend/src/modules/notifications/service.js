const crypto = require('crypto');
const prisma = require('../../prisma');
const config = require('../../config');
const {
  isExpoPushToken,
  sendPushMessages,
  getPushReceipts,
  isPermanentTokenError,
} = require('../../lib/expo-push');
const builder = require('./builder');

const { TYPES } = builder;
const DAY_MS = 24 * 3600 * 1000;

// Devices that haven't opened the app in this long can't have an up-to-date
// local reminder schedule, so the server covers them remotely. See
// "Who owns reminders" in docs/PUSH-NOTIFICATIONS.md.
const STALE_DEVICE_DAYS = parseInt(process.env.PUSH_STALE_DEVICE_DAYS || '3', 10);

/** Everything the copy builder needs off an Event row. */
const EVENT_PUSH_SELECT = {
  id: true,
  title: true,
  startsAt: true,
  startTimeTba: true,
  status: true,
  venueName: true,
  cityName: true,
  coverColor: true,
  bannerImageUrl: true,
  organizerArtistId: true,
  createdAt: true,
  updatedAt: true,
  organizer: {
    select: {
      id: true,
      handle: true,
      user: { select: { name: true, avatarUrl: true } },
    },
  },
};

function log(...args) {
  // eslint-disable-next-line no-console
  console.log('[push]', ...args);
}

// -----------------------------------------------------------------------------
// Device registry
// -----------------------------------------------------------------------------

/**
 * Register (or refresh) an install's push address.
 *
 * Called on every app boot, so it doubles as the "device is alive" heartbeat
 * that `lastSeenAt` — and therefore the stale-device reminder fallback —
 * depends on.
 *
 * A token can migrate between installs (reinstall mints a new deviceId while
 * FCM hands back the same token), so we detach it from any other row first;
 * otherwise two devices would both claim it and one would get double alerts.
 */
async function registerDevice({ deviceId, expoPushToken, platform, appVersion, enabled }, userId) {
  const token = expoPushToken && isExpoPushToken(expoPushToken) ? expoPushToken : null;
  if (expoPushToken && !token) {
    log('rejected malformed token for device', deviceId);
  }

  if (token) {
    await prisma.pushDevice.updateMany({
      where: { expoPushToken: token, deviceId: { not: deviceId } },
      data: { expoPushToken: null },
    });
  }

  const common = {
    platform: platform || undefined,
    appVersion: appVersion || undefined,
    userId: userId || null,
    lastSeenAt: new Date(),
  };

  const device = await prisma.pushDevice.upsert({
    where: { deviceId },
    create: {
      deviceId,
      expoPushToken: token,
      enabled: enabled !== false,
      ...common,
    },
    update: {
      // A boot with no token (permission not granted yet) must not wipe a
      // token we already hold — only an explicit disable does that.
      ...(token ? { expoPushToken: token, failureCount: 0 } : {}),
      ...(enabled === undefined ? {} : { enabled }),
      ...common,
    },
  });

  return publicDevice(device);
}

async function setDeviceEnabled(deviceId, enabled) {
  const device = await prisma.pushDevice.upsert({
    where: { deviceId },
    create: { deviceId, enabled, lastSeenAt: new Date() },
    update: { enabled, lastSeenAt: new Date(), ...(enabled ? { failureCount: 0 } : {}) },
  });
  return publicDevice(device);
}

async function getDevice(deviceId) {
  const device = await prisma.pushDevice.findUnique({ where: { deviceId } });
  return device ? publicDevice(device) : null;
}

/** Never leak the raw push token back to a client that didn't send it. */
function publicDevice(device) {
  return {
    deviceId: device.deviceId,
    enabled: device.enabled,
    hasToken: !!device.expoPushToken,
    platform: device.platform,
    appVersion: device.appVersion,
    lastSeenAt: device.lastSeenAt,
  };
}

/** Retire a token that Expo told us will never work again. */
async function retireToken(deviceId, reason) {
  await prisma.pushDevice.updateMany({
    where: { deviceId },
    data: { expoPushToken: null, failureCount: 0 },
  });
  log('retired token for', deviceId, '-', reason);
}

// -----------------------------------------------------------------------------
// Audience
// -----------------------------------------------------------------------------

/**
 * Push targets for an organizer: every install that follows them.
 *
 * Guests follow by device id (GuestFollow); logged-in managers follow by user
 * id (Follow). Both funnel into the same PushDevice table, so one query
 * covers "everyone who asked to hear from this company".
 *
 * @param {string} artistId
 * @param {{ staleOnly?: boolean }} [opts] `staleOnly` restricts to installs
 *   that haven't opened the app recently — used for reminder fallback, since
 *   active installs schedule those locally on device.
 */
async function audienceDevices(artistId, { staleOnly = false } = {}) {
  const [guestFollows, userFollows] = await Promise.all([
    prisma.guestFollow.findMany({ where: { artistId }, select: { deviceId: true } }),
    prisma.follow.findMany({ where: { artistId }, select: { followerId: true } }),
  ]);

  const or = [];
  if (guestFollows.length) or.push({ deviceId: { in: guestFollows.map((f) => f.deviceId) } });
  if (userFollows.length) or.push({ userId: { in: userFollows.map((f) => f.followerId) } });
  if (!or.length) return [];

  const where = {
    enabled: true,
    expoPushToken: { not: null },
    failureCount: { lt: config.push.maxFailures },
    OR: or,
  };
  if (staleOnly) {
    where.lastSeenAt = { lt: new Date(Date.now() - STALE_DEVICE_DAYS * DAY_MS) };
  }

  return prisma.pushDevice.findMany({
    where,
    select: { deviceId: true, expoPushToken: true, platform: true },
  });
}

// -----------------------------------------------------------------------------
// Delivery
// -----------------------------------------------------------------------------

/**
 * Send one notification to a set of devices, exactly once each, ever.
 *
 * The ledger row is claimed *before* the send: we insert rows with ids we
 * generated, `skipDuplicates` drops the ones already claimed, and reading back
 * our own ids tells us precisely which devices this process won the right to
 * notify. That's what makes the 5-minute sweep and the inline publish hook
 * safe to race each other.
 *
 * @returns {{ sent: number, skipped: number, failed: number }}
 */
async function deliver(devices, note, { eventId = null } = {}) {
  const stats = { sent: 0, skipped: 0, failed: 0 };
  if (!config.push.enabled || !devices.length) return stats;

  const claims = devices.map((d) => ({
    id: crypto.randomUUID(),
    deviceId: d.deviceId,
    dedupeKey: note.dedupeKey,
    eventId,
    status: 'sent',
  }));

  await prisma.notificationDelivery.createMany({ data: claims, skipDuplicates: true });

  const won = await prisma.notificationDelivery.findMany({
    where: { id: { in: claims.map((c) => c.id) } },
    select: { id: true, deviceId: true },
  });
  stats.skipped = devices.length - won.length;
  if (!won.length) return stats;

  const byDeviceId = new Map(devices.map((d) => [d.deviceId, d]));
  const targets = won
    .map((row) => ({ row, device: byDeviceId.get(row.deviceId) }))
    .filter((t) => t.device?.expoPushToken);

  const results = await sendPushMessages(
    targets.map((t) => ({
      to: t.device.expoPushToken,
      title: note.title,
      body: note.body,
      data: note.data,
      sound: 'default',
      channelId: note.channelId,
      priority: 'high',
      // A reminder that arrives after the event has started is noise — let
      // Expo/FCM drop anything it couldn't deliver within a day.
      ttl: 24 * 3600,
    })),
  );

  const okIds = [];
  const retryIds = [];
  const failedRows = [];

  results.forEach((result, i) => {
    const { row, device } = targets[i];
    if (result.status === 'ok') {
      okIds.push({ id: row.id, ticketId: result.id, deviceId: device.deviceId });
      stats.sent += 1;
      return;
    }
    stats.failed += 1;
    if (isPermanentTokenError(result.error)) {
      failedRows.push({ id: row.id, error: result.error });
      retireToken(device.deviceId, result.error).catch(() => {});
    } else if (result.error === 'TransportError' || result.error === 'MessageRateExceeded') {
      // Not the device's fault — drop the claim so the next sweep retries.
      retryIds.push(row.id);
    } else {
      failedRows.push({ id: row.id, error: result.error });
      prisma.pushDevice
        .updateMany({ where: { deviceId: device.deviceId }, data: { failureCount: { increment: 1 } } })
        .catch(() => {});
    }
  });

  await Promise.all([
    ...okIds.map(({ id, ticketId }) =>
      prisma.notificationDelivery.update({ where: { id }, data: { ticketId } }).catch(() => {}),
    ),
    okIds.length
      ? prisma.pushDevice
          .updateMany({
            where: { deviceId: { in: okIds.map((o) => o.deviceId) } },
            data: { failureCount: 0 },
          })
          .catch(() => {})
      : null,
    retryIds.length
      ? prisma.notificationDelivery.deleteMany({ where: { id: { in: retryIds } } }).catch(() => {})
      : null,
    ...failedRows.map(({ id, error }) =>
      prisma.notificationDelivery
        .update({ where: { id }, data: { status: 'failed', error } })
        .catch(() => {}),
    ),
  ]);

  return stats;
}

// -----------------------------------------------------------------------------
// Dispatchers — the things that decide *what* gets sent
// -----------------------------------------------------------------------------

/**
 * Announce one event to the company's followers.
 *
 * Called inline from the events module the moment a manager publishes or
 * edits, and again by the sweep as a safety net. Both go through the same
 * dedupe key, so whichever gets there first wins and the other no-ops.
 *
 * Failures are swallowed: a push problem must never fail the manager's save.
 */
async function dispatchEvent(eventId, type) {
  try {
    if (!config.push.enabled) return { sent: 0, skipped: 0, failed: 0 };
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: EVENT_PUSH_SELECT,
    });
    if (!event) return { sent: 0, skipped: 0, failed: 0 };

    // Nothing to announce about an event that has already happened.
    if (type !== TYPES.CANCELLED && new Date(event.startsAt) <= new Date()) {
      return { sent: 0, skipped: 0, failed: 0 };
    }
    if (type !== TYPES.CANCELLED && !['published', 'live'].includes(event.status)) {
      return { sent: 0, skipped: 0, failed: 0 };
    }

    const note = builder.notification(type, event);
    const devices = await audienceDevices(event.organizerArtistId);
    const stats = await deliver(devices, note, { eventId: event.id });
    if (stats.sent) log(type, event.id, `→ ${stats.sent} device(s)`);
    return stats;
  } catch (err) {
    log('dispatchEvent failed', eventId, type, err.message);
    return { sent: 0, skipped: 0, failed: 0 };
  }
}

/** Fire-and-forget wrapper for call sites that must not await push I/O. */
function dispatchEventAsync(eventId, type) {
  setImmediate(() => {
    dispatchEvent(eventId, type).catch(() => {});
  });
}

/**
 * Catch-up sweep for announcements. Covers events published while the process
 * was down (deploy, restart, crash) — the inline hook would have been missed,
 * and the dedupe key means already-announced events cost one indexed lookup.
 */
async function dispatchPendingPublishes() {
  const since = new Date(Date.now() - config.push.publishCatchupHours * 3600 * 1000);
  const events = await prisma.event.findMany({
    where: {
      status: { in: ['published', 'live'] },
      createdAt: { gt: since },
      startsAt: { gt: new Date() },
    },
    select: EVENT_PUSH_SELECT,
  });

  const totals = { sent: 0, skipped: 0, failed: 0 };
  for (const event of events) {
    const note = builder.notification(TYPES.PUBLISHED, event);
    // eslint-disable-next-line no-await-in-loop
    const devices = await audienceDevices(event.organizerArtistId);
    // eslint-disable-next-line no-await-in-loop
    const stats = await deliver(devices, note, { eventId: event.id });
    totals.sent += stats.sent;
    totals.skipped += stats.skipped;
    totals.failed += stats.failed;
  }
  return totals;
}

/**
 * T-minus reminders, remote edition.
 *
 * Active installs schedule these locally on device (no server, no Firebase,
 * survives reboot), so this only targets installs that have gone quiet long
 * enough that their local schedule can't include recently announced events.
 */
async function dispatchReminders({ includeActiveDevices = false } = {}) {
  const days = config.push.reminderDays;
  if (!days.length) return { sent: 0, skipped: 0, failed: 0 };

  const now = new Date();
  const horizon = new Date(now.getTime() + (Math.max(...days) + 1) * DAY_MS);
  const events = await prisma.event.findMany({
    where: {
      status: { in: ['published', 'live'] },
      startsAt: { gt: now, lt: horizon },
    },
    orderBy: { startsAt: 'asc' },
    select: EVENT_PUSH_SELECT,
  });

  const totals = { sent: 0, skipped: 0, failed: 0 };
  for (const event of events) {
    const daysOut = builder.daysUntil(event.startsAt, now);
    if (!days.includes(daysOut)) continue;
    const note = builder.notification(TYPES.REMINDER, event, { daysOut });
    // eslint-disable-next-line no-await-in-loop
    const devices = await audienceDevices(event.organizerArtistId, {
      staleOnly: !includeActiveDevices,
    });
    // eslint-disable-next-line no-await-in-loop
    const stats = await deliver(devices, note, { eventId: event.id });
    totals.sent += stats.sent;
    totals.skipped += stats.skipped;
    totals.failed += stats.failed;
  }
  if (totals.sent) log('reminders →', totals.sent, 'device(s)');
  return totals;
}

/** Diagnostic push — "does this install actually receive anything?". */
async function sendTest(deviceId) {
  const device = await prisma.pushDevice.findUnique({ where: { deviceId } });
  if (!device) return { ok: false, reason: 'DEVICE_NOT_REGISTERED' };
  if (!device.expoPushToken) return { ok: false, reason: 'NO_PUSH_TOKEN' };
  if (!device.enabled) return { ok: false, reason: 'DISABLED' };
  if (!config.push.enabled) return { ok: false, reason: 'PUSH_DISABLED_ON_SERVER' };

  const [result] = await sendPushMessages([
    {
      to: device.expoPushToken,
      title: 'Stage notifications are on 🎉',
      body: "That's what an alert looks like. We'll ping you when a company you follow announces something.",
      data: { type: 'test' },
      sound: 'default',
      channelId: builder.CHANNELS.DEFAULT,
      priority: 'high',
    },
  ]);

  if (result?.status === 'ok') {
    await prisma.pushDevice.update({
      where: { deviceId },
      data: { failureCount: 0, lastSeenAt: new Date() },
    });
    return { ok: true, ticketId: result.id };
  }
  if (isPermanentTokenError(result?.error)) await retireToken(deviceId, result.error);
  return { ok: false, reason: result?.error || 'SEND_FAILED', details: result?.details };
}

// -----------------------------------------------------------------------------
// Housekeeping
// -----------------------------------------------------------------------------

/**
 * Resolve push receipts. Most dead tokens are accepted at send time and only
 * surface as DeviceNotRegistered here, minutes later — skipping this step is
 * how a push table slowly fills with addresses nobody is listening on.
 */
async function checkReceipts() {
  const cutoff = new Date(Date.now() - 15 * 60 * 1000); // Expo asks for a delay
  const pending = await prisma.notificationDelivery.findMany({
    where: { ticketId: { not: null }, receiptCheckedAt: null, sentAt: { lt: cutoff } },
    select: { id: true, ticketId: true, deviceId: true },
    take: 1000,
  });
  if (!pending.length) return { checked: 0, retired: 0 };

  const receipts = await getPushReceipts(pending.map((p) => p.ticketId));
  let retired = 0;
  const now = new Date();

  for (const row of pending) {
    const receipt = receipts.get(row.ticketId);
    if (!receipt) continue; // not ready — try again next sweep
    if (receipt.status === 'error') {
      if (isPermanentTokenError(receipt.error)) {
        // eslint-disable-next-line no-await-in-loop
        await retireToken(row.deviceId, receipt.error);
        retired += 1;
      }
      // eslint-disable-next-line no-await-in-loop
      await prisma.notificationDelivery.update({
        where: { id: row.id },
        data: { status: 'failed', error: receipt.error || 'ReceiptError', receiptCheckedAt: now },
      });
    } else {
      // eslint-disable-next-line no-await-in-loop
      await prisma.notificationDelivery.update({
        where: { id: row.id },
        data: { receiptCheckedAt: now },
      });
    }
  }
  return { checked: pending.length, retired };
}

/** Keep the ledger from growing forever — dedupe only needs the recent past. */
async function pruneDeliveries() {
  const cutoff = new Date(Date.now() - config.push.deliveryRetentionDays * DAY_MS);
  const { count } = await prisma.notificationDelivery.deleteMany({
    where: { sentAt: { lt: cutoff } },
  });
  return { pruned: count };
}

// -----------------------------------------------------------------------------
// In-app feed
// -----------------------------------------------------------------------------

/**
 * Build the in-app reminder feed for events happening within the next
 * `windowDays` days (default 5 — per client feedback, 2 days' notice was too
 * short). Every event due in 1..windowDays days yields one item, and each item
 * carries the organizer (event company) name so alerts always read
 * "<Company> · <Event>".
 *
 * Titles/bodies come from the same builder the push messages use, so the card
 * in the tab and the banner on the lock screen never drift apart.
 *
 * `viewerUserId` prioritises the viewer's saved events; `deviceId` prioritises
 * companies this install follows. Guests with neither simply get every
 * upcoming published event.
 */
async function feed(viewerUserId, { windowDays = 5, deviceId = null } = {}) {
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
      // Alerts must not print the placeholder hour for a day-only event.
      startTimeTba: true,
      venueName: true,
      cityName: true,
      coverColor: true,
      bannerImageUrl: true,
      organizerArtistId: true,
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

  let followedSet = new Set();
  if (deviceId) {
    const follows = await prisma.guestFollow.findMany({
      where: { deviceId },
      select: { artistId: true },
    });
    followedSet = new Set(follows.map((f) => f.artistId));
  }

  const items = [];
  for (const e of events) {
    const d = builder.daysUntil(e.startsAt, now);
    if (d < 1 || d > windowDays) continue;
    const note = builder.notification(TYPES.REMINDER, e, { daysOut: d });
    const company = builder.companyName(e);
    const prefix = builder.dayLabel(d);
    items.push({
      // Kept as `${eventId}-T-${d}` for backwards compatibility with installs
      // that cached the old feed shape; `key` is the new stable identity.
      id: `${e.id}-T-${d}`,
      key: note.key,
      type: note.type,
      eventId: e.id,
      kind: `T-${d}`,
      daysUntil: d,
      title: e.title,
      companyName: company,
      companyId: e.organizer?.id || null,
      companyAvatarUrl: e.organizer?.user?.avatarUrl || null,
      startsAt: e.startsAt,
      startTimeTba: e.startTimeTba,
      venueName: e.venueName,
      cityName: e.cityName,
      coverColor: e.coverColor,
      bannerImageUrl: e.bannerImageUrl,
      saved: savedSet.has(e.id),
      following: followedSet.has(e.organizerArtistId),
      pushTitle: note.title,
      pushBody: note.body,
      // The venue may not be announced yet — never render "at " with nothing.
      message: `${prefix}: ${company ? `${company} · ` : ''}${e.title}${
        e.venueName ? ` at ${e.venueName}` : ''
      }`,
    });
  }

  // Companies you follow first, then your saved events, then soonest.
  items.sort((a, b) => {
    if (a.following !== b.following) return a.following ? -1 : 1;
    if (a.saved !== b.saved) return a.saved ? -1 : 1;
    return new Date(a.startsAt) - new Date(b.startsAt);
  });

  return { items, total: items.length };
}

module.exports = {
  feed,
  // Exported for scripts/check-notifications.js — the dedupe semantics are
  // the part worth asserting directly.
  deliver,
  registerDevice,
  setDeviceEnabled,
  getDevice,
  audienceDevices,
  dispatchEvent,
  dispatchEventAsync,
  dispatchPendingPublishes,
  dispatchReminders,
  sendTest,
  checkReceipts,
  pruneDeliveries,
  TYPES,
};
