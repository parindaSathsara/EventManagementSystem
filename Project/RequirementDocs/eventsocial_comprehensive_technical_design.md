
# EventSocial — Comprehensive Technical Design Document (v2.0)

============================================================
1. SYSTEM OVERVIEW
============================================================

EventSocial is a social-first event discovery and booking platform.

Core characteristics:
- Verified artist-only publishing model
- Reel-based social feed
- Location-aware event calendar (PostGIS)
- Admin moderation dashboard
- Marketing deep-link + attribution ready
- Phase 2 ticketing + payment support

Architecture style: Modular Monolith (Scalable)

This approach:
- Reduces complexity in early stages
- Keeps development fast
- Allows future horizontal scaling
- Avoids premature microservices

============================================================
2. HIGH-LEVEL ARCHITECTURE
============================================================

CLIENT LAYER
- React Native (iOS & Android)
- React.js (Admin Dashboard)
- Public Web (Deep link preview pages)

BACKEND LAYER
- Node.js + TypeScript
- NestJS framework
- REST API
- Background worker (BullMQ)
- Optional WebSocket/SSE (Phase 2)

DATA LAYER
- PostgreSQL + PostGIS
- Redis
- Object storage (S3/R2)
- CDN (Cloudflare recommended)

============================================================
3. BACKEND DESIGN
============================================================

3.1 Framework: NestJS

Why:
- Strong structure
- Built-in dependency injection
- Guards and interceptors
- Enterprise scalability
- TypeScript native

3.2 Module Structure

AuthModule
UserModule
ArtistModule
VerificationModule
ReelModule
ReelEditorModule
ContentApprovalModule
EventModule
CalendarModule
ReportModule
NotificationModule
MarketingModule
TicketModule (Phase 2)
AdminModule
MusicLibraryModule

Each module contains:
- Controller
- Service
- Repository
- DTOs
- Guards
- Tests

============================================================
4. AUTHENTICATION & AUTHORIZATION
============================================================

4.1 Authentication Flow

Phone OTP login:
1. Request OTP
2. Verify OTP
3. Issue JWT access token
4. Issue refresh token

Token strategy:
- Access token: 15 minutes
- Refresh token: 7–30 days
- Refresh rotation enabled

4.2 RBAC (Role Based Access Control)

Roles:
- Customer
- Artist (Verified)
- Admin

Guards:
- JwtAuthGuard
- RolesGuard
- VerifiedArtistGuard
- PreferredArtistGuard
- ContentApprovalGuard
- AdminGuard

============================================================
5. DATABASE DESIGN
============================================================

5.1 Database Engine
PostgreSQL 15+

Extensions:
- PostGIS (geo queries)
- pg_trgm (text search optimization)

5.2 Spatial Setup (PostGIS)

Venue table:
location GEOGRAPHY(Point, 4326)

Index:
CREATE INDEX idx_venue_location ON venues USING GIST(location);

Use cases:
- Events within X km
- Sort by distance
- Map-based queries

5.3 Core Tables

users
- id
- role
- phone/email
- status
- created_at

artist_profiles
- user_id
- stage_name
- category
- city
- verified_status

verification_requests
- artist_id
- documents
- status
- reviewed_by

reels
- id
- artist_id
- video_url
- caption
- linked_event_id
- status
- approval_status
- created_at

reel_edit_projects
- id
- reel_id
- artist_id
- source_asset_id
- edited_asset_id
- edit_operations_json
- status
- created_at

reel_music_tracks
- id
- reel_id
- music_track_id
- start_offset_ms
- volume_level

music_library
- id
- title
- artist_name
- duration_ms
- audio_url
- genre
- is_licensed

content_approval_queue
- id
- content_type
- content_id
- artist_user_id
- submitted_at
- status
- reviewed_by
- reviewed_at
- rejection_reason

preferred_artists
- artist_user_id
- granted_by
- granted_at
- revoked_at
- is_active

events
- id
- title
- description
- start_at_utc
- end_at_utc
- venue_id
- status
- created_by

event_changes
- id
- event_id
- change_type
- old_value
- new_value

reports
- id
- reporter_id
- target_type
- target_id
- reason
- status

============================================================
6. REEL EDITOR SYSTEM
============================================================

6.1 In-App Editing Pipeline

Capabilities:
- Trim/cut: select start and end points; split and remove mid-sections
- Add music: overlay licensed audio tracks from music library
- Mute original audio: strip or mute source video audio
- Audio mixing: adjust volume ratio between original and music track
- Preview: real-time preview before finalizing
- Save draft: persist editing progress for later

Flow:
1. Artist selects video from gallery or records new
2. Video uploaded to S3/R2 as source asset
3. Edit operations applied client-side (lightweight) or server-side (BullMQ worker)
4. Edit project saved with operation manifest (JSON)
5. Final render produces edited asset
6. Edited asset linked to reel record
7. Reel submitted for approval

6.2 Edit Project Storage

Each edit session creates a reel_edit_project:
- Links to source asset and final edited asset
- Stores edit_operations_json (trim points, music track references, mute flags, volume levels)
- Status: draft / processing / completed / failed

6.3 Music Library

Admin-managed licensed music catalog:
- Tracks uploaded by admin
- Metadata: title, artist, genre, duration, BPM (optional)
- License status tracking
- Searchable and filterable by artist app
- Paginated API for browsing

