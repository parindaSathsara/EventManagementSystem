# Push notifications

How Stage alerts a guest, end to end — and the one credential step that has to
be done in the Expo/Firebase consoles before remote push can leave the server.

---

## The two paths, and why there are two

| | Local (on device) | Remote (server → Expo → FCM/APNs) |
|---|---|---|
| Owns | T-5 / T-1 / day-of **reminders** | **Announcements**: new event, updated, cancelled |
| Needs | nothing — no server, no Firebase, no network | Expo push credentials (see setup) |
| Fires when app is killed | yes | yes |
| Survives a reboot | yes (`RECEIVE_BOOT_COMPLETED`) | yes |
| Fails if | the guest denies OS permission | credentials missing, device offline for >TTL |

The split is deliberate. Reminders are the time-critical alert — "your event is
tomorrow" is worthless if it arrives late — so they ride the path that has no
moving parts. Announcements are things only the server can know, so they have to
be remote.

### Who owns reminders (the no-duplicates rule)

Both paths *could* send a reminder, which would double-notify. The rule:

- The app registers with the backend on every launch, refreshing
  `PushDevice.lastSeenAt`.
- An install seen within `PUSH_STALE_DEVICE_DAYS` (default 3) is considered to
  have a current local schedule → the server sends it **no** remote reminders.
- An install that has gone quiet can't have scheduled reminders for events
  announced since → the server covers it remotely.

So a guest gets exactly one of each, whichever path is in a position to deliver.

---

## Flow

```
 manager publishes an event
        │
        ├─ events/service.js  ──▶ notifications/service.dispatchEventAsync()
        │                              │
 5-min sweep (scheduler.js) ───────────┤   builder.notification() → title/body/dedupeKey
        │                              │
        │                        audienceDevices()      GuestFollow ⋈ PushDevice on deviceId
        │                              │
        │                        deliver()              claims a NotificationDelivery row
        │                              │                per (device, dedupeKey) — the dedupe
        │                              ▼
        │                    lib/expo-push.js  ──▶  exp.host  ──▶  FCM / APNs  ──▶  device
        │                              │
        └─ receipts, 15 min later ─────┘  DeviceNotRegistered → token retired
```

On the device, the tap lands in `services/notifications.js`
→ `addResponseListener` → `App.js` → `GuestTabs` → the event page.

---

## Files

**Backend**

| File | Role |
|---|---|
| `src/lib/expo-push.js` | Transport: send, chunking, retries, receipts, error classification |
| `src/modules/notifications/builder.js` | All alert copy + the dedupe keys. Pure functions |
| `src/modules/notifications/service.js` | Device registry, audience, delivery ledger, dispatchers, in-app feed |
| `src/modules/notifications/scheduler.js` | The 5-minute sweep |
| `src/modules/notifications/routes.js` | HTTP surface |
| `src/modules/events/service.js` | Fires `dispatchEventAsync` on publish / meaningful edit / cancel |

**App**

| File | Role |
|---|---|
| `src/services/notifications.js` | The whole client side: permission, token, channels, local schedule, tap routing |
| `src/services/deviceId.js` | The anonymous install id shared by follows and push |
| `src/shared/hooks/usePushNotifications.js` | Status + enable/disable/test for the UI |
| `src/features/notifications/screens/NotificationsScreen.jsx` | Alerts tab + the settings row |

---

## API

All guest-callable — the app has no accounts.

```
GET    /api/notifications?deviceId=…      in-app feed; deviceId ranks followed companies first
POST   /api/notifications/devices         { deviceId, expoPushToken?, platform?, appVersion?, enabled? }
GET    /api/notifications/devices/:id     { deviceId, enabled, hasToken, lastSeenAt, … }
PATCH  /api/notifications/devices/:id     { enabled }
POST   /api/notifications/test            { deviceId } — 10/hour/IP
POST   /api/notifications/dispatch        admin only; runs the sweep now
```

The raw push token is never returned — only `hasToken`.

---

## Setup: push credentials (required for remote push)

Local reminders work as soon as the app is installed. **Remote push needs
credentials, and this is the only step that can't be done from the repo.**

### Android (FCM v1)

1. Firebase console → create/open a project → add an **Android app** with
   package name `com.aahaas.eventsocial`.
