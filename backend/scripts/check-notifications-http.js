/**
 * Notification HTTP checks — part of `npm run check:notifications`.
 *
 * Boots the REAL Express app (routes, zod validation, auth, rate limiting)
 * against an in-memory Prisma and a fake Expo transport, then drives the
 * endpoints over real HTTP. Catches the class of bug a unit test can't: a
 * route mounted wrong, a schema that rejects a valid device id, a push token
 * leaking back to the client.
 *
 * Needs no database and no network.
 */

process.env.DATABASE_URL = 'mysql://x:x@localhost:3306/x';
process.env.NODE_ENV = 'test';

const path = require('path');
const BACKEND = process.argv[2] || require('path').resolve(__dirname, '..');
const src = (p) => path.resolve(BACKEND, 'src', p);

const DAY = 864e5;
const db = {
  pushDevice: new Map(),
  delivery: new Map(),
  guestFollow: [{ deviceId: 'dev-guest-0001', artistId: 'artist-1' }],
  follow: [],
  events: [
    {
      id: 'evt-soon',
      title: 'Neon Nights',
      startsAt: new Date(Date.now() + 1 * DAY),
      startTimeTba: false,
      status: 'published',
      venueName: 'Nelum Pokuna',
      cityName: 'Colombo',
      coverColor: '#111',
      bannerImageUrl: null,
      organizerArtistId: 'artist-1',
      organizer: { id: 'artist-1', handle: 'pulse', user: { name: 'Pulse Events', avatarUrl: null } },
    },
    {
      id: 'evt-later',
      title: 'Bass Drop',
      startsAt: new Date(Date.now() + 4 * DAY),
      startTimeTba: true,
      status: 'published',
      venueName: null,
      cityName: 'Kandy',
      coverColor: '#222',
      bannerImageUrl: null,
      organizerArtistId: 'artist-2',
      organizer: { id: 'artist-2', handle: 'vibe', user: { name: 'Vibe Co', avatarUrl: null } },
    },
  ],
};

const prismaStub = {
  event: { async findMany() { return db.events; } },
  savedEvent: { async findMany() { return []; } },
  guestFollow: {
    async findMany({ where }) {
      return db.guestFollow.filter(
        (f) =>
          (!where.deviceId || f.deviceId === where.deviceId) &&
          (!where.artistId || f.artistId === where.artistId),
      );
    },
  },
  follow: { async findMany() { return db.follow; } },
  pushDevice: {
    async findUnique({ where }) { return db.pushDevice.get(where.deviceId) || null; },
    async findMany() { return [...db.pushDevice.values()]; },
    async updateMany() { return { count: 0 }; },
    async update({ where, data }) {
      const row = { ...db.pushDevice.get(where.deviceId), ...data };
      db.pushDevice.set(where.deviceId, row);
      return row;
    },
    async upsert({ where, create, update }) {
      const existing = db.pushDevice.get(where.deviceId);
      const row = existing
        ? { ...existing, ...update }
        : { enabled: true, failureCount: 0, createdAt: new Date(), ...create };
      db.pushDevice.set(where.deviceId, row);
      return row;
    },
  },
  notificationDelivery: {
    async createMany({ data }) {
      data.forEach((r) => db.delivery.set(`${r.deviceId}|${r.dedupeKey}`, r));
      return { count: data.length };
    },
    async findMany() { return []; },
    async update() { return {}; },
    async deleteMany() { return { count: 0 }; },
  },
};

const expoStub = {
  isExpoPushToken: (t) => /^Expo(nent)?PushToken\[[^\][\s]+\]$/.test(t || ''),
  isPermanentTokenError: () => false,
  sent: [],
  async sendPushMessages(msgs) {
    expoStub.sent.push(...msgs);
    return msgs.map((message) => ({ message, status: 'ok', id: 'tkt-1' }));
  },
  async getPushReceipts() { return new Map(); },
};

for (const [file, exports] of [['prisma.js', prismaStub], ['lib/expo-push.js', expoStub]]) {
  const resolved = require.resolve(src(file));
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
}

const { build } = require(src('app.js'));
const app = build();

