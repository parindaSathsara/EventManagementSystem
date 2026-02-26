# EventSocial Main Copilot Handbook (Deep Guidance Edition)

Purpose:
- This file is the single command center for Copilot 4.6 Opus style execution.
- It is intentionally verbose so the AI has less room for wrong assumptions.
- Use this file when you want consistent high-quality output for mobile and backend development.

Audience:
- AI coding assistants
- Mobile engineers
- Backend engineers
- Tech leads and QA

Scope:
- Phase 1 implementation first
- Phase 2 extension-ready architecture
- Mobile app + backend API + supporting systems

-------------------------------------------------------------------------------
## 1) Source Of Truth Files (Always Load First)
-------------------------------------------------------------------------------

Required document set:
1. `RequirementDocs/eventsocial_full_requirements.md`
2. `RequirementDocs/eventsocial_comprehensive_technical_design.md`
3. `RequirementDocs/eventsocial_servers_and_domain_plan.md`
4. `RequirementDocs/Diagrams/Database Design/eventsocial_database_design.md`
5. `RequirementDocs/Diagrams/Database Design/eventsocial_schema.sql`
6. `RequirementDocs/Diagrams/Database Design/eventsocial_erd.mmd`
7. `RequirementDocs/Diagrams/UI UX/eventsocial_uiux_master_plan.md`
8. `RequirementDocs/Diagrams/UI UX/eventsocial_design_system.md`
9. `RequirementDocs/Diagrams/UI UX/eventsocial_ui_tokens.json`
10. `RequirementDocs/Diagrams/UI UX/eventsocial_information_architecture.md`
11. `RequirementDocs/Diagrams/UI UX/eventsocial_screen_structure_spec.md`
12. `RequirementDocs/Diagrams/UI UX/eventsocial_user_flows.mmd`
13. `RequirementDocs/Diagrams/UI UX/eventsocial_sitemap.mmd`

If any source is missing:
- Clearly mention missing files.
- Continue with existing source files.
- Mark assumptions under `Assumptions` section.

-------------------------------------------------------------------------------
## 2) Non-Negotiable Product Rules
-------------------------------------------------------------------------------

These rules are always active:
1. No customer comments anywhere.
2. Verified artist only publishing for reels and events.
3. Event-first artist profile.
4. Calendar and location-based discovery is mandatory.
5. Deep-link + attribution support is mandatory from day 1.
6. Admin moderation capabilities are mandatory.
7. Phase 1 first. Keep Phase 2 extension points, do not block future growth.

Visual rules:
1. Base theme is black and white.
2. Accent color 1: `#FF5482`.
3. Accent color 2: `#00FFA1`.
4. Use accents with accessibility-safe contrast.

Architecture rules:
1. Backend framework: Node.js + TypeScript + NestJS.
2. Database: PostgreSQL + PostGIS.
3. Cache/queue: Redis.
4. Keep domain boundaries clean for future extraction.

-------------------------------------------------------------------------------
## 3) AI Execution Contract
-------------------------------------------------------------------------------

For every implementation task, AI must output in this exact order:
1. Goal
2. Files to modify
3. FR mapping
4. Plan
5. Implementation
6. Tests
7. Manual QA
8. Risks
9. Follow-up

Do not skip FR mapping.
Do not skip tests.
Do not skip manual QA.

When uncertain:
- State assumptions explicitly.
- Choose safest option aligned to source docs.
- Keep architecture extension-friendly.

-------------------------------------------------------------------------------
## 4) Definition Of Done (DoD)
-------------------------------------------------------------------------------

A task is done only if all items are true:
1. Requirement coverage confirmed by FR mapping.
2. Code compiles and runs.
3. Tests added/updated and passing.
4. Error and empty states handled.
5. Role/permission boundaries enforced.
6. Logging included for important state transitions.
7. No conflicts with source documents.
8. Output includes risk notes.

-------------------------------------------------------------------------------
## 5) Quality Gates
-------------------------------------------------------------------------------

