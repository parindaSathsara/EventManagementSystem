# EventSocial Screen Structure Specification

Purpose:
- Define screen-by-screen UI structures for implementation and design handoff.
- Keep Phase 1 and Phase 2 boundaries explicit.

---

## 1. Customer Mobile Screens

## 1.1 Auth and Onboarding

### A1. Welcome and Login Choice
- Purpose: start auth flow
- Components:
  - brand header
  - phone OTP CTA (primary)
  - email login CTA (optional)
  - social login row (optional)
- States: normal, service unavailable
- Phase: 1

### A2. OTP Verify
- Components:
  - phone display
  - OTP code inputs
  - resend timer
- States: invalid OTP, expired OTP, success
- Phase: 1

### A3. Profile Setup
- Components:
  - name input
  - avatar upload
  - city/timezone picker
- States: validation errors
- Phase: 1

## 1.2 Feed and Engagement

### C1. Reels Feed
- Components:
  - full-screen video
  - right action rail (react, repost, save, share, report, follow)
  - artist/event quick labels
  - top segment toggle (For You/Following optional)
- States:
  - loading skeleton
  - no content
  - playback error
- Phase: 1

### C2. Repost Composer
- Components:
  - reel preview
  - optional caption input (policy controlled)
  - visibility selector (public/followers/private)
- States: caption disabled policy, submit success/failure
- Phase: 1

### C3. Report Sheet
- Components:
  - reason list
  - optional details input
  - submit action
- States: submitted confirmation
- Phase: 1

## 1.3 Artist and Event Discovery

### C4. Artist Profile (Event-First)
- Components:
  - artist hero (badge, category, city, social links)
  - tabs: Events (default), Reels, About
  - follow button
- States: suspended artist, no upcoming events
- Phase: 1

### C5. Event Detail
- Components:
  - hero poster/banner
  - title, lineup, datetime, venue, age restriction
  - cancellation/refund summary
  - event storyline reel carousel
  - CTAs: Save + Book
- States:
  - cancelled event
  - rescheduled event
  - sold out/waitlist (Phase 2)
- Phase: 1 (waitlist UI in phase 2)

### C6. Search
- Components:
  - global search bar
  - tabs/chips for Artists, Events, Venues
  - filters drawer (date, location, category, age)
- States: no results, network error
- Phase: 1

### C7. Calendar
- Components:
  - month calendar with dots
  - day event list
  - near-me toggle + radius
  - manual location selector
  - filter chips
- States:
  - location denied
  - no events for day
- Phase: 1

## 1.4 Personal Area

### C8. My Tickets
- Components:
  - ticket list cards by upcoming/past
  - status labels
- States: empty state
- Phase: 1 (free reservation), 2 (paid enhancements)

### C9. Ticket Detail
- Components:
  - QR code
  - event summary
  - usage status
  - support/refund info (Phase 2)
- States: invalid/cancelled/refunded
- Phase: 1/2

### C10. Profile and Settings
- Components:
  - My Vibes (reposts)
  - Saved items
  - Followed artists
  - notification toggles
  - privacy toggles
- States: private visibility previews
- Phase: 1

---

## 2. Artist Mobile Screens

### AR1. Verification Application
- Components:
  - legal name
  - stage name
  - contact verification state
  - ID upload
  - social link fields
  - optional portfolio upload
- States: draft, submitted, rejected, approved, reverification_required
- Phase: 1

### AR2. Verification Status
- Components:
  - status badge
  - review timeline
  - action CTA (resubmit if rejected)
- Phase: 1

### AR3. Reel Creator
- Components:
  - video picker/upload
  - cover selector
  - caption
  - tags
  - optional linked event
  - publish button (enabled for verified artist)
- States: upload progress, failed processing
- Phase: 1

### AR4. Event Creator/Editor
- Components:
  - title/description/category
  - start/end datetime
  - venue selector/map
  - age restriction
  - banner upload
  - artists lineup selector
  - publish/submit for approval
- States: draft, pending approval, published, rejected
- Phase: 1

### AR5. Artist Insights
- Components:
  - top KPI row (views, reactions, reposts, event clicks)
  - trend chart
  - top performing reels/events
  - booking conversion panel (expanded in phase 2)
- Phase: 1 (booking depth in phase 2)

---

## 3. Admin Web Screens

### AD1. Dashboard
- Components:
  - KPI cards
  - pending verification count
  - report volume trends
  - upcoming events snapshot
- Phase: 1

### AD2. Users Management
- Components:
  - searchable/filterable table
  - status/role actions
  - user detail drawer
- Phase: 1

### AD3. Artist Verification Queue
- Components:
  - request list by status
  - document preview panel
  - approve/reject/suspend actions
  - notes field
- Phase: 1

### AD4. Events Management
- Components:
  - table with status chips
  - create/edit/reschedule/cancel actions
  - approval queue toggle
  - change log timeline
- Phase: 1

### AD5. Venues Management
- Components:
  - map + table layout
  - venue CRUD
  - capacity and location validation
- Phase: 1

### AD6. Moderation Queue
- Components:
  - reports list with reason/severity
  - target preview panel
  - actions panel (remove/restore/suspend/ban/reverify)
  - strike history
- Phase: 1

### AD7. Analytics and Export
- Components:
  - user growth charts
  - event and engagement metrics
  - CSV export controls
  - revenue/refund modules (phase 2)
- Phase: 1 core, 2 finance expansion

### AD8. Policy Settings
- Components:
  - reaction type configuration
  - moderation auto-hide thresholds
  - event approval mode by region
  - repost caption policy
- Phase: 1

---

## 4. Public Deep-Link Preview Pages

### W1. Reel Preview
- Components:
  - poster/thumbnail
  - short description
  - open in app CTA
  - app store fallback CTA
- Phase: 1

### W2. Event Preview
- Components:
  - poster
  - date/time/venue summary
  - open in app CTA
- Phase: 1

### W3. Artist Preview
- Components:
  - artist summary
  - upcoming events count
  - open in app CTA
- Phase: 1

---

## 5. Universal UI Structures

Must exist across all product surfaces:
1. Loading placeholders
2. Empty states with clear next action
3. Retry for network failures
4. Permission-denied messaging
5. Confirm dialogs for destructive actions
6. Toast/snackbar feedback for all successful mutations

---

## 6. Screen Delivery Priority

Priority P1 (build first):
- C1, C4, C5, C7, AR1, AR3, AR4, AD3, AD4, AD6

Priority P2:
- C6, C8, C10, AR5, AD1, AD2, AD7

Priority P3:
- Deep-link pages and refinements (W1/W2/W3), advanced analytics layouts

