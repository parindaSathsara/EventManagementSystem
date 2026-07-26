# Client Feedback & Change Requests — 2026-07-09

> **STATUS (2026-07-26): IMPLEMENTED.** All items below are built. Remaining to
> deploy: `npx prisma db push` on the live DB (adds `Event.ticketUrl` — still
> pending from the last round — **plus the new `GuestFollow` table**), then
> `pm2 restart events-ai`.

> Source: 4 WhatsApp voice notes (Sinhala) recorded 2026-07-09 ~15:46–16:08,
> transcribed to English in `transcripts/` (see `ALL_CLIPS_ENGLISH.md`).
> This round is the client reviewing the previous build. Grouped below by clip,
> mapped to code, with implementation notes.

## Clip 1 — UI walkthrough (the bulk)

| # | Request | Done |
|---|---------|------|
| 1 | Logo is red & black → change the purple (violet) buttons to **red** | `theme/tokens.js`: `accent #FF3B3B`, `accentSoft #FF6B6B`, `accentDeep #D91E1E`; every hardcoded violet `rgba(124,92,255,…)` swapped to `rgba(255,59,59,…)`; creator cover gradients re-tinted |
| 2 | "Buy Tickets" centered → move it **to the right** | `EventStepCard`: pill is `alignSelf: 'flex-end'` |
| 3 | "See More" doesn't show full text → tapping it should **open the event** | `EventStepCard`: See more now opens the event page (where the full description expands) |
| 4 | Back from an event jumps to the top of the wall → return to **that event's position** | `GuestTabs`: stacked screens (event/booking/artist/search) now render as an **overlay** — the Timeline stays mounted underneath, so back restores the exact scroll position |
| 5 | Remove the **"Headliner"** label under the first artist | `LineupRow`: role tags removed entirely (order carries the billing) |
| 6 | Alert topic font should match **"For You / Following"** in the timeline | `NotificationsScreen`: "Alerts" heading now uses the same 15px headingBold style |
| 7 | Remove the lone ticket **category next to "Buy Now"** (confusing — types are listed above) | `EventDetailScreen` buy bar: shows "Tickets from + price" only, no type name |
| 8 | **Followers count broken** (regression) | Root cause: after the guest-first rework, follows became device-local only, so the DB `followerCount` never moved. Fixed end-to-end — see "Followers count fix" below |
| 9 | "Reveal Soon" shows "No Social Link Added" → replace with *"More artists are coming soon from the event companies below"* + upcoming-events count | `ProfileSheet` gets a `note`; tapping a Revealed Soon slot shows the new sentence, the **upcoming-event count**, and the company's upcoming events list |
| 10 | **Disable "Buy Tickets"** once the event date/time has passed | `EventStepCard` + `EventDetailScreen`: after `endsAt` the button greys out ("Event ended"/"Ended") and does nothing |
| 11 | Minutes picker applies to both start & end → make them **separately settable** | `EventCreatorScreen`: separate "Start minutes" and "End minutes" chip rows |
| 12 | Profile categories → **Event Company, Artist, Musician, Band, Other** | `BecomeArtistScreen` + `EditArtistProfileScreen` (default: Event Company). Also fixed `artists.become()` silently dropping `category` |
| 13 | **"+" icon between search and refresh** on the timeline for event companies/managers to create an event; creation ties into the calendar | `EventsHomeScreen` header: new `add-circle-outline` button routes to the manager login → creator flow (published events already land on the calendar) |

## Clip 2 — Question: does editing re-surface the event?

> "After we edit a published event (add artists / change prices), does it pop
> up again for everyone who followed it? Is there an algorithm?"

**Answer is now YES, by design:** alert freshness keys on `updatedAt`
(`useUnseenAlerts`), so an edited event **re-surfaces at the top of followers'
alerts**, re-lights the unseen badge, and the card reads **"Updated their
event"** with an `UPDATED` pill (`NotificationsScreen`). No ranking algorithm —
it is simply newest-first by publish/update time, and the reminder feed stays
date-based.