Gate A: Requirement Gate
- Does this feature map to one or more FR IDs?
- Is it Phase 1 or Phase 2?
- If Phase 2, is it behind extension boundary?

Gate B: Design Gate
- Does the UI follow IA and screen structure docs?
- Is color usage aligned to the design system?
- Are loading/empty/error states included?

Gate C: Security Gate
- Is auth and RBAC enforced?
- Are validation and rate-limits considered?
- Is sensitive data protected?

Gate D: Performance Gate
- Is pagination in place?
- Are expensive operations indexed/cached?
- Is query complexity controlled?

Gate E: Release Gate
- Tests passing
- QA checklist completed
- Rollback path documented

-------------------------------------------------------------------------------
## 6) Output Templates (Use Exactly)
-------------------------------------------------------------------------------

### 6.1 Planning Template

```text
Goal:

FR Mapping:
- FR-...

Scope:
- In scope:
- Out of scope:

Files:
- create:
- update:

Implementation Plan:
1)
2)
3)

Risks:
- 

Assumptions:
- 
```

### 6.2 Implementation Template

```text
Changes Made:
1)
2)
3)

Key Decisions:
- 

API/Schema Impact:
- 

Tests Added/Updated:
- 

Manual QA:
1)
2)
3)

Known Limitations:
- 
```

### 6.3 Bugfix Template

```text
Issue Summary:

Root Cause:

Fix:

Files Changed:

Regression Tests:

Manual Verification:

Residual Risk:
```

-------------------------------------------------------------------------------
## 7) Prompt 0 - Master Bootstrap Prompt
-------------------------------------------------------------------------------

```text
You are the lead engineer for EventSocial (mobile + backend).

Read all source documents listed in RequirementDocs/MAIN.md section "Source Of Truth Files".
Treat them as strict source of truth.

Global constraints:
- Build Phase 1 first.
- Keep Phase 2 extension points.
- No customer comments.
- Verified artist-only publishing.
- Calendar + deep linking + attribution are mandatory.
- Theme must follow monochrome + accents #FF5482 and #00FFA1.

For every response, follow output order:
1) Goal
2) Files to modify
3) FR mapping
4) Plan
5) Implementation
6) Tests
7) Manual QA
8) Risks
9) Follow-up

Never produce generic advice only. Always produce actionable, implementation-grade output.
```

-------------------------------------------------------------------------------
## 8) Prompt Group A - Program Planning
-------------------------------------------------------------------------------

## Prompt A1 - Build Master Backlog

```text
Create a full implementation backlog from the source docs.

Output required:
1) Epics
2) Features under each epic
3) Story list under each feature
4) FR mapping for each story
5) Phase tag (Phase 1 / Phase 2)
6) Priority (P0/P1/P2)
7) Dependencies
8) Acceptance criteria

Keep the backlog implementation-ready, not high-level.
```

## Prompt A2 - Sprint Plan (Execution Ready)

```text
Generate a sprint plan from the backlog.

Include:
- Sprint goals
- Story sequencing
- Technical dependencies
- QA checkpoints
- Release checkpoints
- Risk mitigation actions

Use explicit references to FR IDs and module ownership.
```

## Prompt A3 - Decision Log Generator

```text
Create an Architecture Decision Log (ADL) from all open and locked decisions.

Include:
- decision title
- status (proposed/accepted/rejected)
- context
- options considered
- chosen option
- impact
- rollback strategy

Must include open decisions from eventsocial_full_requirements.md section 17.
```

## Prompt A4 - Risk Register Generator

```text
Create a project risk register for mobile + backend.

For each risk provide:
- category
- description
- likelihood
- impact
- owner
- mitigation
- contingency

Include product, technical, security, compliance, and delivery risks.
```

-------------------------------------------------------------------------------
## 9) Prompt Group M - Mobile Development (Detailed)
-------------------------------------------------------------------------------

## Prompt M1 - Mobile Foundation

