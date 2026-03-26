# EventSocial Database Design (Future-Ready)

Location: `RequirementDocs/Diagrams/Database Design`

This design is built from:
- `RequirementDocs/eventsocial_full_requirements.md`
- `RequirementDocs/eventsocial_comprehensive_technical_design.md`

## 1) Design Goals

1. Stability: support current requirements without frequent schema rework.
2. Extensibility: safely add Phase 2 ticketing/refunds/payouts and future features.
3. Extractability: schema is separated by domain so modules can later move to independent services.
4. Auditability: key business actions (event changes, moderation, payments) are log-friendly.
5. Performance: indexes match feed, calendar, moderation, ticketing, and attribution query paths.

## 2) Domain-Oriented Schema Layout

The schema is split by domain (PostgreSQL namespaces):

- `ref`: lookup/config tables (`roles`, `reaction_types`, `event_categories`, `content_approval_modes`, etc.)
- `iam`: identity, roles, auth identities, devices, saved locations
- `artist`: artist profile + verification workflow + **preferred artist designation**
- `media`: storage metadata for video/image/document assets + **reel edit projects** + **music library**
- `venue`: geospatial venues (`geography(point, 4326)` with GiST index)
- `events`: events, lineup, approvals, change logs, featured reels
- `social`: reels (with approval_status), tags, reactions, reposts, follows, saves, negative signals, **reel music tracks**
- `marketing`: attribution touches, short links, deferred claims
- `moderation`: reports, moderation actions, strikes, auto-hide rules
- `notify`: user notification preferences, notification batches, deliveries
- `ticketing`: ticket types, bookings, booking items, tickets, scans, refund requests
- `payments`: payment attempts, gateways, webhook events, artist settlements
- `analytics`: sessions and event stream
- `ops`: system settings + audit log
- `approval`: **content approval queue** for managing manual/auto approval of artist content

This separation allows future extraction per module without redesigning IDs and relationships.

## 3) Core Architecture Decisions

### 3.1 UUID-First IDs
Every major entity uses UUID primary keys for safer distributed writes and easier service extraction.

### 3.2 Lookup Tables Instead of Hardcoded Enums
Feature behavior can change by data/config (reaction set, roles, reasons, categories).

### 3.3 Open-Decision Friendly Settings
`ops.system_settings` stores configurable policies for decisions that may change:
- event approval mode
- **content approval mode** (manual / auto for preferred artists)
- repost caption policy
- Phase 1 ticket mode
- near-me permission mode
- age restriction enforcement mode

### 3.4 Preferred Artist Designation
`artist.preferred_artists` tracks which verified artists have auto-approval privileges.
- `is_active` flag controls current status.
- Admin can grant/revoke at any time.
- Full audit trail: `granted_by`, `granted_at`, `revoked_at`, `revoked_by`.

### 3.5 Reel Editing Data Model
- `media.reel_edit_projects`: stores edit session with source/edited asset links and operations JSON.
- `media.music_library`: admin-managed catalog of licensed music tracks.
- `social.reel_music_tracks`: links music tracks to reels with timing and volume data.

### 3.6 Content Approval Queue
`approval.content_approval_queue` is the central table for the approval workflow:
- Tracks all submitted content (reels + events) with content_type and content_id.
- Links to artist, reviewer, and stores status + rejection reason.
- Supports the full lifecycle: pending → approved/rejected → resubmitted.

### 3.7 Strict Report Targets Without Weak Polymorphism
`moderation.reports` and `moderation.actions` use constrained nullable FKs with `num_nonnulls(...)` checks.
This keeps relational integrity while supporting multiple target types.

### 3.8 Event Change Log as First-Class Table
`events.event_changes` stores major/minor change details and actor for notifications + audit.

### 3.9 Attribution Everywhere It Matters
`marketing.attribution_touches` links to users/sessions and can be attached to bookings.
`iam.users` stores `first_touch_id` and `last_touch_id`.

## 4) Phase Mapping

### Phase 1 (active immediately)
- IAM + Artist verification
- **Preferred artist designation + content approval workflow**
- Reels/social actions (no comments) + **reel editing (trim, music, mute)**
- **Music library management**
- Events + calendar filters + venues
- Reports/moderation
- Push notifications
- Deep linking + UTM attribution
- Free reservation ticket flow (or paid if enabled)

### Phase 2 (already supported structurally)
- Paid payment capture + webhooks
- Refund processing
- Waitlist + advanced ticket operations
- Settlements/payouts
- Finance/admin reporting extensions

## 5) High-Value Relationships

1. `iam.users` -> `artist.artist_profiles` (1:1 for artist identity)
2. `artist.artist_profiles` -> `social.reels` (artist content)
3. `events.events` -> `events.event_artists` (lineup)
4. `events.events` -> `social.reels` (event storyline links)
5. `social.reels` -> `social.reel_reactions` / `social.reposts`
6. `events.events` -> `ticketing.ticket_types` -> `ticketing.bookings` -> `ticketing.tickets`
7. `ticketing.bookings` -> `payments.payment_attempts`
8. `marketing.attribution_touches` -> `ticketing.bookings`
9. `moderation.reports` -> `moderation.actions` -> `moderation.user_strikes`

## 6) Performance and Scalability Notes

- PostGIS/GiST index on venue location for near-me and radius queries.
- Feed indexes:
  - `social.reels(artist_user_id, status_code, created_at desc)`
  - `social.reel_reactions(reel_id, reaction_code)`
- Event discovery indexes:
  - `events.events(status_code, start_at_utc)`
  - `events.events(event_category_id, start_at_utc)`
- Moderation queue indexes:
  - `moderation.reports(status_code, created_at desc)`
- Ticketing indexes:
  - `ticketing.bookings(user_id, created_at desc)`
  - `ticketing.tickets(event_id, status_code)`

For very high volume:
- Partition `analytics.app_events` by month.
- Partition `notify.notifications` by month if needed.
- Use read replicas for analytics-heavy queries.

## 7) Security and Compliance Notes

- PII separation is maintained (identity in IAM/artist docs).
- Payment idempotency is built into `payments.payment_attempts`.
- Webhook replay protection via unique `(gateway_code, external_event_id)`.
- Soft lifecycle states are captured by status columns + audit logs.

## 8) Files Created

1. SQL schema: `RequirementDocs/Diagrams/Database Design/eventsocial_schema.sql`
2. ER diagram source: `RequirementDocs/Diagrams/Database Design/eventsocial_erd.mmd`

## 9) ER Diagram

Use Mermaid-compatible renderer (GitHub/VS Code Mermaid extension) with:
- `RequirementDocs/Diagrams/Database Design/eventsocial_erd.mmd`

The ERD reflects core identity, social, event, moderation, marketing, ticketing, and payment relationships.

## 10) Why This Reduces Future "Change-Change-Change"

1. Domain separation avoids cross-cutting schema entanglement.
2. Config tables and settings absorb policy changes without DDL churn.
3. Core entities already include Phase 2 surfaces (payments/refunds/payouts).
4. Strong FK strategy prevents data drift while still supporting mixed target moderation.
5. UUID + module boundaries make later extraction to microservices practical.