## Clip 3 — "I can't upload photos / can't find how to capture a flyer"

Root cause: the "Upload" tile on the create-event screen was **dead** (no
handler) — the only way to attach a flyer was a buried URL text field. That is
why it "didn't work" and couldn't be found; it was not the client's device.

Fixed in `EventCreatorScreen`:
- Section renamed **"Event flyer"**, top of the form.
- Two big obvious buttons: **Upload flyer** (gallery) and **Take photo**
  (camera), using `expo-image-picker` (plugin + permissions were already in
  `app.json`).
- Upload streams through the existing `POST /uploads/image` pipeline with a
  **progress bar**, sets `bannerImageUrl` + `flyers[0]` on save, live preview
  in the banner card, and a remove (trash) button.
- The URL field remains as a fallback, relabelled "…or use Upload flyer above".

## Clip 4 — Flyer display

- **Wall:** flyer used to be centre-cropped (top of the artwork cut off). Now
  portrait flyers are **top-aligned** — the top shows exactly as uploaded and
  only the bottom is cropped (`TopAlignedPoster` in `EventStepCard`).
- **Event page:** hero now shows the **whole flyer** at its natural aspect
  ratio (no 16:9 crop; very tall flyers letterbox within a 1.5×width cap), and
  the **company detail box renders directly below** it (`EventHero`).

## Followers count fix (backend + app)

- `prisma/schema.prisma`: new **`GuestFollow`** table (`deviceId` + `artistId`,
  composite-unique) → **needs `prisma db push` on deploy**.
- `modules/artists`: public `POST /artists/:id/guest-follow`
  `{ deviceId, follow }` — idempotent; `followerCount` only moves when a row is
  actually created/deleted, so retries can't double-count.
- App: `followRepo` mints a persistent per-install device id and fire-and-forget
  syncs every follow/unfollow. Local state stays the device's source of truth;
  the organizer's Followers KPI now reflects real guest follows.

## Rebrand addendum (2026-07-26) — "Stage", full red & black

- **App renamed EventSocial → "Stage"** everywhere a user sees it: `app.json`
  (`name` + permission-dialog strings), Android launcher
  (`android/…/values/strings.xml`), RoleSelect title, Signup subtitle, share
  messages, connection-error copy. `slug` (`event-social`), the EAS project id
  and the Android package (`com.aahaas.eventsocial`) are **deliberately
  unchanged** — changing those would break OTA updates / make it a different
  app on devices.
- **Theme is now strictly red & black**: the second accent token
  (`highlight`, previously neon green) is now red `#FF5252`, which re-skins
  verified badges, LIVE tags, the map button, done-steps, urgent reminder
  badges, etc. All legacy hardcoded pink (`rgba(255,84,130,…)`) and green
  (`rgba(0,255,161,…)`) chrome across 16 files swapped to the red family. Dead
  `neonPink*`/`neonGreen` tokens deleted. Functional status colors (amber
  warn, error, blue info) and the content palettes (event cover gradient
  choices, reel filter previews) intentionally keep their variety.
- **Logo**: the replaced `assets/Logo/logo.png` does NOT flow into a locally
  built APK by itself — launcher icons/splash are baked PNGs in `android/res`.
  `npx expo prebuild --platform android --no-install` was run: all mipmap
  launcher icons + splash logos regenerated from the new logo; `app_name`
  stayed "Stage"; the custom `gradle.properties` JVM memory bump survived.

## Verification (2026-07-26)

- All 17 changed frontend files parse clean under `babel-preset-expo`.
- Backend modules pass `node --check`; `prisma validate` OK.
- Not yet run against the live backend.

**Deploy steps:** on the server — `npx prisma db push` (adds `ticketUrl` +
`GuestFollow`), deploy backend, `pm2 restart events-ai`, smoke-test `/api`
health, then rebuild the APK from this tree. Until the backend is deployed the
app degrades gracefully: guest-follow sync calls simply fail silently and
counts stay local-only.
