/**
 * Notification service checks — `npm run check:notifications`.
 *
 * The reminder scheduler is the half of notifications that has to work with no
 * server and no Firebase, and its bugs are invisible until someone misses an
 * event. So rather than trusting a read-through, this transpiles the real
 * src/services/notifications.js to CJS and runs it against a fake
 * expo-notifications, asserting exactly which alarm identifiers get scheduled,
 * replaced, and cancelled.
 *
 * No test framework in this project — plain node, exits non-zero on failure.
 */

const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const PROJECT = process.argv[2] || path.resolve(__dirname, '..');
const SRC = path.join(PROJECT, 'src/services/notifications.js');

// ---- fakes ---------------------------------------------------------------

const scheduled = new Map(); // identifier -> request
const cancelled = [];
let permission = { granted: true, canAskAgain: true, status: 'granted' };

const FakeNotifications = {
  AndroidImportance: { DEFAULT: 5, HIGH: 6 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
  setNotificationHandler() {},
  async setNotificationChannelAsync(id) {
    channels.push(id);
  },
  async getPermissionsAsync() {
    return permission;
  },
  async requestPermissionsAsync() {
    permission = { granted: true, canAskAgain: true, status: 'granted' };
    return permission;
  },
  async scheduleNotificationAsync(req) {
    if (!req.identifier) throw new Error('every reminder must carry an identifier');
    scheduled.set(req.identifier, req);
    return req.identifier;
  },
  async getAllScheduledNotificationsAsync() {
    return [...scheduled.entries()].map(([identifier, request]) => ({ identifier, ...request }));
  },
  async cancelScheduledNotificationAsync(id) {
    cancelled.push(id);
    scheduled.delete(id);
  },
  async cancelAllScheduledNotificationsAsync() {
    scheduled.clear();
  },
  async dismissAllNotificationsAsync() {},
  async setBadgeCountAsync() {},
  async getExpoPushTokenAsync() {
    return { data: 'ExponentPushToken[fake-token-abc]' };
  },
  addNotificationResponseReceivedListener() {
    return { remove() {} };
  },
  getLastNotificationResponse: () => null,
  clearLastNotificationResponse() {},
};
const channels = [];

const store = {};
const registered = [];

const fakeModules = {
  'react-native': { Platform: { OS: 'android' } },
  '@react-native-async-storage/async-storage': {
    async getItem(k) {
      return k in store ? store[k] : null;
    },
    async setItem(k, v) {
      store[k] = v;
    },
  },
  'expo-notifications': FakeNotifications,
  'expo-constants': {
    default: {
      executionEnvironment: 'standalone',
      expoConfig: { version: '1.0.0', extra: { eas: { projectId: 'proj-1' } } },
    },
  },
  './store': { emit() {}, CHANNELS: { PUSH: 'push' } },
  './deviceId': { ensureDeviceId: async () => 'dev-test-1234' },
  './api': {
    notifications: {
      async registerDevice(body) {
        registered.push(body);
        return { ...body, hasToken: !!body.expoPushToken };
      },
      async setDeviceEnabled(deviceId, enabled) {
        registered.push({ deviceId, enabled, via: 'patch' });
        return { deviceId, enabled };
      },
      async sendTest() {
        return { ok: true };
      },
    },
  },
};

// ---- load the real module ------------------------------------------------

const code = babel.transformSync(fs.readFileSync(SRC, 'utf8'), {
  filename: SRC,
  presets: ['babel-preset-expo'],
  babelrc: false,
  configFile: false,
}).code;

const mod = { exports: {} };
// eslint-disable-next-line no-new-func
new Function('require', 'module', 'exports', code)(
  (id) => {
    if (id in fakeModules) return fakeModules[id];
    // Babel's own runtime helpers resolve for real.
    if (id.startsWith('@babel/runtime')) return require(id);
    throw new Error(`unexpected require("${id}")`);
  },
  mod,
  mod.exports,
);
const push = mod.exports;

// ---- assertions ----------------------------------------------------------

let failures = 0;
function check(label, condition, detail) {
  const mark = condition ? 'PASS' : 'FAIL';
  if (!condition) failures += 1;
  console.log(`${mark}  ${label}${detail && !condition ? `\n      ${detail}` : ''}`);
}

const DAY = 864e5;
const at = (days) => new Date(Date.now() + days * DAY).toISOString();

(async () => {
  push.configure();
  check('creates three Android channels', channels.length === 3, `got ${channels.join(', ')}`);

  // --- a normal followed event, 10 days out -------------------------------
  const events = [
    { id: 'e1', title: 'Neon Nights', startsAt: at(10), venueName: 'Nelum Pokuna', companyName: 'Pulse' },
  ];
  await push.syncReminders(events);
  const ids = [...scheduled.keys()].sort();
  check(
    'schedules T-5, T-1 and the day-of nudge',
    ids.join(',') === 'stage-ev:e1:T-1,stage-ev:e1:T-5,stage-ev:e1:soon',
    `got ${ids.join(',')}`,
  );
  check(
    'reminders use the reminders channel',
    [...scheduled.values()].every((r) => r.trigger.channelId === 'reminders'),
  );
  check(
    'reminders carry the eventId for deep-linking',
    [...scheduled.values()].every((r) => r.content.data.eventId === 'e1'),
  );
  check(
    'body reads "<Company> · <Event> · <Venue>"',
    scheduled.get('stage-ev:e1:T-1').content.body === 'Pulse · Neon Nights · Nelum Pokuna',
    scheduled.get('stage-ev:e1:T-1').content.body,
  );
  check(
    'T-1 fires at 10:00 local the day before',
    (() => {
      const d = new Date(scheduled.get('stage-ev:e1:T-1').trigger.date);
      const start = new Date(events[0].startsAt);
      return d.getHours() === 10 && d.getDate() === new Date(start.getTime() - DAY).getDate();
    })(),
  );

  // --- idempotency: syncing again must not duplicate ----------------------
  const before = new Map(scheduled);
  cancelled.length = 0;
  await push.syncReminders(events);
  check('re-syncing schedules nothing new', scheduled.size === before.size, `${scheduled.size} vs ${before.size}`);
  check('re-syncing cancels nothing', cancelled.length === 0, `cancelled ${cancelled.join(',')}`);

  // --- unfollowing one event cancels only its alarms ----------------------
  const two = [
    ...events,
    { id: 'e2', title: 'Bass Drop', startsAt: at(6), venueName: 'BMICH', companyName: 'Vibe' },
  ];
  await push.syncReminders(two);
  check('second event adds its own alarms', scheduled.has('stage-ev:e2:T-5'));
  cancelled.length = 0;
  await push.syncReminders([two[1]]); // unfollowed e1
  check(
    'unfollowing cancels exactly that event',
    cancelled.every((id) => id.startsWith('stage-ev:e1:')) && cancelled.length === 3,
    `cancelled ${cancelled.join(',')}`,
  );
  check('the other event survives', scheduled.has('stage-ev:e2:T-1'));

  // --- day-only events must not get a "2 hours before noon" nudge ---------
  await push.syncReminders([
    { id: 'e3', title: 'TBA Fest', startsAt: at(8), startTimeTba: true, companyName: 'Mystery' },
  ]);
  check(
    'no day-of nudge when the start time is unannounced',
    !scheduled.has('stage-ev:e3:soon') && scheduled.has('stage-ev:e3:T-1'),
    [...scheduled.keys()].join(','),
  );

  // --- past events are skipped -------------------------------------------
  await push.syncReminders([
    { id: 'e4', title: 'Last Week', startsAt: at(-3), companyName: 'Old' },
  ]);
  check('nothing scheduled for a past event', scheduled.size === 0, [...scheduled.keys()].join(','));

  // --- the iOS 64-notification cap ----------------------------------------
  const many = Array.from({ length: 40 }, (_, i) => ({
    id: `m${i}`,
    title: `Show ${i}`,
    startsAt: at(3 + i),
    companyName: 'Mass',
  }));
  await push.syncReminders(many);
  check('stays under the iOS pending-notification cap', scheduled.size <= 56, `${scheduled.size}`);
  check('keeps the soonest ones', scheduled.has('stage-ev:m0:T-1'));

  // --- registration --------------------------------------------------------
  registered.length = 0;
  const res = await push.register({ prompt: false });
  check('registers an Expo push token', res.token === 'ExponentPushToken[fake-token-abc]', String(res.token));
  check('reports remote push as live', push.getStatus().remote === true);
  check('POSTs the device to the backend', registered.length === 1 && registered[0].deviceId === 'dev-test-1234');
  check('sends the platform and app version', registered[0].platform === 'android' && registered[0].appVersion === '1.0.0');

  // --- the on/off switch ---------------------------------------------------
  await push.syncReminders(events);
  check('alarms armed before disabling', scheduled.size === 3, `${scheduled.size}`);
  await push.disable();
  check('disabling clears every local alarm', scheduled.size === 0, [...scheduled.keys()].join(','));
  check('disabling persists the choice', store['@eventsocial.v1.pushEnabled'] === 'false');
  await push.syncReminders(events);
  check('a disabled device schedules nothing', scheduled.size === 0, [...scheduled.keys()].join(','));
  const disabledRun = await push.register({ prompt: false });
  check('a disabled device asks for no token', disabledRun.reason === 'DISABLED_BY_USER', String(disabledRun.reason));

  await push.enable();
  check('re-enabling persists too', store['@eventsocial.v1.pushEnabled'] === 'true');
  await push.syncReminders(events);
  check('re-enabling re-arms the alarms', scheduled.size === 3, `${scheduled.size}`);

  // --- permission refused --------------------------------------------------
  await push.disable();
  scheduled.clear();
  permission = { granted: false, canAskAgain: false, status: 'denied' };
  await push.enable();
  check('a blocked device reports permission denied', push.getStatus().permission === 'denied');
  check('a blocked device gets no token', push.getStatus().remote === false);

  console.log(failures ? `\n${failures} FAILING` : '\nall checks passed');
  process.exit(failures ? 1 : 0);
})();