```text
Implement mobile foundation for EventSocial.

Requirements:
- React Native app structure
- role-aware shells (customer and artist)
- app-level theming from eventsocial_ui_tokens.json
- global error boundary
- navigation skeleton from IA docs
- API client with auth interceptors
- state management setup

Deliverables:
- folder structure
- base navigation
- theme provider
- core shared components
- startup environment setup docs
```

## Prompt M2 - Design System Integration

```text
Implement shared UI primitives aligned to eventsocial_design_system.md.

Components:
- Button
- Input
- Select
- Chip
- Card
- Avatar
- Tab bar
- Modal
- Bottom sheet
- Toast
- Empty state
- Skeleton loader

For each component include:
- props API
- visual variants
- accessibility notes
- usage examples
```

## Prompt M3 - Auth and Session

```text
Build complete auth flow.

Include:
- phone OTP login
- optional email path placeholders
- token storage and refresh
- secure logout
- startup session restore

Map to:
- FR-A1, FR-A2, FR-A3

Add tests for:
- auth success
- auth failure
- token refresh failure
- expired session behavior
```

## Prompt M4 - Account and Settings

```text
Implement profile and settings UX.

Include:
- user profile edit
- repost visibility defaults
- notification toggles
- privacy controls
- account deletion request flow placeholder

Map to:
- FR-A3
- FR-P1
- FR-P2
```

## Prompt M5 - Artist Verification UX

```text
Build artist verification UI.

Screens:
- verification form
- document upload
- status timeline
- re-verification flow

Rules:
- publishing actions disabled until approved
- clear status messaging for rejected/suspended states

Map to FR-V1 to FR-V4.
```

## Prompt M6 - Reels Feed UX

```text
Build reels feed and interactions.

Include:
- vertical autoplay feed
- pause/mute controls
- actions: react, repost, save, share, follow, report, not interested
- no comment UI or APIs

Map to FR-S1 to FR-S3 and FR-R1 to FR-R6.

Include optimistic updates with rollback on failure.
```

## Prompt M7 - Reel Creation UX (Artist)

```text
Build artist reel publishing flow.

Include:
- video upload
- cover selection
- caption
- tags
- optional location tag
- optional event linking
- status: draft/published/hidden/removed

Map to FR-S4 and FR-S5.
```

## Prompt M8 - Artist Profile (Event First)

```text
Build artist profile with event-first structure.

Include:
- tabs: Events default, Reels, About
- upcoming events grouping
- past events grouping
- verified badge and socials
- book next event CTA behavior

Map to FR-P3, FR-P4, FR-P5.
```

## Prompt M9 - Event Detail UX

```text
Build event detail experience.

Must show:
- poster/banner
- title and lineup
- datetime with timezone
- venue and map preview
- age restriction
- cancellation/refund summary
- event storyline reels
- actions: save/book

Map to FR-ED1.
```

## Prompt M10 - Calendar UX

```text
Build calendar and discovery screens.

Include:
- month view
- day list
- near-me toggle and radius
- manual location search
- category/date/age filters
- followed artists filter
- saved events filter

Map to FR-CAL1 and FR-CAL2.
```

## Prompt M11 - Search UX

```text
Build search and result grouping.

Include:
- query input
- grouped results: artists/events/venues
- advanced filter panel
- recent searches

Map to FR-SEA1 and FR-SEA2.
```

## Prompt M12 - Tickets UX (Phase 1)

```text
Build ticket wallet for Phase 1.

Include:
- my tickets list
- ticket detail with QR
- ticket statuses
- free reservation handling

Keep extension points for:
- paid checkout
- refunds
- waitlist

Map to Section 10 Phase 1 requirements.
```

## Prompt M13 - Notifications UX

```text
Build notification center and settings.

Include:
- notification list
- read/unread handling
- deep-link open from notification
- notification toggle settings

Map to Section 7 requirements.
```

## Prompt M14 - Deep Link UX Entry

