# EventSocial Information Architecture

This document maps final requirements to product structure and navigation.

---

## 1. Product Surfaces

1. Customer mobile app
2. Artist mobile app
3. Admin web dashboard
4. Public web preview pages (deep-link landing)

---

## 2. Route-Level Topology

## 2.1 Customer App IA

Primary navigation:
- Feed
- Calendar
- Search
- Tickets
- Profile

Feed subtree:
- Reel detail overlay/actions
- Artist profile
- Event detail
- Report flow

Calendar subtree:
- Month view
- Day list
- Location selector
- Filter panel
- Event detail

Search subtree:
- Global search
- Artist results
- Event results
- Venue/city results
- Filtered result views

Tickets subtree:
- My tickets list
- Ticket detail (QR)
- Ticket status history

Profile subtree:
- My Vibes (reposts)
- Saved events/reels
- Followed artists
- Settings (privacy + notifications)

## 2.2 Artist App IA

Primary navigation:
- Home
- Create
- Events
- Insights
- Profile

Home subtree:
- Engagement summary
- Notification center

Create subtree:
- Create reel
- Create event

Events subtree:
- Draft events
- Published events
- Completed events
- Cancel/reschedule action

Insights subtree:
- Reel performance
- Event funnel performance

Profile subtree:
- Artist public profile editor
- Social links
- Verification status

## 2.3 Admin Web IA

Primary side navigation:
- Dashboard
- Users
- Artist Verification
- Events
- Venues
- Moderation
- Analytics
- Settings

Users subtree:
- User list + filters
- Role and status management
- User profile detail

Verification subtree:
- Pending queue
- Reviewed queue
- Request detail

Events subtree:
- Event list + status filters
- Event detail/editor
- Approval queue
- Change log viewer

Venues subtree:
- Venue list
- Venue create/edit
- Map validation

Moderation subtree:
- Reports queue
- Content review
- Action logs
- Strike history

Analytics subtree:
- Growth overview
- Engagement dashboard
- Event performance
- CSV exports

Settings subtree:
- Policies
- Reaction config
- Notification templates
- Regional event approval rules

## 2.4 Deep-Link Web IA

Public routes:
- `/reel/:id`
- `/event/:id`
- `/artist/:handle`

Each page includes:
- Content preview
- Open in app CTA
- Store fallback CTA
- Attribution capture

---

## 3. Content Model to UI Mapping

1. `artist_profiles` -> artist profile pages, badges, verification state
2. `reels` + reactions/reposts -> feed cards and engagement actions
3. `events` + `event_artists` + `event_changes` -> event pages, lineup, update history
4. `venues` + geo filters -> calendar and near-me explorer
5. `reports` + moderation actions -> moderation queue UX
6. `ticket_types` + bookings + tickets -> ticket purchase and ticket wallet
7. attribution tables -> campaign analytics and deep-link preview logic

---

## 4. Access and Visibility Rules in IA

1. Unverified artist content creation is blocked.
2. Customer comment routes do not exist.
3. Admin-only routes are fully hidden outside admin role.
4. Suspended accounts get restricted route access and status messaging.

---

## 5. Phase Boundaries in IA

Phase 1 mandatory:
- Feed, reactions, reposts, follow
- Artist verification and publishing
- Events + calendar + filters
- Admin moderation and approvals
- Deep-link previews and attribution

Phase 2 extensions:
- Paid checkout optimization
- Refund workflows and payout tools
- Waitlist and advanced scanning modes

---

## 6. Navigation Design Rules

1. Max 5 primary tabs on mobile.
2. Never hide critical event actions behind more than two taps.
3. Major event state changes must be visible in list and detail views.
4. Admin table actions must support keyboard and bulk operations.

---

## 7. Diagram Files

- Sitemap: `eventsocial_sitemap.mmd`
- Flow diagrams: `eventsocial_user_flows.mmd`

