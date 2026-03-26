# EventSocial — Full Product Requirements (Build-Ready Spec) v2.0

> **One-line:** A social-first events platform where **verified artists** publish reels and events, and **customers discover, react, repost, follow, and book tickets**.  
> **Key constraint:** Customers **cannot comment** (reduces toxicity + moderation load).  
> **Admin:** Web-based dashboard for verification, event ops, moderation, venues, reporting.  
> **Marketing-ready from day 1:** Deep links, deferred deep links, attribution, share pages, analytics events.

---

## Table of Contents
1. [Vision & Goals](#1-vision--goals)  
2. [Roles & Permissions](#2-roles--permissions)  
3. [Core Principles](#3-core-principles)  
4. [User Journeys](#4-user-journeys)  
5. [Functional Requirements](#5-functional-requirements)  
6. [Event Lifecycle & Policies](#6-event-lifecycle--policies)  
7. [Notifications](#7-notifications)  
8. [Moderation & Trust](#8-moderation--trust)  
9. [Calendar & Discovery](#9-calendar--discovery)  
10. [Ticketing & Payments (Phase plan)](#10-ticketing--payments-phase-plan)  
11. [Marketing & Growth Requirements](#11-marketing--growth-requirements)  
12. [Admin Web Dashboard](#12-admin-web-dashboard)  
13. [Data Model (High-level)](#13-data-model-high-level)  
14. [Analytics & Tracking Spec](#14-analytics--tracking-spec)  
15. [Non-Functional Requirements](#15-non-functional-requirements)  
16. [MVP Scope & Phases](#16-mvp-scope--phases)  
17. [Open Decisions (must lock before build)](#17-open-decisions-must-lock-before-build)

---

## 1. Vision & Goals

### 1.1 Vision
Create the **default social layer for live events**: artists post content, fans discover events, and bookings happen inside the same app.

### 1.2 Primary goals
- Social discovery of artists + events (TikTok feel, events-first).
- Trust by design: **verified artists only** publish events/content.
- Simple engagement: **reactions + reposts** (no customer comments).
- Calendar-centric discovery: browse events by **date + location + category**.

### 1.3 Success metrics
- **Activation:** % of new users who follow ≥ 3 artists and watch ≥ 5 reels in first session.
- **Engagement:** median session length, reels watched per session, reaction/repost rate.
- **Event conversion:** event detail views → booking intent → purchase (Phase 2).
- **Trust:** report rate, time-to-moderate, scam incidence (target: near zero).
- **Creator value:** events created per active artist, bookings per event.

---

## 2. Roles & Permissions

### 2.1 Customer (Mobile App)
Can:
- Browse reels feed.
- Follow artists.
- React to reels (emoji set).
- Repost reels (to personal timeline).
- Save reels/events.
- Share links externally.
- View artist profiles and event lists.
- View calendar and filter by location/date/category.
- Book tickets (Phase 1: free tickets optional; Phase 2: paid).

Cannot:
- Comment publicly (no replies, no threads).
- Create events or upload artist content.
- Edit others’ content.

### 2.2 Artist (Mobile App)
Prerequisite: **must be verified by admin**.
Can:
- Upload reels and posts.
- **Edit reels in-app:** trim/cut video, add background music from library, mute original reel audio, adjust audio levels.
- Create and manage own events (draft/publish subject to rules).
- Link reels to events ("Promote this event").
- See insights: views, reactions, reposts, clicks to event, bookings (Phase 2).

Cannot:
- Access admin dashboard.
- Moderate other artists.
- Bypass content approval (unless granted preferred/auto-approve status by admin).

### 2.3 Admin (Web Dashboard)
Can:
- Verify artists (approve/reject/suspend).
- Manage venues/locations.
- Create/edit/cancel events on behalf of artists.
- **Approve or reject artist-uploaded content** (reels and events).
- **Configure content approval mode:** manual approval (default) or auto-approval for preferred artists.
- **Manage preferred artist list** (artists with auto-approval privileges).
- Review reports and remove content.
- Configure policies and system settings.
- View analytics and exports.
- (Phase 2) manage refunds, payouts, finance reports.

---

## 3. Core Principles

1. **Verified artists only** for publishing (reduces scam risk).
2. **No customer comments** (lower abuse + moderation).
3. **Event-centric identity:** artist profile highlights events.
4. **Reposts drive growth:** customers share without open replies.
5. **Marketing-ready architecture from day 1:** deep links + attribution.
6. **Location-first calendar:** discover “what’s happening near me”.

---

## 4. User Journeys

### 4.1 Customer: Discover → Attend
1. Opens app → reels feed starts instantly.
2. Reactions / reposts / follows based on taste.
3. Taps artist → artist profile (reels + events).
4. Taps event → details page → save or book.
5. Ticket stored in “My Tickets” (Phase 1 free / Phase 2 paid).

### 4.2 Artist: Create → Edit → Promote
1. Applies for verification → admin approves.
2. Creates reel → edits in-app (trim, add music, mute audio) → submits for approval.
3. **If preferred artist:** content auto-approved and published immediately.
4. **If non-preferred artist:** content enters approval queue → admin approves → published.
5. Creates event (draft) → sets date/time/venue → submits for approval (same approval logic).
6. Links reels to events for promotion.
7. Monitors insights (views → clicks → bookings).

### 4.3 Admin: Trust & Operations
1. Verifies artists.
2. **Manages preferred artist list** (grants/revokes auto-approval privileges).
3. **Reviews content approval queue** — approves or rejects pending reels and events from non-preferred artists.
4. Approves/creates events, ensures venue data quality.
5. Reviews reports and removes harmful content quickly.
6. Exports event and user reports for operations.
7. (Phase 2) handles cancellation/refund workflows.

---

## 5. Functional Requirements

## 5.1 Authentication & Accounts
**FR-A1** Support login:
- Phone OTP (recommended)
- Email + password (optional)
- Social login (optional)

**FR-A2** Roles: Customer / Artist / Admin.

**FR-A3** Account settings:
- Edit profile
- Notification settings
- Privacy settings (repost visibility)
- Delete account (policy-based)

---

## 5.2 Artist Verification (Mandatory)
**FR-V1** Artist accounts must be verified before:
- Publishing reels publicly
- Publishing events
- Appearing in discovery lists (optional: allow pre-verified profiles hidden)

**FR-V2** Verification application requires:
- Legal name (not public)
- Artist/stage name (public)
- Phone/email verification
- Identity verification (ID image upload)
- Social links (Instagram/YouTube/SoundCloud etc.)
- Optional: portfolio/sample video

**FR-V3** Admin decisions:
- Approve → verified badge + publishing enabled
- Reject → reason required (internal)
- Suspend → hide content + prevent publishing

**FR-V4** Re-verification flow:
- If suspended due to reports, admin can require re-verification.

---

## 5.3 Profiles

### 5.3.1 Customer profile
**FR-P1** Shows:
- Name, photo, basic info
- “My Vibes” timeline (reposts)
- Saved events (optional tab)
- Followed artists list

Privacy:
- **FR-P2** Customer can set repost timeline:
  - Public / Followers-only / Private

### 5.3.2 Artist profile (event-first)
**FR-P3** Artist profile tabs:
- Reels
- Events (default tab)
- About

**FR-P4** Events list grouping:
- Upcoming (group by month)
- Past (optional)

**FR-P5** Artist profile shows:
- Verified badge
- Category (DJ/singer/band)
- City
- Social links
- “Book next event” CTA if upcoming events exist

---

## 5.4 Social Content (Reels)

### 5.4.1 Feed
**FR-S1** Vertical reels feed:
- Autoplay
- Tap to pause
- Mute/unmute
- Preload next items for smoothness

**FR-S2** Reel actions (customer):
- React (emoji)
- Repost
- Save
- Share
- Follow artist
- Not into it (negative signal)
- Report

**FR-S3** No comments:
- No comment UI anywhere for customers.

### 5.4.2 Reel creation & editing (artist)
**FR-S4** Upload reel fields:
- Video file
- Cover image (auto-generated + selectable)
- Caption
- Tags/hashtags
- Location tag (optional)
- Link to event (optional)

**FR-S4a** In-app reel editing capabilities:
- **Trim/cut:** select start and end points to trim video; split and remove mid-sections.
- **Add music:** browse and select from a licensed music library; overlay audio track on video.
- **Mute original audio:** toggle to mute the original video audio entirely.
- **Audio mixing:** adjust volume levels between original audio and added music track.
- **Preview:** real-time preview of edited reel before publishing.
- **Save draft:** save editing progress as draft to resume later.
- **Re-edit published reels:** artist can re-edit a published reel (creates new version, subject to re-approval if approval is enabled).

**FR-S5** Reel status:
- Draft / Pending Approval / Published / Hidden / Removed / Rejected

### 5.4.3 Content Approval Mechanism
**FR-S5a** All artist-uploaded content (reels and events) must pass through an approval workflow before becoming publicly visible.

**FR-S5b** Approval modes (configurable by admin per content type):
- **Manual approval (default):** content enters "Pending Approval" state after artist submits. Admin reviews and approves or rejects.
- **Auto-approval (preferred artists only):** artists marked as "preferred" by admin have their content auto-approved and published immediately upon submission.

**FR-S5c** Preferred artist designation:
- Admin can grant or revoke "preferred artist" status to any verified artist.
- Preferred status is independent of verification status (artist must be verified AND preferred to get auto-approval).
- Admin can revoke preferred status at any time; future content from that artist returns to manual approval.

**FR-S5d** Approval workflow rules:
- Content submitted by non-preferred artists enters "Pending Approval" queue.
- Admin can approve (→ Published) or reject (→ Rejected, reason required).
- Rejected content: artist receives notification with rejection reason and can edit and resubmit.
- If a preferred artist's content is later reported and found violating, admin can revoke preferred status.
- Re-edited published reels from non-preferred artists require re-approval.
- Re-edited published reels from preferred artists are auto-approved.

**FR-S5e** Approval queue (admin):
- View all pending content (reels + events) sorted by submission time.
- Filter by content type (reel/event), artist, category.
- Bulk approve/reject capability.
- Preview content before approving.

### 5.4.4 "Event Storyline" (content hub)
**FR-S6** Event pages aggregate linked reels:
- Teasers, lineup, venue, aftermovie
- Admin can “feature” certain reels on event page

---

## 5.5 Reactions & Reposts (Core Differentiator)

### 5.5.1 Reactions
**FR-R1** Reaction types are configurable (admin):
- Example set: 🔥 ❤️ 🙌 😮 🎉

**FR-R2** Reaction behavior:
- One reaction per user per reel (change allowed)
- Counts visible on reel card

### 5.5.2 Reposts
**FR-R3** Customer can repost a reel to “My Vibes” timeline.
**FR-R4** Repost caption:
- **Recommended default:** allow short caption (max 120 chars) **OR** set repost-only.
- No public replies to captions (keeps “no comments” model).

**FR-R5** Repost visibility respects customer privacy setting.

**FR-R6** Abuse control:
- Repost captions are reportable and removable by admin.

---

## 5.6 Events

### 5.6.1 Event entity fields (minimum)
**FR-E1** Required:
- Title
- Description
- Category (Music Event, Festival, Holi, etc.)
- Start datetime + end datetime (UTC stored)
- Venue/location (name, address, map pin)
- City/region
- Banner image/poster
- Associated artist(s)
- Age restriction (All ages / 18+ / 21+) (configurable)
- Ticketing info (Phase 1 minimal; Phase 2 full)

**FR-E2** Multiple events per date supported (always).

### 5.6.2 Event creation (artist)
**FR-E3** Artist can create event as:
- Draft → Preview → Submit for Approval (or auto-publish if preferred artist)

**FR-E4** Event publishing rules:
- Only verified artists can submit events.
- **Non-preferred artists:** event enters "Pending Approval" after submission; admin must approve before publishing.
- **Preferred artists:** event is auto-approved and published immediately upon submission.
- Admin can override and manually review any event regardless of artist status.

### 5.6.3 Event creation (admin)
**FR-E5** Admin can create/edit events:
- Assign to artist(s)
- Set venue/date/time
- Feature events
- Cancel/reschedule

---

## 5.7 Event Detail Page
**FR-ED1** Must show:
- Poster/banner
- Event title, artists lineup
- Date/time (local + timezone)
- Venue with map preview + address
- Age restriction badge
- Refund/cancellation policy summary
- Linked reels (“Event Storyline”)
- CTA: Save / Book / Join waitlist (Phase 2)

---

## 5.8 Search
**FR-SEA1** Search across:
- Artists (stage name)
- Events (title)
- Venues/cities

**FR-SEA2** Filters:
- Date range
- Location (city / near me)
- Category
- Price (Phase 2)
- Age restriction

---

## 6. Event Lifecycle & Policies

## 6.1 Event lifecycle (state machine)
- Draft
- Pending Approval (mandatory for non-preferred artists; skipped for preferred artists)
- Published
- Sold out / Waitlist (Phase 2)
- Completed
- Cancelled
- Rescheduled (implemented as Published with change log + new schedule)
- Rejected (admin rejected content; artist can edit and resubmit)

**Rule:** All changes create a **change log** record for auditing and notifications.

## 6.2 Event changes (must be defined now)
### 6.2.1 Minor changes
Examples:
- Description text changes
- Poster updates
- Adding reels

Behavior:
- No forced notifications (optional digest)

### 6.2.2 Major changes (notify always)
Examples:
- Date change
- Start time change
- Venue change
- Cancellation
- Age restriction change

Behavior:
- Notify all saved users + ticket holders (Phase 2)
- Show “Updated” badge on event details
- Append to change log

## 6.3 Cancellation policy (Phase 1 definition; Phase 2 enforcement)
**Event can be cancelled by:**
- Artist (with admin confirmation recommended)
- Admin

Behavior on cancellation:
- Event status → Cancelled
- Notify saved users + ticket holders
- (Phase 2) Refund workflow triggered automatically

## 6.4 Reschedule policy
Behavior:
- Event updated with new date/time
- Notify saved users + ticket holders
- Tickets remain valid by default
- (Phase 2) Refund window opens (recommended: 48 hours)

---

## 7. Notifications

## 7.1 Notification channels
- Push notifications (mobile) — primary
- Email (Phase 2 optional)
- SMS (Phase 2 optional)

## 7.2 Notification types

### 7.2.1 Engagement notifications (to artists)
- Someone followed you
- Someone reposted your reel
- Reaction milestones (batched)

**Rules:**
- Batch reactions (e.g., “25 people reacted”)
- Throttle (max X per hour)

### 7.2.2 Event notifications (to customers)
- Followed artist published a new event
- Saved event updated (major change)
- Event cancellation/reschedule
- Reminders:
  - 24 hours before event
  - 2 hours before event
- Waitlist ticket available (Phase 2)

### 7.2.3 Content approval notifications (to artists)
- Content submitted for review confirmation
- Content approved (reel or event is now live)
- Content rejected (with reason from admin)
- Preferred status granted/revoked notification

### 7.2.4 Content approval notifications (to admins)
- New content pending approval alert
- High-volume approval queue alert (configurable threshold)

### 7.2.5 System notifications
- Artist verification approved/rejected
- Account warnings/suspension notices
- Ticket purchase confirmation (Phase 2)

## 7.3 Notification settings (mandatory)
Customer toggles:
- Event reminders
- New events from followed artists
- Nearby events suggestions
- Marketing/promotional notifications

Artist toggles:
- Engagement notifications
- Event performance digests

---

## 8. Moderation & Trust

## 8.1 Report-based moderation (MVP)
**Targets reportable:**
- Reel
- Event
- Artist profile
- Repost caption (if enabled)

**Report reasons:**
- Spam
- Inappropriate content
- Fake/scam event
- Hate/harassment
- Copyright
- Other

## 8.2 Content approval as moderation layer
**FR-MOD-CA1** The content approval mechanism serves as a pre-publication moderation layer:
- Non-preferred artist content is reviewed before it reaches end users.
- Preferred artist content bypasses pre-review but remains subject to post-publication reports and moderation.
- If a preferred artist receives repeated content violations, admin should revoke preferred status.

## 8.3 Auto-hide rule (recommended)
If a target receives:
- ≥ 10 unique reports in 1 hour **OR**
- ≥ N reports in 24 hours (admin-configurable)

Then:
- Automatically hide content pending review

## 8.4 Admin actions
- Remove content (soft delete / restore)
- Suspend artist
- Ban user
- Require re-verification
- **Revoke preferred artist status** (returns artist to manual approval)

## 8.5 Strike policy (recommended)
- 1st strike: warning
- 2nd strike: temporary suspension
- 3rd strike: permanent ban
(Admin can override)

---

## 9. Calendar & Discovery

## 9.1 Calendar views (must-have)
- Month view (event count dots)
- Day list view (chronological)
- Week view (optional)
- Map view (optional but powerful)

## 9.2 Location filtering (critical)
**FR-CAL1** Calendar must support:
- “Near me” (GPS) with radius options (5km/10km/25km/custom)
- Manual location search (city/area)
- Saved locations
- Sort by distance when near-me enabled

**FR-CAL2** Filters:
- Category
- Date range
- Followed artists only
- Saved events only
- Reposted events only
- Age restriction

## 9.3 Calendar UX expectations
- Fast month navigation
- Smooth list scrolling
- Clear empty states (“No events on this day”)
- Featured events pinned (optional)

---

## 10. Ticketing & Payments (Phase plan)

### Phase 1 (MVP)
- Optional: Free ticket reservations (no payment)
- Ticket QR generation
- My Tickets screen
- Basic entry validation (online)

### Phase 2
- Paid payments integration
- Refund and cancellation enforcement
- Waitlists + auto notify
- Payouts/settlements to artists
- Fraud prevention enhancements (dynamic QR, offline scanning)

## 10.1 Refund policy (define now; enforce Phase 2)
Recommended baseline:
Refund allowed if:
- Event cancelled (full refund)
- Event rescheduled → refund within 48 hours of notification
- Purchased within 24 hours (cool-off) AND not within 24 hours of event start

No refund if:
- Within 24 hours before event start
- User no-show

Fees:
- Ticket amount refundable
- Service fee refundable only if event cancelled (recommended)

---

## 11. Marketing & Growth Requirements

> **Goal:** Any ad or share link must open the exact reel/event/artist — even if the app is not installed.

## 11.1 Deep linking (Day 1 requirement)
**FR-MKT1** Support link types:
- Reel deep link: `https://yourapp.com/reel/{id}`
- Event deep link: `https://yourapp.com/event/{id}`
- Artist deep link: `https://yourapp.com/artist/{handle}`

**FR-MKT2** If app installed:
- Open directly in app to the target content.

**FR-MKT3** If app not installed:
- Open a web preview landing page → app store → after install open same content (**deferred deep link**).

## 11.2 Web preview landing pages (required)
- Reel preview page (thumbnail + short description + “Open in App”)
- Event preview page (poster + date/time + venue + “Open in App”)
- Artist preview page (profile summary + “Open in App”)

> These pages also help ad platform reviews and SEO.

## 11.3 Campaign attribution (required)
**FR-MKT4** Support UTM parameters on all links:
- `utm_source`, `utm_campaign`, `utm_content`, `utm_medium`
- Optional: `fbclid`, `gclid` passthrough

**FR-MKT5** Store attribution on:
- First app open/session
- User profile (last-touch + first-touch)
- Booking record (Phase 2)

## 11.4 Ad flows (must work)
- Facebook/Instagram ad → Reel
- Facebook/Instagram ad → Event
- Influencer link → Artist profile
- SMS/email campaign → Event
- Organic share → Reel/Event

## 11.5 Shareability tools
**FR-MKT6** In-app share generates a short link with attribution support.
**FR-MKT7** Artists can copy:
- event link
- reel link
- artist profile link

(Optional Phase 2) Referral codes:
- user referral → rewards
- event referral → discounts

---

## 12. Admin Web Dashboard

## 12.1 Admin access & roles
- Super Admin
- Event Manager
- Moderator
- Finance (Phase 2)

## 12.2 Modules
### Users
- List/search/filter users
- Suspend/ban/unban
- Role management (customer ↔ artist)
- View user activity summary

### Artist Verification
- Verification queue
- Approve/reject with internal notes
- Require re-verification
- Badge management

### Events
- Create/edit/cancel/reschedule
- Approval workflow (optional)
- Feature events
- Change log viewer
- Venue assignment + conflict warnings

### Venues
- CRUD venues
- Capacity
- Map pin validation
- Region/city management

### Content Approval
- **Content approval queue:** pending reels + events awaiting review
- Approve/reject with notes and reason
- Bulk approve/reject capability
- Filter by content type, artist, category, submission date
- Preview content inline before approving

### Preferred Artist Management
- View/search preferred artists list
- Grant preferred status (auto-approval enabled)
- Revoke preferred status (returns to manual approval)
- Preferred artist activity audit log

### Content Moderation
- Reels list (remove/restore)
- Reports queue with filters
- Repost caption moderation

### Analytics/Exports
- Users growth
- Events created
- Engagement stats
- CSV export (events/users/reports)
- (Phase 2) revenue, refunds

---

## 13. Data Model (High-level)

### Core
- `users` (id, role, phone/email, status, created_at, last_attribution)
- `artist_profiles` (user_id, stage_name, category, bio, city, socials, verified_status)
- `verification_requests` (artist_id, docs, submitted_at, status, reviewed_by, reviewed_at, notes)

### Content
- `reels` (id, artist_id, video_url, cover_url, caption, tags, linked_event_id, status, approval_status, created_at)
- `reel_edit_projects` (id, reel_id, artist_id, source_asset_id, edited_asset_id, edit_operations_json, status, created_at)
- `reel_music_tracks` (id, reel_id, music_track_id, start_offset_ms, end_offset_ms, volume_level)
- `music_library` (id, title, artist_name, duration_ms, audio_url, genre, is_licensed, is_active)
- `reactions` (user_id, reel_id, reaction_type, created_at)
- `reposts` (user_id, reel_id, caption_nullable, visibility, created_at)
- `saves` (user_id, target_type, target_id, created_at)
- `follows` (follower_id, artist_id, created_at)

### Content Approval
- `content_approval_queue` (id, content_type, content_id, artist_id, submitted_at, status, reviewed_by, reviewed_at, rejection_reason)
- `preferred_artists` (artist_id, granted_by, granted_at, revoked_at, is_active)

### Events
- `events` (id, title, description, category, start_at_utc, end_at_utc, venue_id, status, created_by, updated_at)
- `event_artists` (event_id, artist_id, role_in_event)
- `event_changes` (id, event_id, change_type, old_value, new_value, created_at, created_by)

### Locations
- `venues` (id, name, address, city, lat, lng, capacity)

### Trust
- `reports` (id, reporter_id, target_type, target_id, reason, status, created_at, resolved_by)
- `moderation_actions` (id, admin_id, action_type, target_type, target_id, notes, created_at)

### Ticketing (Phase 1/2)
- `ticket_types` (id, event_id, name, price, currency, capacity, sold_count, sales_start, sales_end)
- `bookings` (id, user_id, event_id, amount, status, attribution, created_at)
- `tickets` (id, booking_id, ticket_type_id, qr_code, status, used_at)

---

## 14. Analytics & Tracking Spec

## 14.1 Minimum analytics SDK events
- `app_open`
- `signup_start`, `signup_complete`
- `reel_view` (with duration)
- `reel_react`
- `reel_repost`
- `reel_edit_start`, `reel_edit_complete`
- `reel_trim`, `reel_add_music`, `reel_mute_audio`
- `content_submitted_for_approval`
- `content_approved`, `content_rejected`
- `artist_follow`
- `event_view`
- `event_save`
- `calendar_view`, `calendar_filter_applied`
- `search_performed`
- `report_submitted`
- (Phase 1) `ticket_reserved`
- (Phase 2) `checkout_start`, `purchase_success`, `purchase_failed`, `refund_initiated`

## 14.2 Attribution tracking
Store:
- First-touch attribution
- Last-touch attribution
- Campaign parameters attached to booking (Phase 2)

---

## 15. Non-Functional Requirements

- **Performance:** first content visible < 2 seconds average network; smooth 60fps scroll target.
- **Video:** CDN streaming; adaptive bitrate if possible.
- **Scalability:** pagination, caching, feed ranking service-ready.
- **Security:** JWT auth, RBAC, rate limits, secure uploads.
- **Reliability:** idempotent webhooks (Phase 2), consistent ticket inventory.
- **Privacy:** clear controls; data deletion; terms + privacy policy pages.
- **Compliance:** age gating for restricted events; copyright policy.

---

## 16. MVP Scope & Phases

### Phase 1 (Build now)
- Auth
- Artist verification (admin web)
- Reels feed + reactions + reposts + follow + save + share
- **Reel editing:** in-app trim/cut, add music, mute audio, audio mixing
- **Content approval workflow:** manual approval (default) + auto-approval for preferred artists
- **Preferred artist management** (admin)
- Artist profile (events-first)
- Event creation + submit for approval (mandatory approval for non-preferred; auto-approve for preferred)
- Event detail page + event storyline
- Calendar (month + day list) with near-me + location search filters
- Reports + moderation queue
- Marketing foundations:
  - deep links + web preview pages + UTM capture
  - analytics events

### Phase 2 (After traction)
- Paid ticketing + payment gateways
- Refund enforcement + finance reports
- Waitlists
- Ticket scanning (offline mode, anti-fraud)
- Settlements/payouts to artists
- AI-assisted moderation

---

## 17. Open Decisions (must lock before build)
These are the only decisions that can cause major rework later:

1. ~~**Event approval workflow:** direct publish vs admin approval.~~ **RESOLVED:** All content requires approval. Manual approval for non-preferred artists; auto-approval for preferred artists.
2. **Repost captions:** enabled (120 chars) vs repost-only.
3. **Phase 1 tickets:** free reservations included or Phase 2 only.
4. **Near-me permissions UX:** ask on first open or only when using calendar.
5. **Music library licensing:** source of licensed music tracks for reel editing (in-house library vs third-party integration).
5. **Age restriction enforcement:** simple label vs strict age verification.

---

## Appendix A — Terms & Conditions (Structure Outline)

> Not legal text; this is a requirements structure for your lawyer to finalize.

1. Platform is a marketplace; artists are responsible for event fulfillment.
2. Verified artist requirement and consequences of misrepresentation.
3. Ticket terms (validity, entry rules, transferability policy).
4. Cancellation/reschedule policy and refund windows.
5. Content policy (copyright, prohibited content).
6. User conduct (spam, harassment).
7. Account suspension/termination conditions.
8. Liability limitations.
9. Privacy policy summary + data retention.
10. Dispute resolution and contact method.

---