```text
Implement deep-link entry behavior in mobile app.

Include:
- route handling for reel/event/artist
- fallback handling if target missing
- deferred deep-link restoration after install

Map to Section 11 deep-link requirements.
```

## Prompt M15 - Attribution Capture Client

```text
Implement client attribution capture and propagation.

Include:
- capture UTM params
- attach attribution to first-touch and last-touch events
- pass attribution context to booking events

Map to FR-MKT4 and FR-MKT5.
```

## Prompt M16 - Mobile Accessibility Hardening

```text
Run accessibility pass for all major screens.

Check:
- color contrast
- tap targets
- semantic labels
- focus order where applicable
- reduced motion support

Output:
- issues
- fixes
- residual gaps
```

## Prompt M17 - Mobile Performance Hardening

```text
Optimize mobile app performance.

Include:
- feed rendering optimization
- image/video caching strategy
- network retry policy
- low-end device strategy
- memory leak checks

Target:
- smooth feed and interaction performance.
```

## Prompt M18 - Mobile QA Regression Suite

```text
Create and run mobile regression checklist.

Must include:
- auth flows
- feed actions
- artist verification states
- event lifecycle displays
- calendar filtering
- ticket flows
- deep-link entry

Output a pass/fail matrix.
```

## Prompt M19 - Mobile Release Candidate

```text
Prepare mobile release candidate package.

Include:
- feature matrix by FR
- known issues
- test evidence summary
- rollback notes
- release notes draft
```

## Prompt M20 - Mobile Post-Release Monitoring

```text
Create post-release monitoring plan.

Include:
- crash and error monitoring
- key funnel metrics
- alert thresholds
- quick rollback triggers
```

-------------------------------------------------------------------------------
## 10) Prompt Group B - Backend Development (Detailed)
-------------------------------------------------------------------------------

## Prompt B1 - Backend Foundation

```text
Initialize backend foundation using NestJS + TypeScript.

Include:
- module structure
- env config
- logger setup
- health checks
- exception filter strategy
- API versioning strategy

Must align to technical design module layout.
```

## Prompt B2 - Database Migration Setup

```text
Set up migration and seeding aligned to eventsocial_schema.sql.

Include:
- migration structure by domain schema
- seed strategy for reference tables
- environment-specific migration safety
- rollback-safe migrations

Output migration runbook commands.
```

## Prompt B3 - Auth API

```text
Implement auth APIs:
- request OTP
- verify OTP
- refresh token
- logout
- session validation

Enforce:
- token rotation
- rate limiting
- abuse prevention
```

## Prompt B4 - IAM + RBAC APIs

```text
Implement IAM APIs and guards.

Include:
- user profile endpoints
- role resolution middleware
- role assignment for admin flows
- guard helpers for customer/artist/admin

Map to FR-A2 and admin role requirements.
```

## Prompt B5 - Artist Verification Backend

```text
Implement artist verification backend.

Include:
- create verification request
- attach documents
- list and review queue for admins
- approve/reject/suspend/reverify actions
- publish eligibility checks

Map to FR-V1 to FR-V4.
```

## Prompt B6 - Reel Domain APIs

```text
Implement reel domain APIs.

Include:
- create/update/publish/hide/remove reel
- list reel feed with pagination
- link reel to event
- tag handling

Map to FR-S4 to FR-S6.
```

## Prompt B7 - Social Interaction APIs

```text
Implement:
- reactions (single reaction per user per reel)
- repost create/update/remove with visibility
- follow/unfollow
- save/unsave
- negative signal actions

Hard rule:
- no comment data model or endpoints.

Map to FR-R1 to FR-R6.
```

## Prompt B8 - Event Domain APIs

```text
Implement event APIs.

Include:
- event create/edit
- publish/submit approval
- cancel/reschedule
- assign artists
- feature event
- update logs with major/minor severity

Map to FR-E1 to FR-E5 and Section 6 policies.
```

## Prompt B9 - Calendar APIs (Geo)

