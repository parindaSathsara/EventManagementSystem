/**
 * Stage notification service — local + remote push, one surface.
 *
 * Two delivery paths, with a deliberate split of responsibility:
 *
 *   LOCAL (expo-notifications, scheduled on device)
 *     Owns the T-minus reminders for events the guest follows. Needs no
 *     server, no Firebase, and no network — the OS holds the alarm, so it
 *     fires with the app killed and survives a reboot (expo-notifications
 *     registers a BOOT_COMPLETED receiver). This is the path that always
 *     works, so it is the one the time-critical alerts ride on.
 *
 *   REMOTE (Expo Push Service → FCM/APNs)
 *     Owns everything only the server can know: a company you follow just
 *     announced / updated / cancelled an event. Requires push credentials
 *     (see docs/PUSH-NOTIFICATIONS.md) and degrades to "not available"
 *     without them, which is why nothing time-critical depends on it.
 *
 * The backend knows which installs are active (`lastSeenAt`, refreshed by
 * `register()` on every boot) and only sends remote *reminders* to installs
 * that have gone quiet — so the two paths never double-notify.
 *
 * Everything is loaded defensively: `expo-notifications` is a native module
 * that can be missing (Expo Go on recent SDKs, web). When it is, every export
 * becomes a safe no-op and the in-app Alerts tab keeps working untouched.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { emit, CHANNELS } from './store';
import { ensureDeviceId } from './deviceId';
import { notifications as notificationsApi } from './api';

let Notifications = null;
try {
  // eslint-disable-next-line global-require
  Notifications = require('expo-notifications');
} catch {
  Notifications = null;
}

let Constants = null;
try {
  // eslint-disable-next-line global-require
  Constants = require('expo-constants').default;
} catch {
  Constants = null;
}

const DAY_MS = 24 * 3600 * 1000;

/** Deterministic prefix for every reminder we schedule — see `syncReminders`. */
const LOCAL_PREFIX = 'stage-ev:';

/**
 * iOS caps pending local notifications at 64 and silently drops the rest, so
 * we schedule the soonest N and let later ones land on a future sync.
 */
const MAX_LOCAL_SCHEDULED = 56;

/**
 * Android channels. A `channelId` the app never created falls back to the
 * default channel, so these ids must match the ones the backend puts on its
 * push messages (backend/src/modules/notifications/builder.js).
 */
export const ANDROID_CHANNELS = {
  DEFAULT: 'default',
  REMINDERS: 'reminders',
  NEW_EVENTS: 'new-events',
};

const ACCENT = '#FF3B3B'; // COLORS.accent — imported by value to keep this file theme-free

/**
 * expo-notifications ships these as TS enums, so they only exist if the native
 * module resolved. `configure()` runs at App.js module scope — before React
 * mounts and before any error boundary exists — so reading `.DEFAULT` off an
 * undefined enum there would be a white-screen crash on boot rather than a
 * missing notification. The literals are the enums' own values.
 */
const IMPORTANCE = {
  DEFAULT: Notifications?.AndroidImportance?.DEFAULT ?? 5,
  HIGH: Notifications?.AndroidImportance?.HIGH ?? 6,
};
const TRIGGER_DATE = Notifications?.SchedulableTriggerInputTypes?.DATE ?? 'date';

// -----------------------------------------------------------------------------
// Status — a small observable the UI subscribes to
// -----------------------------------------------------------------------------

const status = {
  /** Native module present at all. */
  supported: !!(Notifications && Notifications.scheduleNotificationAsync),
  /** 'granted' | 'denied' | 'undetermined' | 'unknown' */
  permission: 'unknown',
  /** Guest-facing switch, mirrored to the backend. */
  enabled: true,
  /** True once the OS-level alarms for followed events are in place. */
  localScheduled: 0,
  /** True once an Expo push token is registered with the backend. */
  remote: false,
  /** Why remote push is unavailable, when it is. */
  remoteReason: null,
  /** Last error worth surfacing. */
  error: null,
  registering: false,
};

function setStatus(patch) {
  let changed = false;
  for (const [k, v] of Object.entries(patch)) {
    if (status[k] !== v) {
      status[k] = v;
      changed = true;
    }
  }
  if (changed) emit(CHANNELS.PUSH);
}

