# EventSocial UI/UX Master Plan (Final)

Source requirements:
- `RequirementDocs/eventsocial_full_requirements.md`
- `RequirementDocs/eventsocial_comprehensive_technical_design.md`
- `RequirementDocs/eventsocial_servers_and_domain_plan.md`

Primary visual direction requested:
- Monochrome-first foundation (black + white)
- High-contrast accents: `#FF5482` and `#00FFA1`

---

## 1. Product UX North Star

EventSocial must feel like:
1. Fast social discovery first
2. Trusted event booking second
3. Operationally safe for admins

Design outcome:
- Customers discover and engage quickly (reels + calendar + events)
- Artists can publish and promote without confusion
- Admins can verify, moderate, and operate at scale

---

## 2. Core UX Rules (Locked)

1. No customer comments anywhere.
2. Verified artists only can publish reels/events.
3. Event-first profiles for artists.
4. Calendar discovery is a first-class navigation entry.
5. Major event changes are always visible and clearly communicated.
6. Deep-link landing pages are treated as product surfaces, not marketing leftovers.

---

## 3. Visual Strategy

### 3.1 Theme Framework

- Base palette: black/charcoal + white/gray layers
- Accent A (`#FF5482`): primary action + highlight energy
- Accent B (`#00FFA1`): success state + live/verified/positive signals

### 3.2 Contrast and Accessibility Rules

Measured contrast observations:
- `#FF5482` on black: strong
- `#00FFA1` on black: very strong
- Both accents on white as text: weak

Usage policy:
1. Use accent text/icons mainly on dark surfaces.
2. On white surfaces, use black text and accent as border/fill/chip/background.
3. Use white text only on near-black or black buttons.
4. Primary CTA hierarchy:
   - First: black background + white text
   - Second: pink accent background + black text
   - Success/confirm: green accent background + black text

---

## 4. UX Architecture by Role

### 4.1 Customer App

Navigation model:
- Bottom navigation: Feed, Calendar, Search, Tickets, Profile

Core loops:
1. Discover reel -> open event -> save/book
2. Follow artist -> receive event alerts -> attend
3. Repost to My Vibes -> social growth loop

### 4.2 Artist App

Navigation model:
- Bottom navigation: Home, Create, Events, Insights, Profile

Core loops:
1. Verify account -> publish reels/events
2. Link reel to event storyline
3. Track engagement and booking funnel metrics

### 4.3 Admin Web Dashboard

Navigation model:
- Left rail: Users, Verification, Events, Venues, Moderation, Analytics, Settings

Core loops:
1. Verify artist quickly and safely
2. Resolve reports + apply actions
3. Manage event lifecycle changes with audit trail

---

## 5. Information Density Strategy

1. Customer UI: emotion + speed + minimal friction
2. Artist UI: clear publishing workflows + performance feedback
3. Admin UI: dense data tables + filters + bulk actions + strict states

---

## 6. UX Delivery Method (Step-by-Step)

### Step 1: Requirement Lock to UX Mapping
- Convert FRs to screen-level responsibilities
- Define where each FR appears in UI

### Step 2: IA and Navigation Validation
- Finalize sitemap and route groups for all roles
- Validate with deep links (`/reel/:id`, `/event/:id`, `/artist/:handle`)

### Step 3: Low-Fidelity Wireframes
- Build structural wireframes before visual styling
- Validate user-task completion without decorative layers

### Step 4: Design System Foundation
- Tokens, components, states, spacing, typography, elevation
- Accessibility-safe color and interaction patterns

### Step 5: High-Fidelity Screens
- Apply final visual language consistently
- Add all required states: loading, empty, error, blocked, success

### Step 6: Clickable Prototype and Handoff
- Role-based prototypes: customer, artist, admin
- Developer handoff with component specs + tokens + behavior notes

---

## 7. Required Screen Sets

### Customer
1. Auth/onboarding
2. Reels feed
3. Artist profile (events-first)
4. Event detail
5. Calendar (month + day list + filters)
6. Search + filter results
7. Saved/Reposts (My Vibes)
8. Tickets and ticket detail
9. Notification center
10. Settings + privacy controls

### Artist
1. Verification application
2. Verification status
3. Reel upload/publish
4. Event create/edit/publish
5. Event media + storyline linking
6. Insights dashboard
7. Artist profile management

### Admin Web
1. Dashboard overview
2. Artist verification queue
3. Events management
4. Venues management
5. Reports/moderation queue
6. User management
7. Analytics and export
8. Policy/settings

### Web Preview (Deep Link)
1. Reel preview page
2. Event preview page
3. Artist preview page

---

## 8. State Coverage Matrix (Must Include)

Every key screen must define:
1. Loading state
2. Empty state
3. Error state
4. Offline/retry state (mobile)
5. Permission denied/restricted state
6. Suspended/blocked account state

---

## 9. Interaction and Motion Principles

1. Reels transitions should be instant and lightweight.
2. Major actions need explicit confirmation (publish/cancel/reschedule/remove).
3. Animations should communicate status, not decorate.
4. Use short, consistent durations (120ms/180ms/240ms).
5. Avoid heavy effects in admin web; optimize for readability and speed.

---

## 10. Content Strategy

Tone:
- Short, direct, no ambiguity.

Microcopy rules:
1. Action labels must be verbs: Publish, Save, Report, Verify, Approve.
2. Policy-sensitive actions include consequences in helper text.
3. Moderation feedback must avoid legal ambiguity.

---

## 11. Design QA Checklist

Before development handoff:
1. All FRs mapped to screens.
2. All critical flows have success + failure branches.
3. Accessibility pass completed for contrast and keyboard navigation (web).
4. Component naming and token references are consistent.
5. Deep-link entry points tested for installed and non-installed paths.
6. Phase 1 vs Phase 2 boundaries clearly tagged on each screen.

---

## 12. Final Deliverables in This Folder

1. `eventsocial_uiux_master_plan.md` (this file)
2. `eventsocial_design_system.md`
3. `eventsocial_ui_tokens.json`
4. `eventsocial_information_architecture.md`
5. `eventsocial_screen_structure_spec.md`
6. `eventsocial_user_flows.mmd`
7. `eventsocial_sitemap.mmd`