```text
Implement calendar and discovery APIs using PostGIS.

Include:
- month/day event queries
- near-me radius queries
- location filters
- category/date/age filters
- distance sorting

Map to FR-CAL1 and FR-CAL2.
```

## Prompt B10 - Search APIs

```text
Implement search endpoints across:
- artists
- events
- venues/cities

Include filter support and ranking basics.

Map to FR-SEA1 and FR-SEA2.
```

## Prompt B11 - Moderation APIs

```text
Implement moderation and reporting APIs.

Include:
- report submission
- report queue filtering
- moderation actions
- strike handling
- auto-hide policy evaluation hooks

Map to Section 8 requirements.
```

## Prompt B12 - Notification Backend

```text
Implement notification backend.

Include:
- notification preference CRUD
- notification queue model
- worker jobs for reminders
- artist engagement batching

Map to Section 7 requirements.
```

## Prompt B13 - Marketing + Attribution APIs

```text
Implement attribution and deep-link support APIs.

Include:
- UTM capture endpoint
- short link creation/resolve/click logging
- deferred claim linking
- attribution attach to user and booking

Map to Section 11 and analytics requirements.
```

## Prompt B14 - Ticketing Phase 1 APIs

```text
Implement ticketing APIs for Phase 1.

Include:
- ticket type CRUD
- free reservation booking
- ticket generation with QR token hash
- ticket retrieval and validation

Keep extension points for paid purchases.
```

## Prompt B15 - Payment Gateway Scaffold

```text
Implement payment scaffold for Phase 2 readiness.

Include:
- payment attempts entity APIs
- idempotency handling
- webhook receiver with signature validation path
- webhook deduplication

No full gateway lock-in yet; keep provider abstraction.
```

## Prompt B16 - Refund + Settlement Skeleton

```text
Implement refund request and settlement skeleton APIs.

Include:
- refund request create/review endpoints
- settlement models and admin query endpoints
- policy hooks for cancellation/reschedule logic
```

## Prompt B17 - Admin Operations APIs

```text
Implement admin APIs for dashboard modules.

Include:
- users list/filter/manage
- verification queue endpoints
- event ops endpoints
- venue CRUD
- moderation queue endpoints
- analytics export endpoint shell
```

## Prompt B18 - Security Hardening

```text
Perform backend security hardening.

Cover:
- input validation on all endpoints
- auth guard coverage
- RBAC checks
- rate limits
- upload restrictions
- secure logging (no sensitive leaks)
```

## Prompt B19 - Performance Hardening

```text
Optimize backend performance.

Include:
- query plan review
- index validation
- pagination enforcement
- caching opportunities
- worker offloading for async tasks

Output before/after notes.
```

## Prompt B20 - Observability Setup

```text
Implement observability baseline.

Include:
- structured logs
- request IDs
- error tracking integration points
- metrics exposure
- alert event definitions
```

## Prompt B21 - Backend Test Suite

```text
Create backend test suite.

Include:
- unit tests by module
- integration tests for key flows
- contract tests for mobile dependencies
- security negative tests

Output coverage summary.
```

## Prompt B22 - API Documentation

```text
Generate API docs.

Include:
- endpoint list
- request/response schemas
- auth rules
- error catalog
- role access matrix
```

## Prompt B23 - CI/CD and Quality Automation

```text
Set up CI/CD pipeline requirements.

Include:
- lint/type/test gates
- migration safety checks
- build artifacts
- environment promotion model
- release tagging strategy
```

## Prompt B24 - Deployment and Infra Readiness

```text
Prepare deployment package for selected infra option.

Include:
- environment variables matrix
- migration deployment order
- worker deployment notes
- health check endpoints
- rollback procedure
```

## Prompt B25 - Backend Release Candidate

```text
Prepare backend release candidate summary.

Output:
1) implemented modules
2) FR coverage map
3) open risks
4) production checklist
5) post-release monitoring plan
```

-------------------------------------------------------------------------------
## 11) Prompt Group X - Cross-Stack Integration
-------------------------------------------------------------------------------

