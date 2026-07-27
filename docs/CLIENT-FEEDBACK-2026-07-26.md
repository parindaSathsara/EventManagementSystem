# Client Feedback & Change Requests — 2026-07-26

> **STATUS: IMPLEMENTED (code).** No DB migration needed for this round —
> `User.avatarUrl` already exists in the schema. Deploy = commit + push, run
> `./deploy/gcloud-deploy.sh` from `backend/`, rebuild the APK.

> Source: 2 WhatsApp voice notes (Sinhala) recorded 2026-07-26 ~18:28 and
> ~18:35, transcribed to English in `transcriptsnew/NEW_2_CLIPS_ENGLISH.md`.
> The client reviewed the build after the 2026-07-09 round. He is sending a new
> logo separately — **not part of this change set**.

## Clip 1 — UI walkthrough

| # | Request | Done |
|---|---------|------|
| 1 | Account setup says **"artist profile"** → call it **"stage profile"** | `BecomeArtistScreen`: header "Become an Artist" → **"Stage Profile"**, hero "Set up your **stage** profile", CTA "Create **stage** profile", success alert "Welcome to Stage!". Also `EditArtistProfileScreen` empty state and the `ArtistTabs` gate alert. API/DB keep the `artist` naming — labels only |
| 2 | Handle field shows the example name **"Mihiran"** → show **"Enter name"** | `BecomeArtistScreen` + `EditArtistProfileScreen`: handle placeholder is now `Enter name` |
| 3 | Bio box → **"Enter short bio"** | Both screens: bio placeholder is now `Enter short bio` (was "Producer, DJ, live electronics.") |
| 4 | Edit profile: replace **Spotify with TikTok** | `EditArtistProfileScreen` socials row is Instagram / **TikTok** / YouTube, `logo-tiktok` icon, saved under the `tiktok` key. Mirrored on the profile **About** tab and the **Verification** application card |
| 5 | The **"your handle"** box must follow the same change | TikTok field placeholder is `@yourhandle`, matching Instagram |
| 6 | YouTube → **"channel name"** | Already `Channel name` — verified, left as is |
| 7 | **Bug:** profile → **Upcoming Events**, tapping an event does nothing | Real bug: `EventListRow` was a plain `<View>` with a decorative chevron and no handler, and the screen was never given an `onOpenEvent`. Row is now a `TouchableOpacity`; `ArtistTabs` passes `onOpenEvent` → event detail. Past events open too |
| 8 | Home **Active Events** date is black, hard to read → **white** | `EventCard`: the shared `dateBadgeDay` is black because the default/grid variants sit on a **white** chip; the `compact` variant's badge is dark (`surface2`), so black-on-dark was invisible. Added `dateBadgeDayOnDark` (white) for the compact variant only |
| 9 | Remove the **"Headliner"** label on event creation | `EventCreatorScreen`: slot #1 badge was `HEADLINER`, now `ARTIST #1` like the rest. Backend `buildLineup()` also stopped stamping `role: 'Headliner'` — it was still leaking into the artist bottom-sheet subtitle |
| 10 | **"Buy Ticket" still opens the old in-app form** → link straight to the third-party platform | Removed the fallback everywhere: `EventDetailScreen.handleBuy` and `EventStepCard.handleBuy` now only ever `Linking.openURL(event.ticketUrl)`. `BookingScreen` is unwired from `GuestTabs` (kept on disk like `ReelsScreen`). With no link set the CTA reads **"Tickets coming soon"** and is disabled |
| 11 | Timeline event page: drop **"Ticket from &lt;price&gt;"**, keep only **Buy Now** | `EventDetailScreen` buy bar: the price block is gone; Buy Now is now the full-width button in the bar. Prices still show in the **Tickets** section above |

### Note on #9 — asked twice

Item 5 of the 2026-07-09 round ("remove the Headliner label") was only applied
to the **display** side (`LineupRow`). The **create-event form** still printed
`HEADLINER` on the first lineup slot, and the backend still returned
`role: 'Headliner'`. That is what he saw again 17 days later. Both are fixed
now, so the label exists nowhere in the codebase.

## Clip 2 — Profile photos

> "In the accounts we developed before there was a place to show a profile
> photo. Now there's no place… Without a profile photo it looks a bit messy —
> like 'Wavescape', it only shows the letters."

| # | Request | Done |
|---|---------|------|
| 1 | Add **profile-photo upload during account creation** | New shared `AvatarPicker` component on `CompleteProfileScreen` — the step right after sign-up that already collects phone + city. Gallery or camera, square crop, live upload progress, remove button |
| 2 | Add **profile-photo editing** under the profile section | Same `AvatarPicker` at the top of `EditArtistProfileScreen`. The photo lives on `User`, so it is PATCHed via `/auth/complete-profile` (only when it actually changed) while the rest of the form still PATCHes `/artists/me` |
| 3 | Improve the **no-photo fallback** — bare initials look broken | `Avatar` rewritten: photoless accounts get a stable per-name red→dark gradient with a hairline edge instead of a flat grey circle. Initials logic fixed too — a single word now uses **two** letters ("Wavescape" → **WA**), previously it showed the lone "W" he complained about |

**Why the phone step and not the email step:** `POST /uploads/image` requires a
JWT. At the email/password screen no token exists yet; immediately after
sign-up it does. So the photo step sits on the screen right after sign-up —
which is also one of the two places he suggested ("after adding the phone
number").

## Backend changes

- `auth/schema.js`: `completeProfileBody` accepts `avatarUrl` (validated URL,
  max 500, **nullable** so the client can clear the photo).
- `auth/service.js`: `updateProfile()` writes `avatarUrl`; `undefined` leaves
  it untouched, `null` clears it.
- `events/service.js`: `buildLineup()` no longer assigns a `role` to slot #1.
- **No migration.** `User.avatarUrl String?` already existed; every read path
  (`/auth/me`, artists, events, notifications) already selects it, so an
  uploaded photo shows on the profile, the timeline cards, event pages and
  alerts with no further work.

## Not in this round

- **New logo** — the client said he'd send it the next day. When it arrives,
  replacing `assets/Logo/logo.png` is not enough on its own: launcher icons and
  splash are baked PNGs under `android/res`, so re-run
  `npx expo prebuild --platform android --no-install` (see the 2026-07-09 doc).

## Verification (2026-07-26)

- All 17 changed frontend files parse clean under `babel-preset-expo`.
- Changed backend modules pass `node --check`.
- Searched for dead references after the rewiring: no live `onOpenBooking` /
  `onBook` / `spotify` / `Headliner` paths remain (`CompanyCard` still has an
  `onOpenBooking` prop but that component is not rendered anywhere).
- Not yet run against the live backend or on a device.