export function getStatus() {
  return { ...status };
}

/**
 * The guest's on/off choice, persisted.
 *
 * Without this, `status.enabled` would reset to `true` on every launch and the
 * next boot registration would quietly re-enable a device the guest had
 * switched off — the setting would appear to work and then undo itself.
 */
const ENABLED_KEY = '@eventsocial.v1.pushEnabled';
let prefsLoaded = null;

function loadPrefs() {
  if (!prefsLoaded) {
    prefsLoaded = AsyncStorage.getItem(ENABLED_KEY)
      .then((raw) => {
        // Absent = never chosen = opted in; only an explicit 'false' is off.
        if (raw != null) setStatus({ enabled: raw !== 'false' });
      })
      .catch(() => {});
  }
  return prefsLoaded;
}

function persistEnabled(value) {
  setStatus({ enabled: value });
  AsyncStorage.setItem(ENABLED_KEY, value ? 'true' : 'false').catch(() => {});
}

function available() {
  return !!(Notifications && Notifications.scheduleNotificationAsync);
}

/**
 * Expo Go dropped remote push support (SDK 53+). Local scheduling still works
 * there, so this only gates the token half — it is not a reason to give up on
 * notifications entirely.
 */
function isExpoGo() {
  return (
    Constants?.executionEnvironment === 'storeClient' || Constants?.appOwnership === 'expo'
  );
}

function projectId() {
  return (
    Constants?.expoConfig?.extra?.eas?.projectId ||
    Constants?.easConfig?.projectId ||
    Constants?.manifest2?.extra?.eas?.projectId ||
    null
  );
}

function appVersion() {
  return Constants?.expoConfig?.version || null;
}

// -----------------------------------------------------------------------------
// One-time setup
// -----------------------------------------------------------------------------

let configured = false;

/**
 * Install the foreground handler and Android channels. Call once, as early as
 * possible — module scope in App.js — because a notification can arrive while
 * the app is cold-starting and the handler must already be in place.
 */
export function configure() {
  if (configured || !available()) return;
  configured = true;

  Notifications.setNotificationHandler({
    // Show alerts even with the app in the foreground. A guest looking at the
    // Timeline should still see "Tomorrow 🎉" land — silently swallowing it
    // is how people conclude notifications are broken.
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      // Legacy key — kept so an older expo-notifications build still shows it.
      shouldShowAlert: true,
    }),
  });

  if (Platform.OS === 'android') {
    const base = {
      lightColor: ACCENT,
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
      sound: 'default',
    };
    // Fire and forget: channel creation is idempotent, and a failure here
    // just means Android uses its own defaults.
    Notifications.setNotificationChannelAsync(ANDROID_CHANNELS.DEFAULT, {
      name: 'General',
      description: 'Occasional updates from Stage.',
      importance: IMPORTANCE.DEFAULT,
      ...base,
    }).catch(() => {});
    Notifications.setNotificationChannelAsync(ANDROID_CHANNELS.REMINDERS, {
      name: 'Event reminders',
      description: "Countdown alerts for events you're following.",
      importance: IMPORTANCE.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      ...base,
    }).catch(() => {});
    Notifications.setNotificationChannelAsync(ANDROID_CHANNELS.NEW_EVENTS, {
      name: 'New events',
      description: 'When a company you follow announces or changes an event.',
      importance: IMPORTANCE.HIGH,
      vibrationPattern: [0, 200, 150, 200],
      ...base,
    }).catch(() => {});
  }

  // Seed the permission state so the UI can render the right thing on first
  // paint instead of flashing "off".
  refreshPermission().catch(() => {});
}

async function refreshPermission() {
  if (!available()) return 'unknown';
  try {
    const current = await Notifications.getPermissionsAsync();
    const value = current.granted
      ? 'granted'
      : current.canAskAgain === false
        ? 'denied'
        : current.status || 'undetermined';
    setStatus({ permission: value });
    return value;
  } catch {
    setStatus({ permission: 'unknown' });
    return 'unknown';
  }
}

/**
 * Ask the OS for permission.
 *
 * Deliberately never called on boot: the Alerts tab is mounted from app start,
 * so prompting there would put a system dialog in front of every guest on
 * first launch. The prompt belongs to a moment the guest created — following
 * a company, or tapping the toggle in Alerts.
 */