6.4 Server-Side Processing (BullMQ Worker)

For complex edits (music overlay, trim + merge):
- Video processing worker queue
- FFmpeg-based processing pipeline
- Status updates via polling or WebSocket
- Timeout and retry policies
- Failed processing: notify artist, allow retry

============================================================
7. CONTENT APPROVAL SYSTEM
============================================================

7.1 Approval Workflow

All artist-uploaded content (reels and events) passes through approval:

For non-preferred artists:
1. Artist submits content → status: pending_approval
2. Content enters admin approval queue
3. Admin reviews → approve (→ published) or reject (→ rejected, reason required)
4. Artist notified of decision
5. Rejected content can be edited and resubmitted

For preferred artists:
1. Artist submits content → auto-approved → status: published
2. Content still subject to post-publication reports and moderation

7.2 Preferred Artist System

Designation:
- Admin grants preferred status to verified artists
- Stored in artist.preferred_artists table
- is_active flag controls current status
- Audit trail: granted_by, granted_at, revoked_at

Behavior:
- Preferred + verified = auto-approval on content submission
- Revoked preferred = future content requires manual approval
- Already published content is not affected by status change

7.3 Approval Queue (Admin)

Features:
- List all pending content sorted by submission time
- Filter by: content type (reel/event), artist, category
- Inline preview of content
- Approve/reject with notes
- Bulk approve/reject
- Metrics: avg approval time, queue depth, rejection rate

7.4 Re-edit and Re-approval

Rules:
- Non-preferred artist edits published reel → requires re-approval
- Preferred artist edits published reel → auto-approved
- Event edits by non-preferred artist → requires re-approval if major change
- Event edits by preferred artist → auto-approved

7.5 Content Approval Guard

Backend guard: ContentApprovalGuard
- On content submission, checks artist.preferred_artists.is_active
- If preferred: set approval_status = approved, status = published
- If not preferred: set approval_status = pending, status = pending_approval
- Prevents non-approved content from appearing in feeds/search/calendar

============================================================
8. FEED SYSTEM
============================================================

8.1 Feed Ranking Strategy (Initial)

Priority:
1. Followed artists
2. Trending (reaction weight)
3. Recency

Note: Only approved/published content appears in feeds.

Pagination:
- Cursor-based
- 20 per request

Redis used for:
- Feed caching
- Reaction counters

============================================================
9. CALENDAR & LOCATION FILTERING
============================================================

Input:
- Latitude
- Longitude
- Radius
- Date range
- Category

Backend:
- ST_DWithin spatial filter
- Date filter
- Category filter
- Sort by distance

Indexes:
- start_at_utc
- category
- GIST on venue location

============================================================
10. MODERATION SYSTEM
============================================================

10.1 Report Handling

Flow:
Report created → queued → evaluated

Auto-hide rule:
10 unique reports within 1 hour

Moderation actions logged.

10.2 Content Approval as Pre-Publication Moderation

The content approval system acts as a pre-publication moderation layer:
- Non-preferred content is human-reviewed before reaching end users
- Preferred content bypasses pre-review but is subject to post-publication reports
- Repeated violations by preferred artists → admin revokes preferred status

============================================================
11. NOTIFICATIONS SYSTEM
============================================================

Delivery:
Firebase Cloud Messaging

Worker jobs:
- 24-hour reminders
- 2-hour reminders
- Batched engagement notifications
- Content approval decision notifications (to artists)
- New pending content alerts (to admins)

Rate limiting applied.

============================================================
12. MARKETING & DEEP LINKING
============================================================

Routes:
/reel/:id
/event/:id
/artist/:handle

Behavior:
If installed → open app
If not → web preview → store redirect → app store → deferred open

Attribution stored:
utm_source
utm_campaign
utm_medium
utm_content

============================================================
13. REDIS USAGE
============================================================

Used for:
- OTP storage
- Rate limiting
- Feed cache
- Background jobs (BullMQ)
- Temporary counters
- Reel edit processing job queue
- Content approval queue metrics cache

============================================================
14. INFRASTRUCTURE
============================================================

Backend:
AWS ECS / Fly.io / Render

Database:
AWS RDS / Neon / Supabase

Redis:
Upstash / ElastiCache

Storage:
Cloudflare R2 / AWS S3

CDN:
Cloudflare

============================================================
15. SCALING STRATEGY
============================================================

Phase 1:
Single API instance
Managed Postgres
Managed Redis

Phase 2:
Horizontal API scaling
Read replica
Worker cluster
CDN optimization

============================================================
16. PERFORMANCE TARGETS
============================================================

API response < 300ms
Feed load < 2s
Calendar filter < 400ms

============================================================
17. SECURITY
============================================================

- HTTPS enforced
- Rate limiting
- Input validation
- Secure file uploads
- JWT validation
- Signed media URLs

============================================================
18. FUTURE EXTENSIONS
============================================================

- Payment gateway integration
- Offline ticket scanning
- AI moderation service
- AI-assisted content approval (auto-flag potentially violating content)
- WebSocket live inventory
- Referral system
- Advanced reel editor (filters, text overlays, transitions)

============================================================
END OF DOCUMENT
============================================================