2. Download `google-services.json` into `Project/`.
3. Point the app config at it — add to `app.json` under `expo.android`:
   ```json
   "googleServicesFile": "./google-services.json"
   ```
   Because `Project/android/` is committed and this project does not run
   `expo prebuild` (it would clobber the hand-edited manifest and splash
   config), also add to `Project/android/build.gradle` under
   `buildscript.dependencies`:
   ```gradle
   classpath('com.google.gms:google-services:4.4.2')
   ```
   and at the bottom of `Project/android/app/build.gradle`:
   ```gradle
   apply plugin: 'com.google.gms.google-services'
   ```
   with `google-services.json` copied to `Project/android/app/`.
4. Firebase console → Project settings → Service accounts → **Generate new
   private key** (this is the FCM v1 JSON, not the legacy server key).
5. Upload it to Expo:
   ```bash
   cd Project
   npx eas credentials        # Android → production → Google Service Account → FCM V1
   ```

### iOS

`npx eas credentials` → iOS → Push Notification Key. Requires an Apple
Developer account; EAS can generate the key for you.

### Verify

```bash
cd Project && npx eas build --profile preview --platform android
```
Install the APK, open the Alerts tab, toggle **Turn on**, then press **Test**.
The Test button only appears once the server actually holds a token for the
install, so its presence is itself the check that credentials are working.

Server-side check:
```bash
curl -s https://events-api.aahaas.com/api/notifications/devices/<deviceId> | jq
# → { "hasToken": true, "enabled": true, ... }
```

### Until credentials exist

Everything degrades cleanly:

- reminders still fire (local path — unaffected)
- the in-app Alerts tab is unchanged
- `PushDevice` rows are still created (heartbeat, enabled flag) with a null token
- `register()` returns `reason: 'TOKEN_UNAVAILABLE'` and the Alerts row says
  alerts are on without claiming remote delivery works
- the **Test** button stays hidden rather than failing

---

## Configuration

Backend env (all optional — the defaults are the shipped behaviour):

| Var | Default | Meaning |
|---|---|---|
| `PUSH_ENABLED` | `true` | Master switch. `false` keeps the in-app feed, sends nothing |
| `PUSH_SCHEDULER_ENABLED` | `true` | The 5-min sweep. Set `false` on all but one instance if ever clustered |
| `PUSH_SWEEP_INTERVAL_MS` | `300000` | Sweep period |
| `PUSH_REMINDER_HOUR` | `10` | Local hour reminders go out |
| `PUSH_TZ_OFFSET_MINUTES` | `330` | Audience timezone offset (Asia/Colombo) |
| `PUSH_REMINDER_DAYS` | `5,1` | Lead times in days |
| `PUSH_STALE_DEVICE_DAYS` | `3` | Quiet-install threshold for remote reminders |
| `PUSH_PUBLISH_CATCHUP_HOURS` | `48` | How far back the sweep looks for un-announced events |
| `PUSH_MAX_FAILURES` | `5` | Consecutive failures before a device is skipped |
| `PUSH_DELIVERY_RETENTION_DAYS` | `60` | Delivery-ledger pruning |
| `EXPO_ACCESS_TOKEN` | — | Only needed if "enhanced push security" is on for the Expo account |

---

## Deploying

The two new tables (`PushDevice`, `NotificationDelivery`) are additive, so the
project's usual `prisma db push` is safe:

```bash
# on the server, /var/www/events-ai
git pull --ff-only
cd backend
npx --no-install prisma generate
npx --no-install prisma db push --skip-generate
pm2 restart events-ai --update-env
pm2 logs events-ai --lines 30      # look for "[push:scheduler] every 300s …"
```

The app half needs an **APK rebuild** — the manifest gained notification
metadata and the drawables gained the notification icon, which `eas update`
cannot ship.

---

## Checks

```bash
cd backend && npm run check:notifications   # copy, dedupe, reminder window, delivery ledger
cd Project && npm run check:notifications   # the on-device reminder scheduler, against a fake OS
```

Neither needs a database or a network.

---

## Notes for future changes

- **Channel ids are a contract.** `builder.js` `CHANNELS` and
  `services/notifications.js` `ANDROID_CHANNELS` must stay identical; a
  `channelId` the app never created silently falls back to the default channel
  and loses its importance/vibration settings.
- **The Android small icon is a mask.** Any non-transparent pixel is painted in
  the accent colour, so `res/drawable-*/notification_icon.png` must stay a
  white-on-transparent silhouette. Regenerate from the badge rather than
  dropping in the full-colour logo, or the status bar shows a white blob.
- **Dedupe keys are permanent.** Changing a key's format re-sends every alert
  that used the old one.
- **Reminders go to followers only.** The in-app feed shows everyone every
  upcoming event; pushing that to everyone would be spam.