export async function ensurePermission({ prompt = true } = {}) {
  if (!available()) return false;
  const current = await refreshPermission();
  if (current === 'granted') return true;
  if (!prompt || current === 'denied') return false;

  try {
    const req = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    const granted = !!req.granted;
    setStatus({ permission: granted ? 'granted' : req.canAskAgain === false ? 'denied' : 'undetermined' });
    return granted;
  } catch (e) {
    setStatus({ error: e?.message || 'Permission request failed' });
    return false;
  }
}

// -----------------------------------------------------------------------------
// Remote push registration
// -----------------------------------------------------------------------------

let registerInflight = null;
let lastRegisterAt = 0;

/**
 * The heartbeat is cheap but it fires on every foreground, and a guest who
 * flicks between apps would otherwise POST a dozen times a minute. One call
 * per minute is plenty to keep `lastSeenAt` meaningful — anything the guest
 * actually triggers passes `force`.
 */
const REGISTER_THROTTLE_MS = 60 * 1000;

/**
 * Register this install with the backend.
 *
 * Always POSTs, token or not: the row doubles as the "this install is alive"
 * heartbeat the server uses to decide whether it needs to send reminders
 * remotely, and it carries the enabled flag even before permission exists.
 *
 * @param {{ prompt?: boolean }} [opts] `prompt: true` asks for OS permission
 *   first. Boot calls pass `false` — silent if already granted, nothing if not.
 */
export async function register({ prompt = false, force = false } = {}) {
  if (registerInflight) return registerInflight;
  if (!force && !prompt && Date.now() - lastRegisterAt < REGISTER_THROTTLE_MS) {
    return { token: status.remote ? 'cached' : null, reason: status.remoteReason, throttled: true };
  }
  registerInflight = (async () => {
    setStatus({ registering: true });
    try {
      // Before anything hits the network: a device the guest switched off
      // must not be re-enabled by its own boot heartbeat.
      await loadPrefs();
      const deviceId = await ensureDeviceId();
      let token = null;
      let reason = null;

      if (!status.enabled) {
        reason = 'DISABLED_BY_USER';
      } else if (!available()) {
        reason = 'MODULE_UNAVAILABLE';
      } else {
        const granted = await ensurePermission({ prompt });
        if (!granted) {
          reason = status.permission === 'denied' ? 'PERMISSION_DENIED' : 'PERMISSION_NOT_GRANTED';
        } else if (isExpoGo()) {
          // Local notifications still work here; only the token doesn't.
          reason = 'EXPO_GO';
        } else if (!projectId()) {
          reason = 'NO_PROJECT_ID';
        } else {
          try {
            const res = await Notifications.getExpoPushTokenAsync({ projectId: projectId() });
            token = res?.data || null;
          } catch (e) {
            // Almost always missing push credentials (no FCM key on the Expo
            // project) or the device being offline. Neither is fatal — the
            // local reminders below carry on regardless.
            reason = 'TOKEN_UNAVAILABLE';
            setStatus({ error: e?.message || 'Could not get a push token' });
          }
        }
      }

      await notificationsApi.registerDevice({
        deviceId,
        expoPushToken: token,
        platform: Platform.OS,
        appVersion: appVersion(),
        enabled: status.enabled,
      });

      lastRegisterAt = Date.now();
      setStatus({ remote: !!token, remoteReason: token ? null : reason, error: token ? null : status.error });
      return { deviceId, token, reason };
    } catch (e) {
      // Backend unreachable — remote push is simply off until the next boot.
      setStatus({ remote: false, remoteReason: 'BACKEND_UNREACHABLE' });
      return { token: null, reason: 'BACKEND_UNREACHABLE', error: e };
    } finally {
      setStatus({ registering: false });
      registerInflight = null;
    }
  })();
  return registerInflight;
}

/**
 * Turn alerts on from the UI: prompt, get a token, tell the backend.
 * Returns the resulting status so the caller can explain what happened.
 */
export async function enable() {
  persistEnabled(true);
  const result = await register({ prompt: true, force: true });
  try {
    const deviceId = await ensureDeviceId();
    await notificationsApi.setDeviceEnabled(deviceId, true);
  } catch {
    /* the register() call above already carried `enabled: true` */
  }
  return { ...getStatus(), ...result };
}

