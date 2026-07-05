# Client Feedback & Change Requests — 2026-06-20

> **STATUS (2026-07-05): IMPLEMENTED.** All items below are built (details in
> "Implementation notes" at the bottom). Remaining to deploy: add the
> `ticketUrl` column to the live DB (`npx prisma db push` on the server, or
> `ALTER TABLE Event ADD COLUMN ticketUrl TEXT NULL;`) and restart pm2.

> Source: 6 WhatsApp voice notes (Sinhala/English) recorded 2026-06-20 ~18.44,
> plus a Sinhala translator's written summary and the client's answers to our
> follow-up questions (2026-07-05).
> This is the client reviewing the current build screen-by-screen. Below is the
> decoded, de-duplicated requirement list, grouped by screen and mapped to code.
> **All earlier open questions are now RESOLVED** — see "Decisions locked" below.

## Decisions locked (client's answers)

| # | Question | Decision |
|---|----------|----------|
| 1 | Expired events in calendar | **Disable** the day (greyed/non-highlighted), **but tapping it still shows** what event was there. |
| 2 | "IP" / "AD" field | **Leave as-is.** No change. |
| 3 | Rename "Event" label | Rename to **"Timeline"** (translator heard "Wall"; client confirmed **Timeline**). |
| 4 | Third-party ticket link | **One link per event.** Triggered by **"Book Now"** → jumps to the third-party ticketing platform. |
| 5 | Tour Mode / Policy / Verification Pending / Tips-Reviews | **Leave them.** Don't remove, no explanation needed right now. |

## TL;DR — What he's actually asking for

Mostly small UI/UX polish plus a few real changes. The substantive ones:

1. **Ticketing goes third-party.** Remove the in-app ticket *selection* flow for
   guests. Guest side becomes **display-only** (ticket types + price). The button
   is renamed **"Buy Now"/"Buy Tickets"** and jumps **straight to the external
   ticketing platform** via a **single third-party link per event** (organizer
   pastes it on the create-event form).
2. **Reminders / follow alerts.** Alerts are **currently broken** — fix them.
   Reminder lead time → **~5 days**. If a **followed** company publishes an event,
   the user gets an alert. Every alert must show the **event company name**.
3. **Trim the organizer app** to essentials now (Followers count, New Event,
   Edit Profile, Edit published event, Active Events on Home) and hide the rest
   (insights, ticket-counter, reels/views, reviews).

Everything else is polish: rename labels, resize/bold fonts, recolor icons,
remove dead icons, add a grey page border, swap typed inputs for pickers.

---

## A. Guest — Event Detail page (`features/events/EventDetailScreen.jsx`, `EventHero.jsx`, `EventStepCard.jsx`)

- **Remove "Event by".** Show only the **company name**, **bigger font**.
  (Example seen: "Event By La Foresta" → just "La Foresta".)
- **Order inside the event:** **company name on top**, **event name below it**.
- Add a **thin grey line/border box around the whole page** so each card reads as
  separated.
- **Recolor the icon(s)** (currently pink/rose) to a different color.
- **Shrink the "Follow" button/box.**
- **Ticket button:** make it **narrower and shorter**, change its style, and
  **rename "Book Tickets" → "Buy Tickets"**.
- **Rename the "Event" label → "Timeline"** and **change its icon** too.
- **Description "See more" is broken** — fix the expand/collapse.
- **Line-up & description fonts → bold**, and make the **two visually separated**
  (currently they look clipped/run together).
- **Share & Save icons (top of event):** confirm they work. **If not working,
  remove them for now.**
- **Hide the Cancellation & Policy** block for now.

### Tickets on the event page (the big change)
- **Remove the ticket *selection* UI for guests.** Just **display the ticket
  types** (like a notice/read-only list).