## Prompt X1 - Mobile Backend Contract Validation

```text
Validate mobile and backend contracts.

Include:
- endpoint parity with mobile needs
- data shape compatibility
- error contract consistency
- pagination consistency

Output mismatch list and fixes.
```

## Prompt X2 - End-To-End Journey Validation

```text
Validate end-to-end journeys:
1) customer discover to ticket
2) artist verify to publish
3) admin moderation resolution

For each journey include:
- happy path
- failure path
- recovery path
```

## Prompt X3 - FR Coverage Audit

```text
Create FR-to-implementation matrix for entire project.

Include:
- FR ID
- status (done/partial/not done)
- files/modules
- tests
- risk

Do not leave gaps unexplained.
```

-------------------------------------------------------------------------------
## 12) Prompt Group R - Refactor And Maintenance
-------------------------------------------------------------------------------

## Prompt R1 - Safe Refactor Plan

```text
Create a safe refactor plan for selected module.

Include:
- current issues
- target architecture
- migration strategy
- testing strategy
- rollback path
```

## Prompt R2 - Technical Debt Sweep

```text
Run technical debt sweep.

Output:
- debt list
- severity
- fix effort
- impact
- recommended sprint placement
```

## Prompt R3 - Regression Prevention Pack

```text
Generate regression prevention pack.

Include:
- critical paths
- automated checks
- smoke test scripts
- canary rollout checks
```

-------------------------------------------------------------------------------
## 13) Prompt Group D - Delivery Artifacts
-------------------------------------------------------------------------------

## Prompt D1 - Engineering Handoff

```text
Create engineering handoff package.

Include:
- architecture summary
- module ownership map
- setup instructions
- run commands
- troubleshooting guide
```

## Prompt D2 - QA Handoff

```text
Create QA handoff package.

Include:
- test matrix
- test data setup
- role-based test accounts
- known edge cases
- defect triage workflow
```

## Prompt D3 - Client Demo Script

```text
Create client demo script for Phase 1.

Include:
- scenario sequence
- expected outcomes
- fallback scenarios
- known limitations to disclose
```

-------------------------------------------------------------------------------
## 14) Prompt Group S - Strict Output Enforcers
-------------------------------------------------------------------------------

Use these when Copilot gives weak responses.

## Prompt S1 - Force Implementation Depth

```text
Do not provide high-level advice.
Provide implementation-level output only.
For every feature include:
- concrete file paths
- function/class names
- endpoint definitions
- schema impact
- tests
- acceptance checks
```

## Prompt S2 - Force Requirement Mapping

```text
Every feature line must include one or more FR IDs.
If no FR is found, label it as assumption and justify.
Do not proceed without coverage mapping.
```

## Prompt S3 - Force Failure Handling

```text
For each user flow include:
- success state
- empty state
- validation error state
- network error state
- permission denied state
- retry behavior
```

## Prompt S4 - Force Security Review

```text
For each endpoint include:
- auth requirement
- role requirement
- input validation schema
- abuse/rate limit considerations
- audit logging requirement
```

-------------------------------------------------------------------------------
## 15) Full Recommended Execution Sequence
-------------------------------------------------------------------------------

Program setup:
1. Prompt 0
2. Prompt A1
3. Prompt A2
4. Prompt A3
5. Prompt A4

Mobile implementation:
6. Prompt M1
7. Prompt M2
8. Prompt M3
9. Prompt M4
10. Prompt M5
11. Prompt M6
12. Prompt M7
13. Prompt M8
14. Prompt M9
15. Prompt M10
16. Prompt M11
17. Prompt M12
18. Prompt M13
19. Prompt M14
20. Prompt M15
21. Prompt M16
22. Prompt M17
23. Prompt M18
24. Prompt M19
25. Prompt M20