/** Turn alerts off: stop remote sends and drop every pending local alarm. */
export async function disable() {
  persistEnabled(false);
  try {
    const deviceId = await ensureDeviceId();
    await notificationsApi.setDeviceEnabled(deviceId, false);
  } catch {
    /* best effort — the local half below still takes effect immediately */
  }
  await cancelAllLocal();
  setStatus({ localScheduled: 0, remote: false, remoteReason: 'DISABLED_BY_USER' });
  return getStatus();
}

/** Ask the backend to push a test alert to this install. */
export async function sendTest() {
  const deviceId = await ensureDeviceId();
  return notificationsApi.sendTest(deviceId);
}

/**
 * Called when a guest follows a company — the natural moment to ask for
 * permission, because they just told us they want to hear about someone.
 * Silent no-op if they've already answered.
 */
export async function onFollow() {
  if (!available()) return;
  await loadPrefs();
  // Respect an explicit "off" and an OS-level "never ask again" — following
  // a company is not consent to re-open a dialog they already dismissed.
  if (!status.enabled || status.permission === 'denied') return;
  await register({ prompt: true });
}

// -----------------------------------------------------------------------------
// Local scheduled reminders
// -----------------------------------------------------------------------------

/** A reminder fires at 10:00 local on the day(s) before the event. */
function reminderDate(startsAt, daysBefore) {
  const start = new Date(startsAt);
  const d = new Date(start.getTime() - daysBefore * DAY_MS);
  d.setHours(10, 0, 0, 0);
  return d;
}

/** Day-of nudge: two hours before the doors, when a start time is announced. */
function dayOfDate(startsAt) {
  return new Date(new Date(startsAt).getTime() - 2 * 3600 * 1000);
}

function reminderTitle(kind) {
  if (kind === 'soon') return 'Starting soon 🔥';
  if (kind === 'T-1') return 'Tomorrow 🎉';
  return `In ${kind.slice(2)} days`;
}

/** Every alarm we'd want in place for the given events, soonest first. */
function desiredReminders(events) {
  const now = Date.now();
  const out = [];

  for (const e of events) {
    if (!e?.id || !e?.startsAt) continue;
    const company = e.companyName ? `${e.companyName} · ` : '';
    const body = `${company}${e.title}${e.venueName ? ` · ${e.venueName}` : ''}`;

    const slots = [
      // Lead times: 5 days out (per client feedback — 2 days was too short)
      // plus a day-before nudge.
      { kind: 'T-5', when: reminderDate(e.startsAt, 5) },
      { kind: 'T-1', when: reminderDate(e.startsAt, 1) },
      // Only meaningful when the hour is real — a day-only event's `startsAt`
      // is noon, and "2 hours before noon" is a lie.
      ...(e.startTimeTba ? [] : [{ kind: 'soon', when: dayOfDate(e.startsAt) }]),
    ];

    for (const { kind, when } of slots) {
      if (when.getTime() <= now) continue;
      out.push({
        identifier: `${LOCAL_PREFIX}${e.id}:${kind}`,
        when,
        title: reminderTitle(kind),
        body,
        data: { type: 'event_reminder', eventId: e.id, kind },
      });
    }
  }

  return out.sort((a, b) => a.when - b.when).slice(0, MAX_LOCAL_SCHEDULED);
}

async function cancelAllLocal() {
  if (!available()) return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => String(n.identifier || '').startsWith(LOCAL_PREFIX))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {})),
    );
  } catch {
    /* nothing scheduled / module unavailable — nothing to clean up */
  }
}

/**
 * Reconcile the OS's pending alarms with what the follow list currently wants.
 *
 * Deterministic identifiers are the whole trick: scheduling `stage-ev:<id>:T-1`
 * again replaces the existing alarm instead of stacking a duplicate, so this
 * only has to *add* what's missing and *cancel* what's stale. The old
 * cancel-everything-then-reschedule approach dropped every alarm for a few
 * hundred milliseconds on each render — and lost them entirely if the app was
 * killed mid-sync.
 *
 * @param {Array<{id,title,startsAt,startTimeTba,venueName,companyName}>} events
 */
