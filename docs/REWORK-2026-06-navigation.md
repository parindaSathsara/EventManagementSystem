# Rework 2026-06 · Navigation

**Date:** 2026-06-14

## Bottom navigation

| Before (`CustomerTabs`) | After (`GuestTabs`) |
| --- | --- |
| Feed · Calendar · Search · Tickets · You | **Reels · Events · Notifications** |
| Landed on **Calendar** | Lands on **Events** |
| Reels was the "Feed" entry | Reels is now just a tab (no longer the entry point) |

- **`GuestTabs`** (`src/navigation/GuestTabs.jsx`) is the new default shell for
  guests. It manages a push/pop stack for `event`, `booking`, `artist`,
  `calendar`, and `search`.
- **Calendar** and **Search** are reached from the Events header icons
  (📅 / 🔍) and are pushed screens (both now accept `onBack`).
- **Event managers** still use **`ArtistTabs`** (Home · Events · ➕ · Insights ·
  Profile) — the Profile tab only exists in the manager app, satisfying
  "if event manager logs in → profile".

## Manager login entry

A discreet 🔑 (`key-outline`) icon appears in the Events header and the
Notifications header. Tapping it calls `onManagerLogin` → `App.js` opens the
login screen. See `REWORK-2026-06-guest-mode.md`.

## Calendar (Year / Month / Day)

`MonthCalendar` (`src/features/calendar/components/MonthCalendar.jsx`) gained a
segmented **Year / Month / Day** control modeled on edmcalendar.lk:

- **Year** — 12 mini-months, active months highlighted; tap drills into Month.
- **Month** — the original day grid with event dots (default).
- **Day** — single-day view; the event list renders below in `CalendarScreen`.
- Prev/next arrows step by the active unit. `CalendarScreen` now defaults to the
  current month/day (was hard-coded to May 2026).
