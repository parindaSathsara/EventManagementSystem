
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
EventModule
CalendarModule
ReportModule
NotificationModule
MarketingModule
TicketModule (Phase 2)
AdminModule

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
- created_at

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
6. FEED SYSTEM
============================================================

6.1 Feed Ranking Strategy (Initial)

Priority:
1. Followed artists
2. Trending (reaction weight)
3. Recency

Pagination:
- Cursor-based
- 20 per request

Redis used for:
- Feed caching
- Reaction counters

============================================================
7. CALENDAR & LOCATION FILTERING
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
8. MODERATION SYSTEM
============================================================

8.1 Report Handling

Flow:
Report created → queued → evaluated

Auto-hide rule:
10 unique reports within 1 hour

Moderation actions logged.

============================================================
9. NOTIFICATIONS SYSTEM
============================================================

Delivery:
Firebase Cloud Messaging

Worker jobs:
- 24-hour reminders
- 2-hour reminders
- Batched engagement notifications

Rate limiting applied.

============================================================
10. MARKETING & DEEP LINKING
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
11. REDIS USAGE
============================================================

Used for:
- OTP storage
- Rate limiting
- Feed cache
- Background jobs (BullMQ)
- Temporary counters

============================================================
12. INFRASTRUCTURE
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
13. SCALING STRATEGY
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
14. PERFORMANCE TARGETS
============================================================

API response < 300ms
Feed load < 2s
Calendar filter < 400ms

============================================================
15. SECURITY
============================================================

- HTTPS enforced
- Rate limiting
- Input validation
- Secure file uploads
- JWT validation
- Signed media URLs

============================================================
16. FUTURE EXTENSIONS
============================================================

- Payment gateway integration
- Offline ticket scanning
- AI moderation service
- WebSocket live inventory
- Referral system

============================================================
END OF DOCUMENT
============================================================