Backend implementation:
26. Prompt B1
27. Prompt B2
28. Prompt B3
29. Prompt B4
30. Prompt B5
31. Prompt B6
32. Prompt B7
33. Prompt B8
34. Prompt B9
35. Prompt B10
36. Prompt B11
37. Prompt B12
38. Prompt B13
39. Prompt B14
40. Prompt B15
41. Prompt B16
42. Prompt B17
43. Prompt B18
44. Prompt B19
45. Prompt B20
46. Prompt B21
47. Prompt B22
48. Prompt B23
49. Prompt B24
50. Prompt B25

Cross-stack and delivery:
51. Prompt X1
52. Prompt X2
53. Prompt X3
54. Prompt D1
55. Prompt D2
56. Prompt D3

If quality is weak at any step:
57. Prompt S1
58. Prompt S2
59. Prompt S3
60. Prompt S4

-------------------------------------------------------------------------------
## 16) FR Coverage Reminder Block (Paste Before Any Prompt)
-------------------------------------------------------------------------------

```text
Mandatory FR mapping rules:
- Each implemented unit must reference FR IDs.
- If a requirement is partially implemented, mark PARTIAL and explain gap.
- If Phase 2 features are touched in Phase 1, keep behind extension boundary.
- Do not create customer comment functionality.
- Enforce verified artist publishing rule in both UI and API.
```

-------------------------------------------------------------------------------
## 17) Example Prompt Combo Packs
-------------------------------------------------------------------------------

## Combo Pack 1 - Mobile Feed Sprint

```text
Run Prompt 0, then Prompt M2, M6, M8, M13, and M18.
Focus only on feed, artist profile event-first view, and notification touchpoints.
Use strict FR mapping.
Apply Prompt S3 and S4 to final output.
```

## Combo Pack 2 - Event Discovery Sprint

```text
Run Prompt 0, then Prompt M9, M10, M11 and backend prompts B8, B9, B10.
Deliver end-to-end event discovery and detail journey.
Validate with Prompt X1 and X2.
```

## Combo Pack 3 - Verification and Trust Sprint

```text
Run Prompt 0, then prompts M5, B5, B11, B17.
Include admin verification queue and moderation flow coverage.
Close with Prompt X3 and D2.
```

## Combo Pack 4 - Ticketing Foundation Sprint

```text
Run Prompt 0, then prompts M12, B14, B15, B16.
Phase 1 free reservation complete.
Phase 2 payment hooks scaffolded.
Close with security review using Prompt S4.
```

-------------------------------------------------------------------------------
## 18) Anti-Patterns (Do Not Allow)
-------------------------------------------------------------------------------

1. Adding comments to reels for customers.
2. Allowing unverified artists to publish publicly.
3. Building calendar without location filtering.
4. Skipping event change logs.
5. Ignoring deep-link routes and attribution.
6. Mixing Phase 2 full flows into Phase 1 without gates.
7. Creating endpoints without role guards.
8. Producing code without tests.
9. Producing tests without realistic fixtures.
10. Returning generic advice when implementation is requested.

-------------------------------------------------------------------------------
## 19) High-Risk Areas Requiring Extra Detail
-------------------------------------------------------------------------------

Always add extra validation and tests for:
1. Auth and session lifecycle
2. Verification status transitions
3. Event cancellation/reschedule notifications
4. Ticket issuance and validation consistency
5. Payment webhook idempotency
6. Moderation action correctness
7. Deep-link attribution correctness

-------------------------------------------------------------------------------
## 20) Minimal Acceptance Checklist For Any Feature PR
-------------------------------------------------------------------------------

```text
- FR mapping included
- Role/permission checks implemented
- Input validation implemented
- Loading/empty/error states handled
- Tests added and passing
- Logs and observability hooks included
- No conflict with source docs
- Manual QA checklist included
```

-------------------------------------------------------------------------------
## 21) One-Line Usage Guide
-------------------------------------------------------------------------------

Use Prompt 0 first, then pick prompts from A/M/B/X/R/D groups, and enforce quality using S prompts whenever output becomes generic.
