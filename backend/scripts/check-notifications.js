/**
 * Push notification checks — `npm run check:notifications`.
 *
 * Covers the parts that are pure logic and therefore cheap to get wrong
 * quietly: the alert copy, the once-a-day reminder window, and the delivery
 * ledger's dedupe (the thing standing between one alert and five).
 *
 * Prisma and the Expo transport are stubbed through require.cache, so this
 * needs neither a database nor a network. No test framework in this project —
 * plain node, exits non-zero on failure.
 */

process.env.DATABASE_URL = process.env.DATABASE_URL || 'mysql://check:check@localhost:3306/check';
process.env.PUSH_TZ_OFFSET_MINUTES = '330'; // Asia/Colombo
process.env.PUSH_REMINDER_HOUR = '10';

const path = require('path');

let failures = 0;
function check(label, condition, detail) {
  if (!condition) failures += 1;
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${label}${!condition && detail ? `\n      ${detail}` : ''}`);
}

// ---- stubs, installed before the service is required ------------------------

const sent = [];
const deliveries = new Map(); // `${deviceId}|${dedupeKey}` -> row
let nextSendResult = () => ({ status: 'ok', id: `ticket-${sent.length}` });

const prismaStub = {
  notificationDelivery: {
    async createMany({ data, skipDuplicates }) {
      let count = 0;
      for (const row of data) {
        const key = `${row.deviceId}|${row.dedupeKey}`;
        if (deliveries.has(key)) {
          if (!skipDuplicates) throw new Error('duplicate');
          continue;
        }
        deliveries.set(key, { ...row, sentAt: new Date() });
        count += 1;
      }
      return { count };
    },
    async findMany({ where, select }) {
      const ids = new Set(where?.id?.in || []);
      return [...deliveries.values()]
        .filter((r) => ids.has(r.id))
        .map((r) => (select ? { id: r.id, deviceId: r.deviceId } : r));
    },
    async update({ where, data }) {
      for (const [k, r] of deliveries) if (r.id === where.id) deliveries.set(k, { ...r, ...data });
      return {};
    },
    async deleteMany({ where }) {
      const ids = new Set(where?.id?.in || []);
      let count = 0;
      for (const [k, r] of [...deliveries]) {
        if (ids.has(r.id)) {
          deliveries.delete(k);
          count += 1;
        }
      }
      return { count };
    },
  },
  pushDevice: {
    async updateMany() {
      return { count: 0 };
    },
    async update() {
      return {};
    },
  },
};

const expoPushStub = {
  isExpoPushToken: (t) => /^Expo(nent)?PushToken\[[^\][\s]+\]$/.test(t || ''),
  isPermanentTokenError: (c) => c === 'DeviceNotRegistered' || c === 'MismatchSenderId',
  async sendPushMessages(messages) {
    messages.forEach((m) => sent.push(m));
    return messages.map((message) => ({ message, ...nextSendResult() }));
  },
  async getPushReceipts() {
    return new Map();
  },
};

function stub(relativeToSrc, exports) {
  const resolved = require.resolve(path.resolve(__dirname, '..', 'src', relativeToSrc));
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
}
stub('prisma.js', prismaStub);
stub('lib/expo-push.js', expoPushStub);

const builder = require('../src/modules/notifications/builder');
const scheduler = require('../src/modules/notifications/scheduler');
const service = require('../src/modules/notifications/service');

// ---- fixtures ---------------------------------------------------------------

const DAY = 864e5;
const event = {
  id: 'evt1',
  title: 'Neon Nights',
  venueName: 'Nelum Pokuna',
  startsAt: new Date(Date.now() + 3 * DAY),
  organizer: { id: 'a1', handle: 'pulse', user: { name: 'Pulse Events' } },
};
const bare = {
  ...event,
  id: 'evt2',
  venueName: null,
  organizer: { id: 'a2', handle: 'solo', user: { name: null } },
};
const devices = [
  { deviceId: 'dev-1', expoPushToken: 'ExponentPushToken[aaa]' },
  { deviceId: 'dev-2', expoPushToken: 'ExponentPushToken[bbb]' },
];

(async () => {
  // ---- copy ------------------------------------------------------------
  const published = builder.notification(builder.TYPES.PUBLISHED, event);
  check(
    'a publish names the company',
    published.title === 'Pulse Events just announced' && published.body === 'Neon Nights · Nelum Pokuna',
    `${published.title} / ${published.body}`,
  );
  check('a publish routes to the new-events channel', published.channelId === 'new-events');
  check(
    'a reminder counts down',
    builder.notification(builder.TYPES.REMINDER, event, { daysOut: 1 }).title === 'Tomorrow 🎉' &&
      builder.notification(builder.TYPES.REMINDER, event, { daysOut: 5 }).title === 'In 5 days 🎉',
  );
  check('a reminder routes to the reminders channel',
    builder.notification(builder.TYPES.REMINDER, event, { daysOut: 1 }).channelId === 'reminders');

  // An event can be published before its venue is announced — the copy must
  // never render "· undefined" or a dangling "at ".
  check(
    'an unannounced venue leaves no dangling separator',
    builder.notification(builder.TYPES.PUBLISHED, bare).body === 'Neon Nights',
    builder.notification(builder.TYPES.PUBLISHED, bare).body,
  );
  check(
    'a nameless organizer falls back to the handle',
    builder.notification(builder.TYPES.REMINDER, bare, { daysOut: 1 }).body === 'solo · Neon Nights',
  );

  // ---- dedupe keys -----------------------------------------------------
  check(
    'each lead time is its own delivery',
    builder.notification(builder.TYPES.REMINDER, event, { daysOut: 5 }).dedupeKey === 'evt:evt1:T-5' &&
      builder.notification(builder.TYPES.REMINDER, event, { daysOut: 1 }).dedupeKey === 'evt:evt1:T-1',
  );
  check(
    'repeated edits collapse to one alert a day',
    builder.notification(builder.TYPES.UPDATED, event).dedupeKey ===
      builder.notification(builder.TYPES.UPDATED, event).dedupeKey,
  );

  // ---- reminder window --------------------------------------------------
  // 10:00 Asia/Colombo is 04:30 UTC, so only the 04:xx UTC hour may fire.
  check('the reminder window opens at 10:00 Colombo',
    scheduler.inReminderWindow(new Date(Date.UTC(2026, 7, 23, 4, 45))));
  check('...and not an hour earlier',
    !scheduler.inReminderWindow(new Date(Date.UTC(2026, 7, 23, 3, 45))));
  check('...and not an hour later',
    !scheduler.inReminderWindow(new Date(Date.UTC(2026, 7, 23, 5, 45))));

  // ---- day arithmetic ---------------------------------------------------
  const now = new Date('2026-08-23T18:00:00Z');
  check('later today is T-0', builder.daysUntil(new Date('2026-08-23T23:00:00Z'), now) === 0);
  check('just past midnight is T-1', builder.daysUntil(new Date('2026-08-24T01:00:00Z'), now) === 1);

  // ---- delivery + dedupe ------------------------------------------------
  const note = builder.notification(builder.TYPES.PUBLISHED, event);
  const first = await service.deliver(devices, note, { eventId: event.id });
  check('first send reaches every follower', first.sent === 2 && first.skipped === 0, JSON.stringify(first));
  check('the push carries the deep-link payload', sent[0].data.eventId === 'evt1' && sent[0].channelId === 'new-events');
  check('the push carries a TTL so stale alerts expire', sent[0].ttl > 0);

  const second = await service.deliver(devices, note, { eventId: event.id });
  check('re-sending the same alert delivers nothing', second.sent === 0 && second.skipped === 2, JSON.stringify(second));

  const third = await service.deliver(
    [...devices, { deviceId: 'dev-3', expoPushToken: 'ExponentPushToken[ccc]' }],
    note,
    event.id,
  );
  check('a newly-registered device still gets it', third.sent === 1 && third.skipped === 2, JSON.stringify(third));

  // A transport failure must release the claim so the next sweep retries;
  // a dead token must not.
  nextSendResult = () => ({ status: 'error', error: 'TransportError', details: 'boom' });
  const other = builder.notification(builder.TYPES.REMINDER, event, { daysOut: 5 });
  const failed = await service.deliver(devices, other, { eventId: event.id });
  check('a transport failure sends nothing', failed.sent === 0 && failed.failed === 2, JSON.stringify(failed));
  nextSendResult = () => ({ status: 'ok', id: 'ticket-retry' });
  const retried = await service.deliver(devices, other, { eventId: event.id });
  check('...and is retried on the next sweep', retried.sent === 2, JSON.stringify(retried));

  nextSendResult = () => ({ status: 'error', error: 'DeviceNotRegistered' });
  const dead = builder.notification(builder.TYPES.REMINDER, event, { daysOut: 1 });
  await service.deliver(devices, dead, { eventId: event.id });
  nextSendResult = () => ({ status: 'ok', id: 'ticket-x' });
  const notRetried = await service.deliver(devices, dead, { eventId: event.id });
  check('a dead token is not retried forever', notRetried.sent === 0 && notRetried.skipped === 2,
    JSON.stringify(notRetried));

  console.log(failures ? `\n${failures} FAILING` : '\nall checks passed');
  process.exit(failures ? 1 : 0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
