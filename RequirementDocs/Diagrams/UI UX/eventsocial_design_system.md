# EventSocial Design System (Monochrome + Dual Accent)

Visual brief:
- Foundation: black and white
- Accent A: `#FF5482` (signal/action energy)
- Accent B: `#00FFA1` (success/live/verified energy)

---

## 1. Color System

### 1.1 Core Palette

Base neutrals:
- `--bg-strong`: `#050505`
- `--bg-default`: `#0C0C0E`
- `--bg-soft`: `#141418`
- `--surface-1`: `#1A1B1F`
- `--surface-2`: `#22232A`
- `--line-subtle`: `#2E313A`
- `--text-primary`: `#FFFFFF`
- `--text-secondary`: `#C8CBD3`
- `--text-muted`: `#9CA2AF`

Light surfaces (for cards/forms/print or specific pages):
- `--paper`: `#FFFFFF`
- `--paper-soft`: `#F4F5F7`
- `--paper-line`: `#DBDEE5`
- `--ink`: `#0B0C10`
- `--ink-muted`: `#515866`

Accents:
- `--accent-pink`: `#FF5482`
- `--accent-green`: `#00FFA1`

Functional:
- `--ok`: `#00FFA1`
- `--warn`: `#FFB020`
- `--error`: `#FF5C7A`
- `--info`: `#6BA8FF`

### 1.2 Accent Usage Rules

1. Pink is for:
   - Primary highlight actions
   - Active state chips/tabs
   - Focus rings on dark UI
2. Green is for:
   - Success/confirmed states
   - Verified/live indicators
   - Positive analytics badges
3. Never rely on color alone; pair with icon/text for status.
4. On white backgrounds:
   - Avoid using pink/green as body text colors
   - Use black text on accent-filled elements

---

## 2. Typography System

Recommended families:
- Headings: `Sora` (700/800)
- Body/UI: `Manrope` (400/500/600/700)

Scale:
- `display-lg`: 48/56
- `display-md`: 40/48
- `h1`: 32/40
- `h2`: 28/36
- `h3`: 24/32
- `h4`: 20/28
- `title`: 18/26
- `body-lg`: 16/24
- `body-md`: 14/22
- `body-sm`: 13/20
- `caption`: 12/18

Weights:
- 400: regular body
- 500: UI labels
- 600: section emphasis
- 700: component headers
- 800: hero/title emphasis

---

## 3. Spacing and Layout

Base unit:
- `4px` system

Spacing tokens:
- `space-1` = 4
- `space-2` = 8
- `space-3` = 12
- `space-4` = 16
- `space-5` = 20
- `space-6` = 24
- `space-8` = 32
- `space-10` = 40
- `space-12` = 48
- `space-16` = 64

Corner radius:
- `radius-sm` = 8
- `radius-md` = 12
- `radius-lg` = 16
- `radius-xl` = 20
- `radius-pill` = 999

Stroke:
- Hairline: 1px
- Emphasis line: 2px

---

## 4. Elevation and Surfaces

Dark app surfaces:
- Layer 0: app background
- Layer 1: card/list items
- Layer 2: elevated modal bottom sheets
- Layer 3: overlays/dialogs

Shadow style (dark):
- Soft ambient only, avoid heavy blur glow
- Use subtle alpha shadows + 1px border contrast

---

## 5. Component System

### 5.1 Buttons

Primary:
- Background: black or pink (context-driven)
- Text: white on black, black on pink
- Height: 44 (mobile), 40 (web compact), 48 (prominent CTA)

Secondary:
- Transparent or surface-2
- Border: line-subtle
- Text: text-primary

Success:
- Background: green
- Text: black

Destructive:
- Background: error
- Text: white

Disabled:
- Lower contrast + no accent usage

### 5.2 Inputs

States:
- default, focus, success, error, disabled

Rules:
- Focus ring uses pink on dark background
- Error state includes icon + helper text
- Labels always visible (no placeholder-only forms)

### 5.3 Chips/Tags

Types:
- category chip
- status chip
- filter chip

Accent usage:
- Pink for active filter
- Green for verified/success status

### 5.4 Cards

Card types:
- Reel card controls
- Event summary card
- Artist compact card
- Admin data card

Card pattern:
- clear hierarchy: title -> metadata -> action row

### 5.5 Navigation

Mobile bottom nav:
- 5 items max
- active icon accent-pink
- badge counts use green for success, pink for active alerts

Admin side nav:
- compact icon + text
- strong active indicator bar

---

## 6. Motion and Interaction

Durations:
- fast: 120ms
- base: 180ms
- slow: 240ms

Easing:
- `cubic-bezier(0.2, 0, 0, 1)` for entry
- `cubic-bezier(0.4, 0, 1, 1)` for exit

Guidelines:
1. Reels swipe and playback controls must stay responsive.
2. Use motion for hierarchy and feedback only.
3. Avoid complex parallax in feed and admin tables.

---

## 7. Accessibility Baseline

1. Minimum text contrast target:
   - AA normal text: 4.5:1
   - AA large text: 3:1
2. Touch targets:
   - minimum 44x44 on mobile
3. Focus visibility:
   - keyboard focus outline mandatory on web/admin
4. State messaging:
   - color + icon + text, never color only
5. Reduce motion:
   - support reduced motion preferences

---

## 8. Responsive Strategy

Breakpoints:
- mobile: 320-767
- tablet: 768-1023
- desktop: 1024-1439
- wide: 1440+

Layout:
- Mobile app: single-column task flow
- Admin web: 12-column grid
- Marketing/deep-link pages: centered content with strong CTA

---

## 9. Icons and Illustration Style

Icon style:
- outlined + filled pair variants
- 1.75px to 2px stroke
- rounded joins

Illustration style:
- high-contrast monochrome base
- accent gradients only where needed for emphasis
- avoid visual clutter in admin context

---

## 10. Screen-Specific Visual Priority

Feed:
- video first, minimal chrome
- action stack right-aligned

Event detail:
- hero poster -> core facts -> CTA -> storyline reels

Calendar:
- high scannability for date and location

Admin moderation:
- table clarity, severity tagging, batch actions prominent

---

## 11. Handoff Requirements

Before development:
1. Component naming and variants locked.
2. Tokens synced with `eventsocial_ui_tokens.json`.
3. State variants documented per component.
4. Dev notes include interaction behavior and empty/error states.