let failures = 0;
function check(label, ok, detail) {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `\n      ${detail}` : ''}`);
}

const server = app.listen(0, async () => {
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const call = async (method, p, body) => {
    const res = await fetch(base + p, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = text; }
    return { status: res.status, body: json };
  };

  // --- the in-app feed ---------------------------------------------------
  let r = await call('GET', '/notifications');
  check('GET /notifications works for an anonymous guest', r.status === 200 && r.body.total === 2,
    JSON.stringify(r.body).slice(0, 200));
  check('every item carries its company and message',
    r.body.items.every((i) => i.companyName && i.message && i.eventId));
  check('an unannounced venue never renders "at " with nothing',
    !r.body.items.some((i) => /\bat\s*$/.test(i.message)),
    JSON.stringify(r.body.items.map((i) => i.message)));

  r = await call('GET', '/notifications?deviceId=dev-guest-0001');
  check('a followed company leads the feed',
    r.body.items[0].following === true && r.body.items[0].companyId === 'artist-1',
    JSON.stringify(r.body.items.map((i) => [i.companyId, i.following])));

  r = await call('GET', '/notifications?deviceId=short');
  check('a malformed deviceId is rejected', r.status === 400, JSON.stringify(r.body));

  // --- device registry ---------------------------------------------------
  r = await call('POST', '/notifications/devices', {
    deviceId: 'dev-guest-0001',
    expoPushToken: 'ExponentPushToken[real-looking-token]',
    platform: 'android',
    appVersion: '1.0.0',
  });
  check('POST /devices registers an install', r.status === 200 && r.body.hasToken === true,
    JSON.stringify(r.body));
  check('the raw push token is never echoed back', !JSON.stringify(r.body).includes('ExponentPushToken'),
    JSON.stringify(r.body));

  r = await call('POST', '/notifications/devices', {
    deviceId: 'dev-guest-0001',
    expoPushToken: 'not-a-token',
    platform: 'android',
  });
  check('a junk token is dropped, not stored', r.status === 200,
    JSON.stringify(r.body));
  check('...and the good token already held is kept',
    db.pushDevice.get('dev-guest-0001').expoPushToken === 'ExponentPushToken[real-looking-token]',
    String(db.pushDevice.get('dev-guest-0001').expoPushToken));

  r = await call('POST', '/notifications/devices', { platform: 'android' });
  check('a missing deviceId is a 400', r.status === 400);

  r = await call('GET', '/notifications/devices/dev-guest-0001');
  check('GET /devices/:id reports state', r.status === 200 && r.body.enabled === true);

  r = await call('GET', '/notifications/devices/dev-nobody-here');
  check('an unknown device is a 404', r.status === 404);

  r = await call('PATCH', '/notifications/devices/dev-guest-0001', { enabled: false });
  check('PATCH /devices/:id switches alerts off', r.status === 200 && r.body.enabled === false);

  // --- test push ---------------------------------------------------------
  r = await call('POST', '/notifications/test', { deviceId: 'dev-guest-0001' });
  check('testing a disabled device explains why', r.status === 400 && r.body.code === 'DISABLED',
    JSON.stringify(r.body));

  await call('PATCH', '/notifications/devices/dev-guest-0001', { enabled: true });
  r = await call('POST', '/notifications/test', { deviceId: 'dev-guest-0001' });
  check('testing an enabled device sends a push', r.status === 200 && r.body.ok === true,
    JSON.stringify(r.body));
  check('the test push goes to the right token',
    expoStub.sent.at(-1).to === 'ExponentPushToken[real-looking-token]');

  r = await call('POST', '/notifications/test', { deviceId: 'dev-never-seen-01' });
  check('testing an unregistered device explains why',
    r.status === 400 && r.body.code === 'DEVICE_NOT_REGISTERED', JSON.stringify(r.body));

  // --- admin route is protected -------------------------------------------
  r = await call('POST', '/notifications/dispatch');
  check('the manual dispatch route requires auth', r.status === 401, JSON.stringify(r.body));

  console.log(failures ? `\n${failures} FAILING` : '\nall checks passed');
  server.close();
  process.exit(failures ? 1 : 0);
});