export async function syncReminders(events = []) {
  if (!available()) return;
  await loadPrefs();

  // Guest switched alerts off — make sure nothing is left armed.
  if (!status.enabled) {
    await cancelAllLocal();
    setStatus({ localScheduled: 0 });
    return;
  }

  // Nothing to schedule → clear leftovers (they unfollowed everything) and
  // stop. Crucially we do NOT ask for permission here: this runs from a
  // mounted screen, and asking would put an OS dialog in front of every guest
  // on launch. `onFollow()` owns the prompt.
  if (!events.length) {
    await cancelAllLocal();
    setStatus({ localScheduled: 0 });
    return;
  }

  const granted = await ensurePermission({ prompt: false });
  if (!granted) return;

  const desired = desiredReminders(events);
  const wanted = new Map(desired.map((d) => [d.identifier, d]));

  let existing = [];
  try {
    existing = await Notifications.getAllScheduledNotificationsAsync();
  } catch {
    existing = [];
  }

  const ours = existing.filter((n) => String(n.identifier || '').startsWith(LOCAL_PREFIX));
  const have = new Set(ours.map((n) => n.identifier));

  // Drop alarms for events that are gone, unfollowed, or past.
  await Promise.all(
    ours
      .filter((n) => !wanted.has(n.identifier))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {})),
  );

  // Add the ones we don't have yet. Re-scheduling an identifier we already
  // hold would be harmless, but skipping it keeps this cheap on every sync.
  for (const item of desired) {
    if (have.has(item.identifier)) continue;
    try {
      // eslint-disable-next-line no-await-in-loop
      await Notifications.scheduleNotificationAsync({
        identifier: item.identifier,
        content: {
          title: item.title,
          body: item.body,
          data: item.data,
          sound: 'default',
          color: ACCENT,
          priority: 'high',
        },
        trigger: {
          type: TRIGGER_DATE,
          date: item.when,
          channelId: ANDROID_CHANNELS.REMINDERS,
        },
      });
    } catch {
      /* skip this one; keep scheduling the rest */
    }
  }

  setStatus({ localScheduled: desired.length });
}

/** Debug helper: what the OS currently has armed for us. */
export async function getScheduled() {
  if (!available()) return [];
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    return all.filter((n) => String(n.identifier || '').startsWith(LOCAL_PREFIX));
  } catch {
    return [];
  }
}

// -----------------------------------------------------------------------------
// Taps → navigation
// -----------------------------------------------------------------------------

/**
 * Route notification taps. Handles both cases:
 *   - app already running → the response listener fires
 *   - app launched *by* the tap → the last response is already waiting
 *
 * @param {(payload: { eventId?: string, type?: string }) => void} handler
 * @returns {() => void} unsubscribe
 */
export function addResponseListener(handler) {
  if (!available()) return () => {};

  const deliver = (response) => {
    const data = response?.notification?.request?.content?.data || {};
    if (data.eventId) handler({ eventId: String(data.eventId), type: data.type });
  };

  // Cold start: the OS handed us the tap before any listener existed.
  try {
    const last = Notifications.getLastNotificationResponse?.();
    if (last) {
      deliver(last);
      Notifications.clearLastNotificationResponse?.();
    } else {
      Notifications.getLastNotificationResponseAsync?.()
        .then((response) => {
          if (response) deliver(response);
        })
        .catch(() => {});
    }
  } catch {
    /* not fatal — a warm tap still routes through the listener below */
  }

  let sub = null;
  try {
    sub = Notifications.addNotificationResponseReceivedListener(deliver);
  } catch {
    sub = null;
  }
  return () => {
    try {
      sub?.remove();
    } catch {
      /* already gone */
    }
  };
}

/** iOS app-icon badge. No-op on Android, where the launcher owns the dot. */
export async function setBadgeCount(count) {
  if (!available()) return;
  try {
    await Notifications.setBadgeCountAsync(Math.max(0, count | 0));
  } catch {
    /* unsupported launcher — ignore */
  }
}

/** Clear the tray when the guest has read everything in the Alerts tab. */
export async function clearDelivered() {
  if (!available()) return;
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch {
    /* ignore */
  }
  await setBadgeCount(0);
}