- Button becomes **"Buy Now"** → jumps **directly to the third-party ticketing
  platform** (using the event's single third-party link).
- **Ticket price must still be shown** alongside.
- Organizer keeps full ticket setup on their side; guest side is display-only.

## B. Guest — Events home / Company cards (`EventsHomeScreen.jsx`, `CompanyCard.jsx`)

- **Company-first:** event **company name** on top (bigger font OK), category/event
  name below. Focus is the company.
- **Follow alerts:** when a **followed** company publishes an event, surface it in
  the alert feed. (See §E.)

## C. Guest — Search (`features/search/SearchScreen.jsx`)

- Change the search placeholder / mode to **"Search on stage"**.
- **Remove venues** from the search results/list.
- Return **Artists + Events** (drop News).
- **Recently-viewed events row under the search box has a UI issue** — fix it.
- **Improve the search bar with live suggestions:** typing e.g. **"L"** should
  **suggest matching results** as you type (autocomplete).
- Location search (e.g. "Ella") should return companies + events there.

## D. Guest — Calendar (`features/calendar/CalendarScreen.jsx`, `MonthCalendar.jsx`, `UpcomingEventsScreen.jsx`)

- **Expired events (LOCKED):** once the date passes, **disable** the day (greyed,
  not highlighted), **but tapping it still opens/shows the event that was there.**
- The **"For You / Following" heading font** in Upcoming Events is too big —
  **match it to the event's font size**.
- **Rework the month calendar structure** for Month & Year views (current layout
  doesn't scale when a day/month has many events; show ~2 per row, cleaner shape).
- On date tap a **dot is left above** the day — **remove the dot**, keep only the
  highlight.

## E. Guest — Notifications / Alerts (`features/notifications/NotificationsScreen.jsx`, `services/notifications.js`)

- **Alerts are broken** (worked in an earlier version) — investigate & restore.
- **Reminder lead time:** **2 days → ~5 days** before the event.
- **Every alert must show the event company name.**
- **Follow-driven alert:** followed company publishes → alert (dot/badge/message).
- Move the **"organising event / register" item** out of the alert section.

## F. Organizer app — Home / Insights / Profile (`features/artistApp/ArtistHomeScreen.jsx`, `InsightsScreen.jsx`, `ArtistMyProfileScreen.jsx`, `MyEventsScreen.jsx`)

Trim to essentials for now:

- **Under organizer name:** keep **Followers count**. **Remove** reels & ticket-view
  stats.
- **Verification pending:** **leave as-is** (locked). It's unclear what it does but
  client says keep it for now.
- **Keep:** New Event, Edit Profile.
- **Remove for now:** Insights, Reels views, Reviews, Views count.
- **Move Active Events onto the organizer Home page.**
- **Remove Ticket Counter.**
- **Duplicate "+" icon:** two plus icons near Event/Insight — **remove one**.
- **Organizer profile stats:** remove **Reels** and **Views**; keep Followers +
  Events.
- **Edit (event) isn't working** — fix it.
- **Add a new "day count"** on the organizer profile/home (days until event / days
  active — confirm exact meaning with client, but the widget is wanted).
- The org section in general **needs clearer copy** — client found several items
  hard to understand.

## G. Organizer app — Create / Edit Event (`features/artistApp/EventCreatorScreen.jsx`, `CreateHubScreen.jsx`)

- **Title field:** add placeholder **"Add your event title"**.
- **Category:** replace free text with a **preset selection**:
  **Live Concert, EDM, Festival, Hip Hop, Event, Other.**
- **Date & Time:** replace typed inputs with **date & time pickers (selection).**
- **Tickets:** **remove "Quantity"**; keep **Type name + Price**.
- **Add the single third-party ticket link field** on the create-event form — this
  is what "Buy Now" jumps to on the guest side (§A). One link per event.
- **Artists / Line-up:**
  - Add an **"Other — Revealed Soon"** option/box for artists announced later.
  - Line-up: first few artists fixed/mandatory; remaining ~3 **reorderable**.
  - **Remove the "Support" label** from headliner/support labels.
- **Promotion & Social:** add the company's **Facebook/socials + photos**.
- **Edit published event must work** (organizers add surprise artists / adjust
  ticket prices after publish) — fix the edit flow.
- **Tour Mode / Policy / Tips-Reviews:** **leave as-is** (locked, no change now).

---

## Suggested build order (cohesive, not piecemeal)

1. **Third-party ticketing** end-to-end: create-event single link field → schema →
   guest display-only tickets → "Buy Now" external jump (A, G, backend).
2. **Notifications/alerts** rework: fix broken alerts, 5-day reminder, company name
   on every alert, follow→publish alert (E, B, `services/notifications.js`,
   backend notifications module).
3. **Organizer app trim** (F) — hide widgets, move Active Events to Home, day count.
4. **Create/Edit event UX** (G) — pickers, category presets, lineup reorder,
   remove quantity, edit-after-publish, "Revealed Soon".
5. **Calendar** (D) — disable-but-tappable expired days, remove dot, resize
   heading, rework month/year structure.
6. **Search** (C) — "Search on stage", drop venues/news, live suggestions, fix
   recent-events row.
7. **Guest cosmetic pass** (A/B) — Timeline rename + icon, grey border, recolor
   icons, bold fonts, shrink Follow/ticket buttons, fix See-more, dead icons,
   hide cancellation/policy.

## Resolved details

- **"Day count"** widget (F) → **countdown to the event** (days *until* the event),
  not days-active.
- **Icon recolor → DONE.** New accent is **electric violet `#7C5CFF`** (soft
  `#9B82FF`, deep `#5E3EE6`), swapped in `Project/src/theme/tokens.js`. This is the
  app-wide `accent` token (primary action / focus / active), so every pink icon,
  button and highlight now reads violet. The dead `neonPink*` tokens (unused
  anywhere) were left as-is.

---

## Implementation notes (2026-07-05)

### Backend (`backend/`)
- `prisma/schema.prisma` — `Event.ticketUrl` (TEXT, nullable). **Needs `prisma db push` + pm2 restart on deploy.**
- `modules/events/schema.js` — `ticketUrl` accepted on create/update; ticket `total` now defaults to 10000 (quantity removed from the form).
- `modules/events/service.js` — lineup roles: only slot 1 = "Headliner" (Support removed); search matches organizer name/handle; `update()` now syncs ticketTypes (update in place / create / delete surplus) so post-publish price edits work.
- `modules/notifications/service.js` — reminder window 2 → **5 days** (T-1…T-5); every item carries `companyName` / `companyId` / `companyAvatarUrl`.

### Guest app (`Project/`)
- **Third-party ticketing:** `EventDetailScreen` + `EventStepCard` "Buy Now"/"Buy Tickets" open `event.ticketUrl` directly (fallback: in-app guest reserve). `TicketTypeRow` is display-only (no radio/qty). Note under tickets when a link exists.
- **Event page:** company-first order (big company name → event), thin grey border card, compact Follow pill, expandable **See more** description, bold un-clipped "Line Up" heading, Share wired to native share sheet, Save bookmark removed (dead for guests), Cancellation & Policy section removed.
- **Timeline:** bottom tab renamed Events → **Timeline** with new icon (`albums`).
- **Alerts:** 5-day reminders with "In X days" badges; company name on every card; **"New from companies you follow"** section (follow → publish alert); **unseen badge (count) on the Alerts tab icon**, cleared when opened; leftover active-tab dot removed from `BottomTabBar`; local push reminders now T-5 + T-1 and name the company; manager-register CTA moved to the Calendar screen footer.
- **Calendar:** title font reduced; events render **2 per row** (`EventCard` grid variant, company name on top); past events greyed + "Ended" but **still tappable**; discreet manager entry at the bottom.
- **Search:** placeholder "**Search on stage**"; Venues removed; results = Artists & companies (organizers are searchable/followable/openable) + Events; events also match company + lineup names; category chip row no longer clipped (`flexGrow: 0`).

### Organizer app (`Project/`)
- **Tabs:** Home · Events · Profile (Insights tab + duplicate centre "+" removed).
- **Home:** KPIs = Followers + **days-to-next-event countdown**; New Event + Edit Profile actions; **Active events list moved to Home** with per-event Edit button; chart/insights removed.
- **My Events:** Edit now opens the **real editor** (was a stub alert); ticket-remaining + reels stats removed; Lineup + **Days-to-go** shown instead.
- **Profile:** stats = Followers + Events (Reels/Views removed).
- **Create/Edit Event (`EventCreatorScreen`):**
  - Edit mode: pass an event → prefilled, "Save changes", `eventsRepo.update` (surprise artists + price changes post-publish).
  - Title placeholder "**Add your event title**".
  - Category presets: **Live Concert / EDM / Festival / Hip Hop / Event / Other**.
  - **Date & time via selection chips** (year/month/day/start/end/minutes) — no typing.
  - Tickets: **Type name + Price only** (Quantity removed).
  - **Third-party ticketing link** field (powers guest Buy Now).
  - Lineup: **"Revealed Soon"** quick-add (surprise slot), reorder ↑↓ (headliner fixed), Support label gone.
  - Promotion & socials: Facebook page + Instagram + TikTok + flyer URL.

### Verification
- All 23 changed frontend files parse clean under `babel-preset-expo`.
- Backend modules pass `node --check`; `prisma validate` OK.
- Not yet run against the live backend — deploy steps: push schema, restart `events-ai` (pm2, port 8011), then smoke-test `/api` health + create/edit an event end-to-end.

---

## E2E Verification run (2026-07-05)

Backend was driven end-to-end against an isolated test DB (SQLite harness,
same Prisma code paths; live DB untouched). Server on :8899, seeded with the
standard seed script, exercised over HTTP exactly as the app calls it.

| # | Flow driven | Result |
|---|-------------|--------|
| 1 | `POST /events` with `ticketUrl`, category "Live Concert", tickets **without quantity**, lineup with "Revealed Soon" | ✅ created; `total` defaulted to 10000; `ticketUrl` persisted; lineup roles `Headliner` / `''` |
| 2 | `PATCH /events/:id` — reveal surprise artist, change prices, add a ticket type, swap ticket link | ✅ all persisted; "Revealed Soon" → "Surprise Star" |
| 3 | `PATCH` shrinking 3 ticket types → 1 | ✅ surplus rows deleted, remaining updated in place |
| 4 | `GET /notifications` with events 2 and 4 days out | ✅ `T-2` + `T-4` items (5-day window live), every item carries `companyName`, message reads "In N days: Company · Event at Venue" |
| 5 | `GET /events?search=Foresta` (company name) | ✅ 3 La Foresta events returned |
| 6 | `GET /events?search=Ella` (city) | ✅ matches |
| 7 | 🔍 `ticketUrl: "not-a-url"` | ✅ clean 400, field-level `Invalid url` |
| 8 | 🔍 edit another company's event | ✅ 403 |
| 9 | 🔍 unauthenticated create | ✅ 401 |
| 10 | 🔍 guest reserve fallback (`POST /tickets/reserve`) with the app's field names | ✅ active ticket issued |

Frontend: all 23 changed files parse clean; app boots in Expo Go on the
Android emulator (bundle OK, 1176 modules). Release APK built from this tree.

**Deploy prerequisites (unchanged):** live DB needs `ticketUrl` column
(`ALTER TABLE Event ADD COLUMN ticketUrl TEXT NULL;` or `prisma db push`),
then deploy backend + `pm2 restart events-ai`. Until then the released app
degrades gracefully: Buy Now falls back to the in-app reserve flow because
the old API simply doesn't return `ticketUrl` (and strips it on create).
