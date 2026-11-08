# Client feedback — Website — 8 November 2026

Source: 20 WhatsApp voice notes in `website requirements/` (18 unique, ~8 min, Sinhala).
Per-clip English: `website requirements/WEBSITE_CLIPS_ENGLISH.md`. Transcribed with OpenAI
`gpt-4o-transcribe` + `whisper-1`, translated/reconciled with `gpt-5`, cross-checked against `web/`.

**Overall message:** bring the website in line with the mobile app — same Follow / Following /
Alerts model, flyers never centre-cropped, "coming soon" instead of fake tickets — and remove
everything that is not live yet (Reels, in-app Tickets).

**Status:** everything implemented except the items waiting on the client (marked ⏳). Not yet
deployed — the live site changes only after the web app is redeployed.

## Clip-by-clip validation

| Clip | What he asked | Status | What the website does now |
|---|---|---|---|
| 10.47.10 | Hide the ticket price on Discover cards (it only showed one of several categories). | ✅ | Cards show no price; "View details" instead. Prices are listed on the event page. |
| 10.47.10 (1) | Discover flyers are cut (neck/heads). Show them from the top, like the app. | ✅ | Square card, flyer pinned to its top; no flyer → branded placeholder. |
| 10.47.10 (2) | "Browse by" order: All, Festival, EDM, Live Event, Concert, Hip Hop, then the rest. | ✅ | Exactly that order, then Party, Other. Chips group real category values (Concert = Concert + Live Concert; Live Event = Event + Live Set). |
| 10.47.11 | The logo shown isn't theirs — he'll send the right one. | ⏳ | Waiting on the logo file. |
| 10.47.11 (1) | Header "Artists" → "Artists & Organizers". | ✅ | Header, mobile menu and footer. |
| 10.47.11 (2) | Reels — postpone to the next update. | ✅ | Removed from header, footer, home page and artist pages (route kept, unlinked). |
| 10.47.12 | Follow option like the app + a way on Discover to see what you follow. | ✅ | Follow button (no account needed) on event pages, artist pages and the tickets panel; Discover has **For you / Following** tabs. Follows sync to the backend so organizer follower counts stay real. |
| 10.47.12 (1) | Do the rest (alerts) the same way as the app. | ✅ | See 10.47.13 (2). |
| 10.47.12 (2) | Remove "Tickets" from the header (not needed now). | ✅ | Removed from header icons and the mobile dock (replaced by Alerts). In-app reservation form removed from event pages. |
| 10.47.13 | The Discover caption "Find your next night out" — wants it changed. | ⏳ | Replacement wording unclear in the audio — **ask for the new copy**. |
| 10.47.13 (1) | Event page flyer is centre-cropped — show the whole flyer filling the hero, keep the blur. | ✅ | Hero shows the **whole** flyer at its own proportions (verified: rendered ratio = image ratio) over a blurred copy of itself; full-screen hero on desktop, flyer first on mobile. |
| 10.47.13 (2) | Alerts shouldn't need sign-in; follow companies and see their updates, like the app. | ✅ | `/alerts` works signed out: **Coming up** (reminders, followed companies first) + **New from companies you follow**; Alerts link always visible. |
| 10.47.14 | No ticket details → "Tickets coming soon / Stay tuned"; no auto "General Admission"; no auto flyer when none uploaded. | ✅ | Event page shows "Tickets coming soon — stay tuned" + Follow; old auto-created "General admission · Coming soon" rows are treated as no tickets; the stock photo fallback is replaced by a "Flyer coming soon" tile in the event's colour. |
| 10.47.14 (1) | Facebook / Instagram / TikTok icons next to each line-up artist; click opens the platform. Same as the app. | ✅ | Icons under each artist on the event page (only those entered). |
| 10.47.14 (2) | Workspace: remove "New reel"; "View as customer" → "View as user". | ✅ | Both done. |
| 10.47.14 (3) | Footer: remove "My tickets" (Your Stage) and "Reels" (Discover). | ✅ | Both removed; "Alerts" added under Your Stage. |
| 10.47.15 | Overview: "Tickets booked" → "Follow count"; add "Day count" → Upcoming events · Follow count · Event saves · Day count. | ✅ / ⏳ | Four tiles. **Day count = days until your next event** — his definition wasn't clear; confirm. |
| 10.47.15 (1) | Ticket name pre-filled "General Admission" must be erased before typing — make it type-straight-in (like the app). | ✅ | Field starts empty with "e.g. General admission" as a placeholder; tickets are optional (empty → "Tickets coming soon"). |

## Verification (2026-11-08, local dev server against the live API)

Automated browser walkthrough, desktop 1400 px + mobile 390 px. Read-only: the one write the UI
makes (guest follow) was intercepted in the browser and never reached the server; the studio was
rendered with a fake session answered locally.

- Header: Discover · Calendar · Artists & Organizers · Alerts — no Reels, no Tickets. Footer: no Reels / My tickets.
- Browse-by chips in the requested order; live counts e.g. EDM 9, Concert 5, Live Event 1.
- No prices on any card; event pages without a flyer show no stock image.
- Event page flyer: rendered aspect ratio equals the image's natural ratio (whole flyer).
- Line-up social links resolve to the right profiles; reservation form gone.
- Follow → "Following" persists across Discover (Following tab), the artist page and Alerts.
- Studio: nav = Overview · New event · Public profile · View as user; tiles = Upcoming · Follow count · Event saves · Day count.
- Editor: ticket name empty with placeholder, not required; line-up label "Add Artist Name".
- No page errors; `tsc --noEmit` clean.

## Open items — decided (2026-11-08, owner delegated the calls)

1. **Discover caption** — "Find your next night out." → **"Your next stage is waiting."** (a play on
   the brand name), with: "Festivals, EDM nights, live concerts and hip hop from every corner of the
   island. Follow the companies you love and never miss a drop." Site title and description updated
   to match; ticket wording removed since tickets are off the site.
2. **Day count** — the organizer's countdown: calendar days until their next published event, and
   which one ("16 days until Open to Close"; "Today — It's showtime" on the day; "Plan your next
   event" when there is none).
3. **Browse by** — exactly his list: All, Festival, EDM, Live Event, Concert, Hip Hop, **Others**
   (Party and anything new fall under Others). The event editor's categories now use the same names;
   the home page shortcuts match too.
4. **Logo** — the old striped-"S" wordmark is gone everywhere (header, home hero, footer). Replaced by
   the client's own mark (the app-icon mark) + STAGE, as one `BrandLogo` component.

Also polished in the same pass: flyer-less events get a stage-light placeholder whose colour varies
per event ("Flyer drops soon") instead of identical tiles; the studio greeting uses the full name
("Good to see you, Not Like Us." — it used to say "Not.").
