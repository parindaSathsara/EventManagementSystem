# EventSocial — Complete Pages, Flows & Asset Planning Document

> **Purpose:** Pre-development blueprint of every screen, every flow, and every visual asset needed.
> **Use this to:** Generate all images/icons/illustrations via AI before writing any code.

---

## Table of Contents

1. [App Flow Overview](#1-app-flow-overview)
2. [Customer App — All Pages](#2-customer-app--all-pages)
3. [Artist App — All Pages](#3-artist-app--all-pages)
4. [Admin Web Dashboard — All Pages](#4-admin-web-dashboard--all-pages)
5. [Public Web Preview Pages](#5-public-web-preview-pages)
6. [Complete User Flows](#6-complete-user-flows)
7. [Asset Checklist — Icons](#7-asset-checklist--icons)
8. [Asset Checklist — Images & Illustrations](#8-asset-checklist--images--illustrations)
9. [Asset Checklist — Animations & Lottie](#9-asset-checklist--animations--lottie)
10. [Asset Checklist — Audio](#10-asset-checklist--audio)
11. [AI Generation Prompt Guide](#11-ai-generation-prompt-guide)

---

# 1. App Flow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        ENTRY POINTS                             │
│  App Launch  │  Deep Link  │  Push Notification  │  Share Link  │
└──────┬───────┴──────┬──────┴──────────┬───────────┴──────┬──────┘
       │              │                 │                  │
       ▼              ▼                 ▼                  ▼
┌─────────────┐ ┌──────────┐  ┌──────────────┐  ┌──────────────┐
│  Splash     │ │ Web      │  │ In-App       │  │ Web Preview  │
│  Screen     │ │ Preview  │  │ Target       │  │ + Store      │
└──────┬──────┘ │ Page     │  │ Screen       │  │ Redirect     │
       │        └──────────┘  └──────────────┘  └──────────────┘
       ▼
┌─────────────┐
│  Auth Gate  │──── Logged in? ──── Yes ──→ Home (Role-Based)
│             │                      No ──→ Welcome Screen
└─────────────┘
```

### Role-Based Home Routing
```
After Auth ─→ Check Role
    │
    ├── Customer ──→ Reels Feed (Tab 1)
    ├── Artist ────→ Artist Home (Tab 1)
    └── Admin ─────→ Dashboard (Web)
```

---

# 2. Customer App — All Pages

> **Bottom Navigation:** Feed | Calendar | Search | Tickets | Profile
> **Active tab color:** `#FF5482`

---

## 2.1 Onboarding & Auth

### Page: Splash Screen
```
┌──────────────────────┐
│                      │
│                      │
│     [APP LOGO]       │
│                      │
│    EventSocial       │
│                      │
│     ● ● ● (loader)  │
│                      │
└──────────────────────┘
```
- **Duration:** 1.5–2 seconds
- **Background:** Solid black `#050505`
- **Logo:** Centered, white + pink accent
- **Assets needed:**
  - `splash_logo.png` (app logo, white version)
  - `splash_animation.json` (optional Lottie pulse animation)

---

### Page: Welcome / Login Choice
```
┌──────────────────────┐
│                      │
│   [HERO IMAGE or     │
│    ILLUSTRATION]     │
│                      │
│   Discover Live.     │
│   Feel the Vibe.     │
│                      │
│  ┌──────────────────┐│
│  │ Continue w/ Phone ││  ← Primary CTA (black bg, white text)
│  └──────────────────┘│
│  ┌──────────────────┐│
│  │ Continue w/ Email ││  ← Secondary CTA
│  └──────────────────┘│
│  ┌───┐ ┌───┐ ┌───┐  │
│  │ G │ │ A │ │ FB│  │  ← Social login icons
│  └───┘ └───┘ └───┘  │
│                      │
│  Already have an     │
│  account? Log In     │
└──────────────────────┘
```
- **Assets needed:**
  - `welcome_hero.png` — Abstract concert/crowd illustration (dark, moody, event vibe)
  - `icon_google.svg` — Google logo
  - `icon_apple.svg` — Apple logo
  - `icon_facebook.svg` — Facebook logo

---

### Page: OTP Verification
```
┌──────────────────────┐
│  ← Back              │
│                      │
│  Verify your number  │
│                      │
│  We sent a code to   │
│  +94 77 123 4567     │
│                      │
│  ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐
│  │  ││  ││  ││  ││  ││  │
│  └──┘└──┘└──┘└──┘└──┘└──┘
│                      │
│  Resend in 0:28      │
│                      │
│  ┌──────────────────┐│
│  │     Verify       ││
│  └──────────────────┘│
└──────────────────────┘
```
- No special assets needed (pure UI)

---

### Page: Profile Setup (New User)
```
┌──────────────────────┐
│  ← Back              │
│                      │
│  Set up your profile │
│                      │
│      ┌─────┐         │
│      │ 📷  │         │  ← Avatar upload circle
│      └─────┘         │
│                      │
│  Name: [__________]  │
│  City: [__________]  │
│                      │
│  ┌──────────────────┐│
│  │    Continue      ││
│  └──────────────────┘│
└──────────────────────┘
```
- **Assets needed:**
  - `avatar_placeholder.png` — Default user avatar silhouette
  - `icon_camera.svg` — Camera icon for upload

---

### Page: Interest Picker (Optional Onboarding)
```
┌──────────────────────┐
│                      │
│  What's your vibe?   │
│  Pick 3+ categories  │
│                      │
│  ┌─────┐ ┌─────┐    │
│  │ DJ  │ │ Live │    │
│  └─────┘ │ Band │    │
│  ┌─────┐ └─────┘    │
│  │Sing-│ ┌─────┐    │
│  │ er  │ │Stand│    │
│  └─────┘ │ Up  │    │
│  ┌─────┐ └─────┘    │
│  │Elec-│ ┌─────┐    │
│  │tron.│ │Hip  │    │
│  └─────┘ │Hop  │    │
│           └─────┘    │
│  ┌──────────────────┐│
│  │  Let's Go! (3+)  ││
│  └──────────────────┘│
└──────────────────────┘
```
- **Assets needed:**
  - Category chip icons (small, ~24x24):
    - `chip_dj.svg`
    - `chip_live_band.svg`
    - `chip_singer.svg`
    - `chip_standup.svg`
    - `chip_electronic.svg`
    - `chip_hiphop.svg`
    - `chip_jazz.svg`
    - `chip_classical.svg`
    - `chip_rock.svg`
    - `chip_rnb.svg`
    - `chip_reggae.svg`
    - `chip_cultural.svg`

---

## 2.2 Feed Tab

### Page: Reels Feed (Main Home)
```
┌──────────────────────┐
│ [For You] [Following]│  ← Top segment tabs
│                      │
│ ┌──────────────────┐ │
│ │                  │ │
│ │                  │ │
│ │   FULL SCREEN    │ │
│ │     VIDEO        │ │
│ │     REEL         │ │
│ │                  │ │
│ │                  │ │
│ │ @artistname      │ │
│ │ Caption text...  │ │  ← Bottom overlay
│ │ 🎵 Song name    │ │
│ │ 📍 Event: xxx   │ │  ← Linked event tag
│ │                  │ │
│ │           [🔥]   │ │  ← Right action rail
│ │           [❤️]   │ │
│ │           [↗️]   │ │  (repost)
│ │           [🔖]   │ │  (save)
│ │           [📤]   │ │  (share)
│ │           [👤]   │ │  (follow)
│ └──────────────────┘ │
│                      │
│[Feed][Cal][🔍][🎫][👤]│  ← Bottom nav
└──────────────────────┘
```
- **Assets needed:**
  - Reaction emoji set (custom styled, not system emoji):
    - `reaction_fire.svg` — 🔥 Fire/Hot
    - `reaction_heart.svg` — ❤️ Love
    - `reaction_hands.svg` — 🙌 Hands up / Hype
    - `reaction_wow.svg` — 😮 Wow / Surprised
    - `reaction_party.svg` — 🎉 Party / Celebrate
  - `icon_repost.svg` — Repost arrow
  - `icon_save_outline.svg` — Bookmark outline
  - `icon_save_filled.svg` — Bookmark filled
  - `icon_share.svg` — Share/send
  - `icon_follow_plus.svg` — Follow + badge
  - `icon_report_flag.svg` — Report flag
  - `icon_mute.svg` — Speaker muted
  - `icon_unmute.svg` — Speaker on
  - `icon_music_note.svg` — Music note (for audio track label)
  - `icon_not_interested.svg` — "Not into it" (minus circle or X)

---

### Page: Reaction Picker (Bottom Sheet overlay on reel)
```
┌──────────────────────┐
│  ── (sheet handle)   │
│                      │
│  🔥  ❤️  🙌  😮  🎉  │
│                      │
└──────────────────────┘
```
- Uses the reaction SVGs listed above

---

### Page: Repost Composer (Bottom Sheet)
```
┌──────────────────────┐
│  ── (sheet handle)   │
│                      │
│  Repost to My Vibes  │
│                      │
│  ┌────────────────┐  │
│  │ [Reel Preview] │  │
│  └────────────────┘  │
│                      │
│  Add a note (opt.)   │
│  [________________]  │
│                      │
│  Visibility:         │
│  (●) Public          │
│  ( ) Followers       │
│  ( ) Private         │
│                      │
│  ┌──────────────────┐│
│  │     Repost       ││
│  └──────────────────┘│
└──────────────────────┘
```

---

### Page: Share Sheet (System or Custom)
```
┌──────────────────────┐
│  ── (sheet handle)   │
│                      │
│  Share this reel     │
│                      │
│  ┌──────────────────┐│
│  │ [Link preview]   ││
│  └──────────────────┘│
│                      │
│  [Copy Link]         │
│  [WhatsApp] [Insta]  │
│  [Twitter] [More...] │
└──────────────────────┘
```

---

### Page: Report Content (Bottom Sheet)
```
┌──────────────────────┐
│  ── (sheet handle)   │
│                      │
│  Report this content │
│                      │
│  ○ Spam              │
│  ○ Inappropriate     │
│  ○ Misleading        │
│  ○ Hate speech       │
│  ○ Scam/fraud        │
│  ○ Other             │
│                      │
│  Details (optional)  │
│  [________________]  │
│                      │
│  [Submit Report]     │
└──────────────────────┘
```

---

## 2.3 Artist Profile (Customer View)

### Page: Artist Profile
```
┌──────────────────────┐
│  ← Back         ⋮    │
│                      │
│  ┌────┐              │
│  │AVTR│ @djshadow    │
│  └────┘ DJ • Colombo │
│         ✓ Verified   │  ← Green accent badge
│                      │
│  [Follow]  [Share]   │
│                      │
│  ┌IG┐ ┌YT┐ ┌SC┐     │  ← Social link icons
│                      │
│  [Events] [Reels] [About] │  ← Tabs (Events default)
│  ─────────────────── │
│                      │
│  UPCOMING            │
│  ┌──────────────────┐│
│  │ Mar 15 • Beach   ││
│  │ Party at Unawat. ││
│  │ ┌──────┐         ││
│  │ │POSTER│  Starts  ││
│  │ │      │  8 PM    ││
│  │ └──────┘         ││
│  └──────────────────┘│
│  ┌──────────────────┐│
│  │ Apr 02 • Neon    ││
│  │ Nights Colombo   ││
│  └──────────────────┘│
│                      │
│  PAST                │
│  ┌──────────────────┐│
│  │ Feb 10 • ...     ││
│  └──────────────────┘│
│                      │
│[Feed][Cal][🔍][🎫][👤]│
└──────────────────────┘
```
- **Assets needed:**
  - `icon_verified_badge.svg` — Green verified checkmark badge
  - `icon_instagram.svg` — Instagram link
  - `icon_youtube.svg` — YouTube link
  - `icon_soundcloud.svg` — SoundCloud link
  - `icon_spotify.svg` — Spotify link
  - `icon_tiktok.svg` — TikTok link
  - `icon_website.svg` — Website/globe icon
  - `artist_avatar_placeholder.png` — Default artist avatar

---

## 2.4 Event Detail

### Page: Event Detail
```
┌──────────────────────┐
│ ← Back    [🔖] [📤]  │
│                      │
│ ┌──────────────────┐ │
│ │                  │ │
│ │   EVENT HERO     │ │
│ │   POSTER/BANNER  │ │
│ │                  │ │
│ └──────────────────┘ │
│                      │
│ Beach Party 2026     │
│ 🏷️ Music • DJ       │
│                      │
│ 📅 Sat, Mar 15      │
│ 🕗 8:00 PM – 2:00 AM│
│ 📍 Unawatuna Beach   │
│ 🔞 18+ Only          │
│                      │
│ LINEUP               │
│ ┌────┐ ┌────┐ ┌────┐│
│ │avt1│ │avt2│ │avt3││
│ │DJ S│ │MC X│ │Voc.││
│ └────┘ └────┘ └────┘│
│                      │
│ ABOUT                │
│ Description text of  │
│ the event goes here..│
│ [Read more]          │
│                      │
│ EVENT STORYLINE      │
│ ┌────┐┌────┐┌────┐  │  ← Linked reels carousel
│ │reel││reel││reel│  │
│ │ 1  ││ 2  ││ 3  │  │
│ └────┘└────┘└────┘  │
│                      │
│ VENUE                │
│ ┌──────────────────┐ │
│ │   [MAP PREVIEW]  │ │
│ │   Get Directions  │ │
│ └──────────────────┘ │
│                      │
│ CANCELLATION POLICY  │
│ Free cancellation... │
│                      │
│ ┌──────────────────┐ │
│ │  Book Now (Free) │ │  ← Sticky bottom CTA
│ └──────────────────┘ │
│                      │
│[Feed][Cal][🔍][🎫][👤]│
└──────────────────────┘
```
- **Assets needed:**
  - `icon_calendar.svg` — Calendar date
  - `icon_clock.svg` — Time
  - `icon_location_pin.svg` — Location marker
  - `icon_age_restriction.svg` — 18+ / age restriction
  - `icon_category_tag.svg` — Tag / category
  - `icon_directions.svg` — Directions / navigate arrow
  - `icon_ticket.svg` — Ticket icon
  - `event_poster_placeholder.png` — Default event poster (dark gradient)
  - `map_pin_custom.png` — Custom map marker for venues

---

### Page: Event Detail — Special States
```
┌─ CANCELLED STATE ────┐     ┌─ RESCHEDULED STATE ─┐
│                      │     │                      │
│ ⚠️ EVENT CANCELLED   │     │ 🔄 RESCHEDULED      │
│ This event has been  │     │ New: Apr 02, 9 PM    │
│ cancelled.           │     │ Was: Mar 15, 8 PM    │
│                      │     │                      │
│ [View Refund Info]   │     │ [View Updated Info]  │
└──────────────────────┘     └──────────────────────┘
```
- **Assets needed:**
  - `icon_warning_triangle.svg` — Warning/cancelled indicator
  - `icon_reschedule.svg` — Refresh/reschedule indicator

---

## 2.5 Calendar Tab

### Page: Calendar View
```
┌──────────────────────┐
│  March 2026     ▾    │
│                      │
│  Mo Tu We Th Fr Sa Su│
│  23 24 25 26 27 28 1 │
│  2  3  4  5  6  7  8 │
│  9  10 11 12 13 14●15│  ← ● = events on this day (pink dot)
│  16 17●18 19 20 21 22│
│  23 24 25 26 27 28 29│
│  30 31               │
│                      │
│ ┌──────────────────┐ │
│ │📍Near Me  │⚙ Filter│ │  ← Location + filter controls
│ └──────────────────┘ │
│                      │
│  SAT, MARCH 15       │
│  ┌──────────────────┐│
│  │┌────┐Beach Party ││
│  ││post│ 8 PM       ││
│  ││ er │ Unawatuna  ││
│  │└────┘            ││
│  └──────────────────┘│
│  ┌──────────────────┐│
│  │┌────┐Jazz Night  ││
│  ││post│ 7 PM       ││
│  ││ er │ Colombo    ││
│  │└────┘            ││
│  └──────────────────┘│
│                      │
│[Feed][Cal][🔍][🎫][👤]│
└──────────────────────┘
```
- **Assets needed:**
  - `icon_filter.svg` — Filter funnel
  - `icon_near_me.svg` — Crosshair / near me
  - `icon_chevron_down.svg` — Month picker dropdown

---

### Page: Calendar Filters (Bottom Sheet)
```
┌──────────────────────┐
│  ── (sheet handle)   │
│                      │
│  Filters             │
│                      │
│  Category            │
│  [DJ] [Band] [Singer]│  ← Chip selectors
│  [Comedy] [Cultural] │
│                      │
│  Distance            │
│  ──●──────────── 50km│  ← Slider
│                      │
│  Age                 │
│  ○ All ages          │
│  ● 18+ only          │
│                      │
│  Price (Phase 2)     │
│  [Free] [Paid] [All] │
│                      │
│  [Apply]  [Reset]    │
└──────────────────────┘
```
- **Assets needed:**
  - `icon_slider_thumb.svg` — Custom slider knob

---

### Page: Location Denied State
```
┌──────────────────────┐
│                      │
│  [LOCATION ILLUST.]  │
│                      │
│  Enable location to  │
│  find events near you│
│                      │
│  [Enable Location]   │
│  [Set Manually]      │
└──────────────────────┘
```
- **Assets needed:**
  - `illustration_location_access.png` — Illustration of map/pin asking for permission

---

## 2.6 Search Tab

### Page: Search
```
┌──────────────────────┐
│  🔍 Search artists,  │
│     events, venues...│
│                      │
│  [Artists][Events]   │
│  [Venues]            │  ← Tab chips
│                      │
│  TRENDING            │
│  ┌──────────────────┐│
│  │ 🔥 Beach Party   ││
│  │ 🔥 DJ Shadow     ││
│  │ 🔥 Neon Nights   ││
│  └──────────────────┘│
│                      │
│  POPULAR ARTISTS     │
│  ┌────┐┌────┐┌────┐ │
│  │avtr││avtr││avtr│ │
│  │name││name││name│ │
│  └────┘└────┘└────┘ │
│                      │
│  UPCOMING EVENTS     │
│  ┌──────────────────┐│
│  │ Event card...    ││
│  └──────────────────┘│
│                      │
│[Feed][Cal][🔍][🎫][👤]│
└──────────────────────┘
```
- **Assets needed:**
  - `icon_search.svg` — Magnifying glass
  - `icon_trending.svg` — Trending fire / arrow up

---

### Page: Search Results (After typing)
```
┌──────────────────────┐
│  🔍 "beach party"  ✕ │
│                      │
│  [All][Artists][Events]│
│  [Venues]            │
│                      │
│  3 artists found     │
│  ┌──────────────────┐│
│  │ Artist result... ││
│  └──────────────────┘│
│                      │
│  12 events found     │
│  ┌──────────────────┐│
│  │ Event result...  ││
│  └──────────────────┘│
│                      │
│  No results?         │
│  [EMPTY ILLUST.]     │
│  Try different       │
│  keywords            │
└──────────────────────┘
```
- **Assets needed:**
  - `illustration_no_results.png` — Friendly empty state (magnifier with question mark)
  - `icon_clear_x.svg` — Clear/close X

---

## 2.7 Tickets Tab

### Page: My Tickets
```
┌──────────────────────┐
│  My Tickets          │
│                      │
│  [Upcoming] [Past]   │
│                      │
│  UPCOMING            │
│  ┌──────────────────┐│
│  │┌────┐Beach Party ││
│  ││post│ Mar 15, 8PM││
│  ││ er │ Unawatuna  ││
│  │└────┘            ││
│  │    ✅ Confirmed   ││  ← Green status
│  └──────────────────┘│
│                      │
│  ── No more tickets ─│
│                      │
│  EMPTY STATE:        │
│  ┌──────────────────┐│
│  │ [TICKET ILLUST.] ││
│  │ No tickets yet   ││
│  │ [Explore Events] ││
│  └──────────────────┘│
│                      │
│[Feed][Cal][🔍][🎫][👤]│
└──────────────────────┘
```
- **Assets needed:**
  - `illustration_no_tickets.png` — Empty ticket wallet illustration
  - `icon_ticket_confirmed.svg` — Checkmark on ticket
  - `icon_ticket_cancelled.svg` — X on ticket

---

### Page: Ticket Detail
```
┌──────────────────────┐
│  ← Back              │
│                      │
│  ┌──────────────────┐│
│  │                  ││
│  │   [QR CODE]      ││
│  │                  ││
│  └──────────────────┘│
│                      │
│  Beach Party 2026    │
│  📅 Mar 15, 8:00 PM  │
│  📍 Unawatuna Beach   │
│                      │
│  Ticket #: EVS-12345 │
│  Type: General Entry │
│  Status: ✅ Valid     │
│                      │
│  ── IMPORTANT ───    │
│  Show this QR at the │
│  entrance            │
│                      │
│  [Add to Wallet]     │  ← Phase 2
│  [Get Directions]    │
└──────────────────────┘
```
- **Assets needed:**
  - `icon_qr_placeholder.svg` — QR code frame/placeholder

---

## 2.8 Profile Tab (Customer)

### Page: Customer Profile
```
┌──────────────────────┐
│  ⚙️               │
│                      │
│      ┌─────┐         │
│      │PHOTO│         │
│      └─────┘         │
│      John Doe        │
│      Colombo         │
│                      │
│  [My Vibes][Saved]   │
│  [Following]         │
│  ─────────────────── │
│                      │
│  MY VIBES (Reposts)  │
│  ┌────┐┌────┐┌────┐ │
│  │reel││reel││reel│ │
│  │thm ││thm ││thm │ │
│  └────┘└────┘└────┘ │
│  ┌────┐┌────┐┌────┐ │
│  │reel││reel││reel│ │
│  └────┘└────┘└────┘ │
│                      │
│  EMPTY STATE:        │
│  "Your vibes will    │
│   appear here when   │
│   you repost reels"  │
│                      │
│[Feed][Cal][🔍][🎫][👤]│
└──────────────────────┘
```
- **Assets needed:**
  - `illustration_empty_vibes.png` — Abstract music/wave empty state
  - `illustration_empty_saved.png` — Empty bookmarks illustration
  - `illustration_empty_following.png` — Empty following list illustration

---

### Page: Settings
```
┌──────────────────────┐
│  ← Settings          │
│                      │
│  ACCOUNT             │
│  ├ Edit Profile      │
│  ├ Phone / Email     │
│  └ Linked Accounts   │
│                      │
│  PRIVACY             │
│  ├ Repost Visibility │
│  │  (Public ▾)       │
│  └ Blocked Users     │
│                      │
│  NOTIFICATIONS       │
│  ├ Push Notifications│
│  ├ New Event Alerts  │
│  ├ Artist Updates    │
│  └ Booking Updates   │
│                      │
│  SUPPORT             │
│  ├ Help Center       │
│  ├ Report a Problem  │
│  └ Terms & Privacy   │
│                      │
│  [Log Out]           │
│  [Delete Account]    │  ← Red text
└──────────────────────┘
```
- **Assets needed:**
  - `icon_edit_profile.svg`
  - `icon_phone.svg`
  - `icon_linked_accounts.svg`
  - `icon_privacy.svg`
  - `icon_blocked.svg`
  - `icon_notification_bell.svg`
  - `icon_help.svg`
  - `icon_terms.svg`
  - `icon_logout.svg`
  - `icon_delete_account.svg`

---

### Page: Notification Center
```
┌──────────────────────┐
│  ← Notifications     │
│                      │
│  TODAY               │
│  ┌──────────────────┐│
│  │🔔 DJ Shadow posted││
│  │a new reel         ││
│  │2 hours ago        ││
│  └──────────────────┘│
│  ┌──────────────────┐│
│  │📅 Beach Party is  ││
│  │tomorrow!          ││
│  │5 hours ago        ││
│  └──────────────────┘│
│                      │
│  THIS WEEK           │
│  ┌──────────────────┐│
│  │🎫 Booking confirmed││
│  │for Neon Nights    ││
│  └──────────────────┘│
│                      │
│  EMPTY STATE:        │
│  "No notifications   │
│   yet. Follow artists│
│   to stay updated!"  │
└──────────────────────┘
```
- **Assets needed:**
  - `illustration_no_notifications.png` — Bell with zzz or empty state
  - `icon_notification_reel.svg` — Reel notification type icon
  - `icon_notification_event.svg` — Event notification type icon
  - `icon_notification_booking.svg` — Booking notification type icon

---

## 2.9 Booking Flow

### Page: Booking Confirmation
```
┌──────────────────────┐
│                      │
│      ✅               │
│                      │
│  You're in!          │
│                      │
│  Beach Party 2026    │
│  Mar 15 • 8:00 PM   │
│  Unawatuna Beach     │
│                      │
│  Ticket #: EVS-12345 │
│                      │
│  [View Ticket]       │
│  [Share with Friends]│
│                      │
└──────────────────────┘
```
- **Assets needed:**
  - `animation_success_confetti.json` — Lottie confetti/success animation
  - `icon_check_circle.svg` — Green check circle

---

# 3. Artist App — All Pages

> **Bottom Navigation:** Home | Create | Events | Insights | Profile
> **Active tab color:** `#FF5482`

---

## 3.1 Verification Flow

### Page: Verification Application
```
┌──────────────────────┐
│  ← Back              │
│                      │
│  Get Verified ✓      │
│                      │
│  Step 1 of 3         │
│  ═══════──────       │  ← Progress bar
│                      │
│  STEP 1: IDENTITY    │
│  Legal Name          │
│  [________________]  │
│  Stage/Artist Name   │
│  [________________]  │
│                      │
│  STEP 2: DOCUMENTS   │
│  Upload ID           │
│  ┌──────────────────┐│
│  │   📄 Tap to      ││
│  │   upload ID      ││
│  └──────────────────┘│
│  Portfolio (optional)│
│  ┌──────────────────┐│
│  │   🎥 Upload      ││
│  │   sample video   ││
│  └──────────────────┘│
│                      │
│  STEP 3: LINKS       │
│  Instagram           │
│  [________________]  │
│  YouTube             │
│  [________________]  │
│  SoundCloud          │
│  [________________]  │
│                      │
│  ┌──────────────────┐│
│  │  Submit for      ││
│  │  Verification    ││
│  └──────────────────┘│
└──────────────────────┘
```
- **Assets needed:**
  - `icon_id_upload.svg` — ID card icon
  - `icon_video_upload.svg` — Video camera upload
  - `illustration_verification.png` — Verification badge illustration (for header)
  - `icon_step_complete.svg` — Completed step checkmark
  - `icon_step_active.svg` — Active step circle

---

### Page: Verification Status
```
┌──────────────────────┐
│  ← Back              │
│                      │
│  Verification Status │
│                      │
│  ┌──────────────────┐│
│  │ ⏳ PENDING       ││  ← Yellow accent
│  │                  ││
│  │ Your application ││
│  │ is under review  ││
│  │                  ││
│  │ Submitted:       ││
│  │ Mar 5, 2026      ││
│  │                  ││
│  │ Est. review:     ││
│  │ 24-48 hours      ││
│  └──────────────────┘│
│                      │
│  ── OR (Rejected) ── │
│                      │
│  ┌──────────────────┐│
│  │ ❌ REJECTED      ││  ← Red accent
│  │                  ││
│  │ Reason:          ││
│  │ ID document was  ││
│  │ not clear        ││
│  │                  ││
│  │ [Resubmit]      ││
│  └──────────────────┘│
└──────────────────────┘
```
- **Assets needed:**
  - `icon_pending_clock.svg` — Hourglass/clock pending
  - `icon_rejected_x.svg` — Rejection X circle
  - `icon_approved_check.svg` — Approved checkmark circle

---

## 3.2 Artist Home

### Page: Artist Home Dashboard
```
┌──────────────────────┐
│  Hey, DJ Shadow 👋   │
│                      │
│  QUICK STATS         │
│  ┌─────┐ ┌─────┐    │
│  │Views│ │React│    │
│  │12.5K│ │2.3K │    │
│  └─────┘ └─────┘    │
│  ┌─────┐ ┌─────┐    │
│  │Foll.│ │Repos│    │
│  │ 890 │ │ 456 │    │
│  └─────┘ └─────┘    │
│                      │
│  NEXT EVENT          │
│  ┌──────────────────┐│
│  │ Beach Party      ││
│  │ Mar 15 • 10 days ││
│  │ [Manage]         ││
│  └──────────────────┘│
│                      │
│  RECENT ACTIVITY     │
│  ┌──────────────────┐│
│  │ New follower x3  ││
│  │ Reel got 500 🔥  ││
│  └──────────────────┘│
│                      │
│[Home][+][📅][📊][👤] │
└──────────────────────┘
```

---

## 3.3 Create Content

### Page: Create Choice
```
┌──────────────────────┐
│  ← Back              │
│                      │
│  What do you want    │
│  to create?          │
│                      │
│  ┌──────────────────┐│
│  │   🎬             ││
│  │   New Reel       ││
│  │   Share a video  ││
│  │   with your fans ││
│  └──────────────────┘│
│                      │
│  ┌──────────────────┐│
│  │   📅             ││
│  │   New Event      ││
│  │   Create and     ││
│  │   promote a show ││
│  └──────────────────┘│
└──────────────────────┘
```
- **Assets needed:**
  - `icon_create_reel.svg` — Video/camera reel creation
  - `icon_create_event.svg` — Calendar + plus creation

---

### Page: Reel Creator
```
┌──────────────────────┐
│  ✕ Cancel    Publish │
│                      │
│  ┌──────────────────┐│
│  │                  ││
│  │  [VIDEO PREVIEW] ││
│  │                  ││
│  │  ┌──────────────┐││
│  │  │ TRIM BAR     │││  ← Trimming controls
│  │  │ ▏█████████▏  │││
│  │  └──────────────┘││
│  └──────────────────┘│
│                      │
│  🎵 Add Music        │
│  🔇 Mute Original    │
│  🔊 Audio Mix ──●──  │
│                      │
│  Cover Image         │
│  ┌───┐┌───┐┌───┐    │
│  │ 1 ││ 2 ││ 3 │    │  ← Auto-generated frames
│  └───┘└───┘└───┘    │
│                      │
│  Caption             │
│  [________________]  │
│                      │
│  Tags                │
│  [________________]  │
│                      │
│  📍 Location (opt.)  │
│  🎫 Link to Event ▾  │
│                      │
│  ┌──────────────────┐│
│  │  Submit Reel     ││
│  └──────────────────┘│
└──────────────────────┘
```
- **Assets needed:**
  - `icon_trim.svg` — Scissors / trim
  - `icon_add_music.svg` — Music + plus
  - `icon_mute_audio.svg` — Mute microphone
  - `icon_audio_mix.svg` — Audio slider/equalizer

---

### Page: Music Library Picker (Bottom Sheet)
```
┌──────────────────────┐
│  ── (sheet handle)   │
│                      │
│  🔍 Search music     │
│                      │
│  TRENDING            │
│  ┌──────────────────┐│
│  │🎵 Summer Vibes   ││
│  │   Artist Name    ││
│  │   0:30  [▶ Play] ││
│  └──────────────────┘│
│  ┌──────────────────┐│
│  │🎵 Night Energy   ││
│  │   Artist Name    ││
│  │   0:45  [▶ Play] ││
│  └──────────────────┘│
│                      │
│  GENRES              │
│  [Electronic][HipHop]│
│  [Jazz][Ambient]     │
└──────────────────────┘
```

---

### Page: Event Creator / Editor
```
┌──────────────────────┐
│  ✕ Cancel       Save │
│                      │
│  Create Event        │
│                      │
│  Banner Image        │
│  ┌──────────────────┐│
│  │   📷 Upload      ││
│  │   event banner   ││
│  └──────────────────┘│
│                      │
│  Title               │
│  [________________]  │
│                      │
│  Category            │
│  [Select ▾]          │
│                      │
│  Description         │
│  [________________]  │
│  [________________]  │
│                      │
│  📅 Start Date & Time│
│  [Mar 15, 2026 8 PM] │
│                      │
│  📅 End Date & Time  │
│  [Mar 16, 2026 2 AM] │
│                      │
│  📍 Venue            │
│  [Search venue... ▾] │
│  ┌──────────────────┐│
│  │  [MAP PREVIEW]   ││
│  └──────────────────┘│
│                      │
│  🔞 Age Restriction  │
│  [All ages ▾]        │
│                      │
│  LINEUP              │
│  [+ Add Artist]      │
│  ┌──────────────────┐│
│  │ DJ Shadow (You)  ││
│  │ MC Xplosion      ││
│  └──────────────────┘│
│                      │
│  ┌──────────────────┐│
│  │  Publish Event   ││
│  └──────────────────┘│
│  [Save as Draft]     │
└──────────────────────┘
```
- **Assets needed:**
  - `icon_banner_upload.svg` — Image upload with landscape frame
  - `icon_add_artist.svg` — Person + plus
  - `icon_draft.svg` — Draft / pencil with clock

---

## 3.4 Artist Events Management

### Page: My Events
```
┌──────────────────────┐
│  My Events           │
│                      │
│  [Draft][Published]  │
│  [Completed]         │
│                      │
│  PUBLISHED           │
│  ┌──────────────────┐│
│  │ Beach Party      ││
│  │ Mar 15 • 8 PM    ││
│  │ 45 bookings      ││
│  │ [Edit] [Cancel]  ││
│  └──────────────────┘│
│                      │
│  DRAFTS              │
│  ┌──────────────────┐│
│  │ Untitled Event   ││
│  │ Last edited 2d   ││
│  │ [Continue]       ││
│  └──────────────────┘│
│                      │
│[Home][+][📅][📊][👤] │
└──────────────────────┘
```

---

## 3.5 Insights

### Page: Artist Insights Dashboard
```
┌──────────────────────┐
│  Insights            │
│  [7d][30d][All Time] │
│                      │
│  ┌─────┐  ┌─────┐   │
│  │Views│  │React│   │
│  │25.4K│  │4.1K │   │
│  │ +12%│  │ +8% │   │  ← Green up arrow
│  └─────┘  └─────┘   │
│  ┌─────┐  ┌─────┐   │
│  │Repos│  │Foll │   │
│  │ 892 │  │1.2K │   │
│  │ +5% │  │ +15%│   │
│  └─────┘  └─────┘   │
│                      │
│  ┌──────────────────┐│
│  │ ENGAGEMENT CHART ││
│  │ ╱╲  ╱╲╱╲        ││  ← Line chart
│  │╱  ╲╱      ╲     ││
│  └──────────────────┘│
│                      │
│  TOP PERFORMING      │
│  ┌──────────────────┐│
│  │🎬 Reel: "Sunset" ││
│  │   12.5K views    ││
│  └──────────────────┘│
│  ┌──────────────────┐│
│  │📅 Beach Party    ││
│  │   45 bookings    ││
│  └──────────────────┘│
│                      │
│[Home][+][📅][📊][👤] │
└──────────────────────┘
```
- **Assets needed:**
  - `icon_trend_up.svg` — Upward trend arrow (green)
  - `icon_trend_down.svg` — Downward trend arrow (red)
  - `icon_views.svg` — Eye / views
  - `icon_reactions_stat.svg` — Reaction stat
  - `icon_reposts_stat.svg` — Repost stat
  - `icon_followers_stat.svg` — Followers stat

---

## 3.6 Artist Profile Management

### Page: Edit Artist Profile
```
┌──────────────────────┐
│  ← Back        Save  │
│                      │
│      ┌─────┐         │
│      │PHOTO│         │
│      └─────┘         │
│   [Change Photo]     │
│                      │
│  Stage Name          │
│  [DJ Shadow______]   │
│                      │
│  Category            │
│  [DJ ▾]              │
│                      │
│  City                │
│  [Colombo ▾]         │
│                      │
│  Bio                 │
│  [________________]  │
│  [________________]  │
│                      │
│  Social Links        │
│  IG: [@djshadow___] │
│  YT: [youtube.com/..│
│  SC: [soundcloud/..] │
│                      │
│  VERIFICATION        │
│  Status: ✅ Verified  │
│  Since: Mar 1, 2026  │
└──────────────────────┘
```

---

# 4. Admin Web Dashboard — All Pages

> **Layout:** Left sidebar navigation + main content area
> **Theme:** Same monochrome base, optimized for data density

---

## 4.1 Sidebar Navigation
```
┌─────────────────────────────────────────┐
│ ┌──────────┐                            │
│ │ ESocial  │  ADMIN DASHBOARD           │
│ │ ADMIN    │                            │
│ └──────────┘                            │
│ ┌──────┐ ┌────────────────────────────┐ │
│ │      │ │                            │ │
│ │ 📊   │ │    [MAIN CONTENT AREA]     │ │
│ │ Dash  │ │                            │ │
│ │      │ │                            │ │
│ │ 👥   │ │                            │ │
│ │Users │ │                            │ │
│ │      │ │                            │ │
│ │ ✅   │ │                            │ │
│ │Verify│ │                            │ │
│ │      │ │                            │ │
│ │ 📅   │ │                            │ │
│ │Events│ │                            │ │
│ │      │ │                            │ │
│ │ 📍   │ │                            │ │
│ │Venues│ │                            │ │
│ │      │ │                            │ │
│ │ 🛡️   │ │                            │ │
│ │Moder.│ │                            │ │
│ │      │ │                            │ │
│ │ 📊   │ │                            │ │
│ │Analyt│ │                            │ │
│ │      │ │                            │ │
│ │ ⚙️   │ │                            │ │
│ │Settin│ │                            │ │
│ │      │ │                            │ │
│ └──────┘ └────────────────────────────┘ │
└─────────────────────────────────────────┘
```
- **Assets needed (admin sidebar icons):**
  - `admin_icon_dashboard.svg`
  - `admin_icon_users.svg`
  - `admin_icon_verification.svg`
  - `admin_icon_events.svg`
  - `admin_icon_venues.svg`
  - `admin_icon_moderation.svg`
  - `admin_icon_analytics.svg`
  - `admin_icon_settings.svg`
  - `admin_icon_approval_queue.svg`
  - `admin_logo.svg` — Admin panel logo variant

---

## 4.2 Dashboard
```
┌──────────────────────────────────────┐
│  Dashboard                           │
│                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐│
│  │Users │ │Pend. │ │Events│ │Report││
│  │12,450│ │Verif.│ │  89  │ │  12  ││
│  │      │ │  7   │ │active│ │open  ││
│  └──────┘ └──────┘ └──────┘ └──────┘│
│                                      │
│  ┌──────────────────────────────────┐│
│  │ USER GROWTH CHART (30d)         ││
│  │ ╱╲  ╱╲╱╲                        ││
│  │╱  ╲╱      ╲                     ││
│  └──────────────────────────────────┘│
│                                      │
│  ┌────────────────┐┌────────────────┐│
│  │PENDING ACTIONS │ │UPCOMING EVENTS ││
│  │7 verif. pending│ │Beach Party 3/15││
│  │3 reports open  │ │Jazz Nite  3/18 ││
│  │2 events review │ │Neon Ngts  4/02 ││
│  └────────────────┘└────────────────┘│
└──────────────────────────────────────┘
```

---

## 4.3 Users Management
```
┌──────────────────────────────────────┐
│  Users          [Search] [+Filter]   │
│                                      │
│  ┌──────────────────────────────────┐│
│  │ Name    │ Role │ Status │ Joined ││
│  ├─────────┼──────┼────────┼────────┤│
│  │ John D. │ Cust │ Active │ 3/1/26 ││
│  │ DJ Shad │ Art  │ Verif. │ 2/15   ││
│  │ MC Exp  │ Art  │ Pend.  │ 3/5    ││
│  │ Jane S. │ Cust │ Susp.  │ 1/20   ││
│  └──────────────────────────────────┘│
│                                      │
│  [← 1 2 3 ... 45 →]                 │
│                                      │
│  ── User Detail Drawer ──           │
│  ┌──────────────────────────────────┐│
│  │ Name: DJ Shadow                  ││
│  │ Role: Artist                     ││
│  │ Status: Verified                 ││
│  │ Joined: Feb 15, 2026            ││
│  │ Events: 3 | Reels: 12           ││
│  │ Reports: 0                       ││
│  │                                  ││
│  │ [Suspend] [Ban] [View Profile]  ││
│  └──────────────────────────────────┘│
└──────────────────────────────────────┘
```

---

## 4.4 Artist Verification Queue
```
┌──────────────────────────────────────┐
│  Verification     [Pending][Reviewed]│
│                                      │
│  ┌──────────────────────────────────┐│
│  │ Artist     │ Submitted │ Status  ││
│  ├────────────┼───────────┼─────────┤│
│  │ MC Xplos.  │ Mar 5     │ ⏳ Pend ││
│  │ DJ Luna    │ Mar 4     │ ⏳ Pend ││
│  │ Singer Z   │ Mar 3     │ ✅ Appr ││
│  └──────────────────────────────────┘│
│                                      │
│  ── Review Panel ──                  │
│  ┌──────────────────────────────────┐│
│  │ MC Xplosion                      ││
│  │ Legal Name: [REDACTED]           ││
│  │ Stage Name: MC Xplosion          ││
│  │                                  ││
│  │ ID Document:                     ││
│  │ ┌──────────┐                     ││
│  │ │ [ID IMG] │                     ││
│  │ └──────────┘                     ││
│  │                                  ││
│  │ Portfolio Video:                 ││
│  │ [▶ Play Video]                   ││
│  │                                  ││
│  │ Social Links:                    ││
│  │ IG: @mcxplosion                  ││
│  │ YT: youtube.com/mcxplosion       ││
│  │                                  ││
│  │ Internal Notes:                  ││
│  │ [________________________]       ││
│  │                                  ││
│  │ [✅ Approve] [❌ Reject]         ││
│  │ [⚠️ Suspend] [⭐ Preferred]     ││
│  └──────────────────────────────────┘│
└──────────────────────────────────────┘
```

---

## 4.5 Content Approval Queue
```
┌──────────────────────────────────────┐
│  Content Approval   [Reels][Events]  │
│                                      │
│  ┌──────────────────────────────────┐│
│  │ Content   │ Artist  │ Submitted  ││
│  ├───────────┼─────────┼────────────┤│
│  │ 🎬 Reel   │ MC Xpl. │ 2h ago    ││
│  │ 📅 Event  │ DJ Luna │ 5h ago    ││
│  │ 🎬 Reel   │ Singer  │ 1d ago    ││
│  └──────────────────────────────────┘│
│                                      │
│  ── Preview Panel ──                 │
│  ┌──────────────────────────────────┐│
│  │ [CONTENT PREVIEW]                ││
│  │                                  ││
│  │ Caption: "Check this out..."     ││
│  │ Tags: #beach #dj #party         ││
│  │ Linked Event: Beach Party        ││
│  │                                  ││
│  │ [✅ Approve] [❌ Reject]         ││
│  │ Rejection reason:                ││
│  │ [________________________]       ││
│  │                                  ││
│  │ [Bulk Approve Selected (3)]      ││
│  └──────────────────────────────────┘│
└──────────────────────────────────────┘
```

---

## 4.6 Events Management
```
┌──────────────────────────────────────┐
│  Events   [+Create] [Search][Filter] │
│                                      │
│  ┌──────────────────────────────────┐│
│  │ Event     │ Date  │ Status│ Book ││
│  ├───────────┼───────┼───────┼──────┤│
│  │ Beach P.  │ 3/15  │ ✅ Pub│  45  ││
│  │ Jazz Nite │ 3/18  │ ✅ Pub│  23  ││
│  │ Neon Ngts │ 4/02  │ ⏳ Rev│   0  ││
│  │ TBD Event │  --   │ 📝 Drf│   0  ││
│  └──────────────────────────────────┘│
│                                      │
│  ── Event Detail Panel ──           │
│  ┌──────────────────────────────────┐│
│  │ Beach Party 2026                 ││
│  │ Status: Published                ││
│  │ Date: Mar 15, 8 PM - 2 AM       ││
│  │ Venue: Unawatuna Beach           ││
│  │ Bookings: 45                     ││
│  │                                  ││
│  │ CHANGE LOG                       ││
│  │ • Mar 5: Created by DJ Shadow   ││
│  │ • Mar 5: Approved by Admin      ││
│  │ • Mar 7: Lineup updated         ││
│  │                                  ││
│  │ [Edit] [Reschedule] [Cancel]    ││
│  └──────────────────────────────────┘│
└──────────────────────────────────────┘
```

---

## 4.7 Venues Management
```
┌──────────────────────────────────────┐
│  Venues      [+Add Venue] [Search]   │
│                                      │
│  ┌──────────────────┐┌──────────────┐│
│  │                  ││ Venue List   ││
│  │   [MAP VIEW]     ││              ││
│  │                  ││ Unawatuna B. ││
│  │   📍 📍          ││ Hilton Col.  ││
│  │        📍        ││ BMICH Hall   ││
│  │                  ││ Galle Fort   ││
│  └──────────────────┘└──────────────┘│
│                                      │
│  ── Venue Editor ──                  │
│  Name: [_______________]             │
│  Address: [____________]             │
│  City: [_______________]             │
│  Capacity: [___________]             │
│  📍 Pin on Map: [SET]                │
│  [Save] [Delete]                     │
└──────────────────────────────────────┘
```

---

## 4.8 Moderation Queue
```
┌──────────────────────────────────────┐
│  Moderation    [Open][Resolved][All] │
│                                      │
│  ┌──────────────────────────────────┐│
│  │ Report  │ Type │ Severity│ Date  ││
│  ├─────────┼──────┼─────────┼───────┤│
│  │ #R-001  │ Reel │ 🔴 High │ 3/7  ││
│  │ #R-002  │ User │ 🟡 Med  │ 3/6  ││
│  │ #R-003  │ Event│ 🟢 Low  │ 3/5  ││
│  └──────────────────────────────────┘│
│                                      │
│  ── Report Detail ──                 │
│  ┌──────────────────────────────────┐│
│  │ Report #R-001                    ││
│  │ Type: Reel                       ││
│  │ Reason: Inappropriate content    ││
│  │ Reporter: John D.               ││
│  │ Target: Reel by MC Xplosion     ││
│  │                                  ││
│  │ [CONTENT PREVIEW]                ││
│  │                                  ││
│  │ ARTIST STRIKE HISTORY            ││
│  │ • No previous strikes            ││
│  │                                  ││
│  │ ACTIONS                          ││
│  │ [Remove Content]                 ││
│  │ [Suspend Artist]                 ││
│  │ [Ban Artist]                     ││
│  │ [Require Re-verification]        ││
│  │ [Dismiss Report]                 ││
│  │ [Revoke Preferred Status]        ││
│  └──────────────────────────────────┘│
└──────────────────────────────────────┘
```

---

## 4.9 Analytics & Export
```
┌──────────────────────────────────────┐
│  Analytics        [7d][30d][Custom]  │
│                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐│
│  │ New  │ │Active│ │Events│ │Reels ││
│  │Users │ │Users │ │Creat.│ │Uplod.││
│  │+1,250│ │8,900 │ │  15  │ │ 234  ││
│  └──────┘ └──────┘ └──────┘ └──────┘│
│                                      │
│  ┌──────────────────────────────────┐│
│  │ USER GROWTH                      ││
│  │ [LINE CHART]                     ││
│  └──────────────────────────────────┘│
│  ┌──────────────────────────────────┐│
│  │ ENGAGEMENT BREAKDOWN             ││
│  │ [BAR CHART]                      ││
│  └──────────────────────────────────┘│
│  ┌──────────────────────────────────┐│
│  │ EVENT PERFORMANCE                ││
│  │ [TABLE]                          ││
│  └──────────────────────────────────┘│
│                                      │
│  [📥 Export CSV] [📥 Export PDF]     │
└──────────────────────────────────────┘
```

---

## 4.10 Policy Settings
```
┌──────────────────────────────────────┐
│  Settings                            │
│                                      │
│  REACTIONS                           │
│  Active reactions: 🔥 ❤️ 🙌 😮 🎉     │
│  [Edit Reaction Set]                 │
│                                      │
│  CONTENT APPROVAL                    │
│  Default mode: Manual Approval       │
│  [Manual ▾]                          │
│                                      │
│  MODERATION                          │
│  Auto-hide threshold: [5 reports ▾]  │
│                                      │
│  REPOST POLICY                       │
│  Caption allowed: [Yes ▾]            │
│                                      │
│  TICKET MODE (Phase 1)               │
│  [Free reservation ▾]                │
│                                      │
│  NEAR-ME                             │
│  Default radius: [25 km ▾]           │
│  Permission mode: [Ask once ▾]       │
│                                      │
│  [Save Changes]                      │
└──────────────────────────────────────┘
```

---

# 5. Public Web Preview Pages

> These are the deep-link landing pages for users who don't have the app installed.

### Page: Reel Preview (Web)
```
┌──────────────────────────────────────┐
│  [EventSocial Logo]                  │
│                                      │
│  ┌──────────────────────────────────┐│
│  │                                  ││
│  │      [VIDEO THUMBNAIL]           ││
│  │         ▶ Play                   ││
│  │                                  ││
│  └──────────────────────────────────┘│
│                                      │
│  "Check this out..." — @djshadow    │
│                                      │
│  ┌──────────────────────────────────┐│
│  │   Open in EventSocial App       ││  ← Primary CTA
│  └──────────────────────────────────┘│
│  ┌────────────┐ ┌────────────┐       │
│  │ App Store  │ │ Play Store │       │
│  └────────────┘ └────────────┘       │
│                                      │
│  © 2026 EventSocial                  │
└──────────────────────────────────────┘
```
- **Assets needed:**
  - `badge_app_store.svg` — Apple App Store download badge
  - `badge_play_store.svg` — Google Play Store download badge
  - `web_logo.svg` — Full EventSocial logo for web header

---

### Page: Event Preview (Web)
```
┌──────────────────────────────────────┐
│  [EventSocial Logo]                  │
│                                      │
│  ┌──────────────────────────────────┐│
│  │      [EVENT POSTER]              ││
│  └──────────────────────────────────┘│
│                                      │
│  Beach Party 2026                    │
│  📅 Sat, Mar 15 • 8:00 PM           │
│  📍 Unawatuna Beach                  │
│  🎵 DJ Shadow, MC Xplosion          │
│                                      │
│  ┌──────────────────────────────────┐│
│  │  Get Tickets in EventSocial     ││
│  └──────────────────────────────────┘│
│  ┌────────────┐ ┌────────────┐       │
│  │ App Store  │ │ Play Store │       │
│  └────────────┘ └────────────┘       │
└──────────────────────────────────────┘
```

---

### Page: Artist Preview (Web)
```
┌──────────────────────────────────────┐
│  [EventSocial Logo]                  │
│                                      │
│  ┌────┐                              │
│  │AVTR│  DJ Shadow                   │
│  └────┘  DJ • Colombo • ✅ Verified  │
│                                      │
│  Upcoming Events: 3                  │
│  Followers: 1,200                    │
│                                      │
│  ┌──────────────────────────────────┐│
│  │  Follow on EventSocial App      ││
│  └──────────────────────────────────┘│
│  ┌────────────┐ ┌────────────┐       │
│  │ App Store  │ │ Play Store │       │
│  └────────────┘ └────────────┘       │
└──────────────────────────────────────┘
```

---

# 6. Complete User Flows

## 6.1 Customer: First-Time User Flow
```
App Open → Splash → Welcome Screen → Phone OTP → Verify Code
→ Profile Setup → Interest Picker (optional) → Reels Feed (Home)
```

## 6.2 Customer: Discover & Book Flow
```
Reels Feed → Tap Artist → Artist Profile → Events Tab
→ Tap Event → Event Detail → Book Now → Confirm Booking
→ Success Screen → View in My Tickets
```

## 6.3 Customer: Save & Calendar Flow
```
Event Detail → Save Event → Calendar Tab → Select Date
→ View Saved Event → Open Event Detail → Book
```

## 6.4 Customer: Social Engagement Flow
```
Reels Feed → React to Reel → Repost → My Vibes Updated
→ Share Link Externally → Friend Opens Deep Link → Web Preview → Install App
```

## 6.5 Artist: Onboarding Flow
```
Sign Up → Verification Application (3 steps)
→ Submit → Verification Status (Pending) → [Wait]
→ Approved → Publishing Enabled → Create First Reel → Create First Event
```

## 6.6 Artist: Content Creation Flow
```
Home → Create Tab → Choose Reel → Upload Video → Trim/Edit
→ Add Music (optional) → Set Cover → Add Caption/Tags → Link to Event
→ Submit → Pending Approval (if not preferred) → Published
```

## 6.7 Artist: Event Management Flow
```
Events Tab → Create Event → Fill Details → Set Venue → Add Lineup
→ Save Draft / Submit → Pending Approval → Published
→ Monitor via Insights → Reschedule/Cancel if needed
```

## 6.8 Admin: Verification Flow
```
Dashboard → Verification Queue → Select Request → Review Documents
→ Preview Links/Portfolio → Approve / Reject (with reason) / Suspend
→ Optionally mark as Preferred Artist
```

## 6.9 Admin: Moderation Flow
```
Dashboard → Moderation Queue → Select Report → Review Content
→ Check Strike History → Take Action (Remove/Suspend/Ban/Dismiss)
→ Optionally Revoke Preferred Status → Action Logged
```

## 6.10 Admin: Content Approval Flow
```
Dashboard → Content Approval Queue → Filter by Reels/Events
→ Preview Content → Approve / Reject (with reason)
→ Bulk Approve multiple items → Notifications sent to artists
```

## 6.11 Deep Link Flow
```
User clicks shared link → Check: App installed?
→ YES: Open target screen (reel/event/artist) in app
→ NO: Open Web Preview Page → Show Store Badges
→ User installs app → Deferred deep link opens original target
```

---

# 7. Asset Checklist — Icons

> **Style:** Outlined + filled variants, 1.75–2px stroke, rounded joins
> **Sizes:** 24x24 (standard), 20x20 (compact), 32x32 (nav), 48x48 (empty states)
> **Format:** SVG (scalable), export also as PNG @1x, @2x, @3x for React Native
> **Color:** White default (tinted via code), provide black variants for light surfaces

## 7.1 Bottom Navigation Icons (Customer)
| # | Icon Name | Description | States |
|---|-----------|-------------|--------|
| 1 | `nav_feed_outline.svg` | Video reel / play icon | Inactive |
| 2 | `nav_feed_filled.svg` | Video reel / play icon | Active |
| 3 | `nav_calendar_outline.svg` | Calendar page | Inactive |
| 4 | `nav_calendar_filled.svg` | Calendar page | Active |
| 5 | `nav_search_outline.svg` | Magnifying glass | Inactive |
| 6 | `nav_search_filled.svg` | Magnifying glass | Active |
| 7 | `nav_tickets_outline.svg` | Ticket stub | Inactive |
| 8 | `nav_tickets_filled.svg` | Ticket stub | Active |
| 9 | `nav_profile_outline.svg` | User circle | Inactive |
| 10 | `nav_profile_filled.svg` | User circle | Active |

## 7.2 Bottom Navigation Icons (Artist)
| # | Icon Name | Description | States |
|---|-----------|-------------|--------|
| 11 | `nav_home_outline.svg` | House / dashboard | Inactive |
| 12 | `nav_home_filled.svg` | House / dashboard | Active |
| 13 | `nav_create_outline.svg` | Plus in circle | Inactive |
| 14 | `nav_create_filled.svg` | Plus in circle | Active |
| 15 | `nav_events_outline.svg` | Calendar with star | Inactive |
| 16 | `nav_events_filled.svg` | Calendar with star | Active |
| 17 | `nav_insights_outline.svg` | Bar chart / analytics | Inactive |
| 18 | `nav_insights_filled.svg` | Bar chart / analytics | Active |

## 7.3 Reel Action Icons
| # | Icon Name | Description |
|---|-----------|-------------|
| 19 | `action_react.svg` | Smiley / emoji face |
| 20 | `action_repost.svg` | Two arrows in loop / repost |
| 21 | `action_save_outline.svg` | Bookmark outline |
| 22 | `action_save_filled.svg` | Bookmark solid |
| 23 | `action_share.svg` | Share / send arrow |
| 24 | `action_follow_plus.svg` | User plus |
| 25 | `action_following_check.svg` | User checkmark (already following) |
| 26 | `action_report.svg` | Flag |
| 27 | `action_not_interested.svg` | Circle with minus / X |

## 7.4 Reaction Emojis (Custom Styled)
| # | Icon Name | Description |
|---|-----------|-------------|
| 28 | `reaction_fire.svg` | 🔥 Fire — Hot / lit |
| 29 | `reaction_heart.svg` | ❤️ Heart — Love |
| 30 | `reaction_hands.svg` | 🙌 Raised hands — Hype |
| 31 | `reaction_wow.svg` | 😮 Open mouth — Wow |
| 32 | `reaction_party.svg` | 🎉 Party popper — Celebrate |

## 7.5 Media & Content Icons
| # | Icon Name | Description |
|---|-----------|-------------|
| 33 | `icon_play.svg` | Play triangle |
| 34 | `icon_pause.svg` | Pause bars |
| 35 | `icon_mute.svg` | Speaker with X |
| 36 | `icon_unmute.svg` | Speaker with waves |
| 37 | `icon_music_note.svg` | Music note |
| 38 | `icon_trim.svg` | Scissors |
| 39 | `icon_add_music.svg` | Music note + plus |
| 40 | `icon_audio_mix.svg` | Equalizer / sliders |
| 41 | `icon_camera.svg` | Camera |
| 42 | `icon_video_camera.svg` | Video camera |
| 43 | `icon_gallery.svg` | Photo gallery / grid |

## 7.6 Event & Venue Icons
| # | Icon Name | Description |
|---|-----------|-------------|
| 44 | `icon_calendar.svg` | Calendar page |
| 45 | `icon_clock.svg` | Clock |
| 46 | `icon_location_pin.svg` | Map pin / marker |
| 47 | `icon_directions.svg` | Navigation / directions arrow |
| 48 | `icon_near_me.svg` | Crosshair / near me |
| 49 | `icon_age_18plus.svg` | 18+ badge |
| 50 | `icon_category_tag.svg` | Tag / label |
| 51 | `icon_ticket.svg` | Ticket |
| 52 | `icon_ticket_qr.svg` | QR code |
| 53 | `icon_lineup.svg` | Users group / lineup |

## 7.7 Status & Verification Icons
| # | Icon Name | Description |
|---|-----------|-------------|
| 54 | `icon_verified.svg` | Checkmark in shield / circle (green) |
| 55 | `icon_pending.svg` | Hourglass / clock |
| 56 | `icon_rejected.svg` | X in circle (red) |
| 57 | `icon_approved.svg` | Check in circle (green) |
| 58 | `icon_suspended.svg` | Slash circle |
| 59 | `icon_preferred_star.svg` | Star badge (preferred artist) |
| 60 | `icon_warning.svg` | Triangle with exclamation |
| 61 | `icon_reschedule.svg` | Refresh / circular arrows |

## 7.8 General UI Icons
| # | Icon Name | Description |
|---|-----------|-------------|
| 62 | `icon_back_arrow.svg` | Left arrow |
| 63 | `icon_close_x.svg` | Close X |
| 64 | `icon_chevron_down.svg` | Chevron down |
| 65 | `icon_chevron_right.svg` | Chevron right |
| 66 | `icon_more_dots.svg` | Three dots (vertical) |
| 67 | `icon_filter.svg` | Filter funnel |
| 68 | `icon_sort.svg` | Sort arrows |
| 69 | `icon_edit_pencil.svg` | Pencil |
| 70 | `icon_delete_trash.svg` | Trash can |
| 71 | `icon_check.svg` | Checkmark |
| 72 | `icon_plus.svg` | Plus |
| 73 | `icon_minus.svg` | Minus |
| 74 | `icon_info.svg` | Info circle |
| 75 | `icon_copy.svg` | Copy / clipboard |
| 76 | `icon_download.svg` | Download arrow |
| 77 | `icon_upload.svg` | Upload arrow |
| 78 | `icon_refresh.svg` | Refresh |
| 79 | `icon_eye.svg` | Eye (visible) |
| 80 | `icon_eye_off.svg` | Eye with slash (hidden) |

## 7.9 Settings & Profile Icons
| # | Icon Name | Description |
|---|-----------|-------------|
| 81 | `icon_settings_gear.svg` | Gear / cog |
| 82 | `icon_notification_bell.svg` | Bell |
| 83 | `icon_notification_bell_dot.svg` | Bell with notification dot |
| 84 | `icon_privacy_lock.svg` | Padlock |
| 85 | `icon_help_circle.svg` | Question mark in circle |
| 86 | `icon_terms.svg` | Document / legal |
| 87 | `icon_logout.svg` | Door with arrow |
| 88 | `icon_delete_account.svg` | User with X (destructive) |
| 89 | `icon_blocked_users.svg` | User with slash |
| 90 | `icon_linked_accounts.svg` | Chain links |

## 7.10 Social Platform Icons
| # | Icon Name | Description |
|---|-----------|-------------|
| 91 | `icon_instagram.svg` | Instagram logo |
| 92 | `icon_youtube.svg` | YouTube logo |
| 93 | `icon_soundcloud.svg` | SoundCloud logo |
| 94 | `icon_spotify.svg` | Spotify logo |
| 95 | `icon_tiktok.svg` | TikTok logo |
| 96 | `icon_facebook.svg` | Facebook logo |
| 97 | `icon_twitter_x.svg` | X (Twitter) logo |
| 98 | `icon_whatsapp.svg` | WhatsApp logo |
| 99 | `icon_website_globe.svg` | Globe / website |
| 100 | `icon_google.svg` | Google logo |
| 101 | `icon_apple.svg` | Apple logo |

## 7.11 Analytics & Insight Icons
| # | Icon Name | Description |
|---|-----------|-------------|
| 102 | `icon_trend_up.svg` | Arrow trending up (green) |
| 103 | `icon_trend_down.svg` | Arrow trending down (red) |
| 104 | `icon_views_eye.svg` | Eye for view count |
| 105 | `icon_chart_bar.svg` | Bar chart |
| 106 | `icon_chart_line.svg` | Line chart |
| 107 | `icon_export_csv.svg` | File with CSV label |
| 108 | `icon_export_pdf.svg` | File with PDF label |

## 7.12 Admin Panel Icons
| # | Icon Name | Description |
|---|-----------|-------------|
| 109 | `admin_dashboard.svg` | Dashboard grid |
| 110 | `admin_users.svg` | Users multiple |
| 111 | `admin_verification.svg` | Shield with check |
| 112 | `admin_events.svg` | Calendar with check |
| 113 | `admin_venues.svg` | Map with pin |
| 114 | `admin_moderation.svg` | Shield with flag |
| 115 | `admin_analytics.svg` | Chart / analytics |
| 116 | `admin_settings.svg` | Gear with sliders |
| 117 | `admin_approval.svg` | Clipboard with check |
| 118 | `admin_bulk_action.svg` | Stacked checkmarks |

## 7.13 Category Chip Icons (Small, 20x20)
| # | Icon Name | Description |
|---|-----------|-------------|
| 119 | `cat_dj.svg` | Turntable / headphones |
| 120 | `cat_live_band.svg` | Guitar |
| 121 | `cat_singer.svg` | Microphone |
| 122 | `cat_standup.svg` | Comedy mic with laugh |
| 123 | `cat_electronic.svg` | Synth wave |
| 124 | `cat_hiphop.svg` | Boombox / cap |
| 125 | `cat_jazz.svg` | Saxophone |
| 126 | `cat_classical.svg` | Violin / sheet music |
| 127 | `cat_rock.svg` | Electric guitar |
| 128 | `cat_rnb.svg` | Musical notes |
| 129 | `cat_reggae.svg` | Palm / peace |
| 130 | `cat_cultural.svg` | Traditional drum |

---

# 8. Asset Checklist — Images & Illustrations

> **Style:** High-contrast monochrome base with `#FF5482` and `#00FFA1` accent gradients
> **Format:** PNG @1x @2x @3x for mobile, SVG/WebP for web
> **Mood:** Dark, moody, premium event/music feel

## 8.1 Branding Assets
| # | Asset Name | Description | Size/Format |
|---|-----------|-------------|-------------|
| 1 | `logo_full_white.svg` | Full EventSocial logo — white on transparent | SVG + PNG |
| 2 | `logo_full_black.svg` | Full EventSocial logo — black on transparent | SVG + PNG |
| 3 | `logo_full_color.svg` | Full logo with pink/green accents | SVG + PNG |
| 4 | `logo_icon_only.svg` | App icon mark only (for favicon, small uses) | SVG + PNG |
| 5 | `app_icon.png` | App store icon (1024x1024) | PNG |
| 6 | `app_icon_android.png` | Adaptive icon (foreground layer, 512x512) | PNG |
| 7 | `splash_logo.png` | Splash screen centered logo | PNG @3x |

## 8.2 Onboarding Illustrations
| # | Asset Name | Description | Size |
|---|-----------|-------------|------|
| 8 | `onboarding_hero_welcome.png` | Concert crowd silhouette, neon pink/green lighting | 375x400 @3x |
| 9 | `onboarding_slide_discover.png` | Phone with reels feed, music waves | 300x300 @3x |
| 10 | `onboarding_slide_events.png` | Calendar with event cards floating | 300x300 @3x |
| 11 | `onboarding_slide_connect.png` | Artist and crowd connected by waves | 300x300 @3x |

## 8.3 Empty State Illustrations
| # | Asset Name | Description | Size |
|---|-----------|-------------|------|
| 12 | `empty_feed.png` | Abstract music speaker with play button | 200x200 @3x |
| 13 | `empty_search_results.png` | Magnifying glass over empty area | 200x200 @3x |
| 14 | `empty_tickets.png` | Ticket shape with dotted outline | 200x200 @3x |
| 15 | `empty_vibes.png` | Abstract music wave pattern, invitation to repost | 200x200 @3x |
| 16 | `empty_saved.png` | Empty bookmark shelf | 200x200 @3x |
| 17 | `empty_following.png` | Silhouettes with + follow buttons | 200x200 @3x |
| 18 | `empty_notifications.png` | Bell with zzz / sleeping | 200x200 @3x |
| 19 | `empty_events_artist.png` | Calendar with arrow pointing to create | 200x200 @3x |
| 20 | `empty_insights.png` | Chart outline with "coming soon" vibe | 200x200 @3x |
| 21 | `empty_calendar_day.png` | Calendar day with no entries | 200x200 @3x |

## 8.4 Error & Status Illustrations
| # | Asset Name | Description | Size |
|---|-----------|-------------|------|
| 22 | `error_network.png` | Disconnected plug / no signal | 200x200 @3x |
| 23 | `error_generic.png` | Warning triangle, abstract | 200x200 @3x |
| 24 | `error_404.png` | Lost / page not found (for web) | 300x300 |
| 25 | `status_location_access.png` | Map pin asking for permission | 200x200 @3x |
| 26 | `status_account_suspended.png` | User with lock/block | 200x200 @3x |
| 27 | `status_permission_denied.png` | Lock with slash | 200x200 @3x |

## 8.5 Placeholder Images
| # | Asset Name | Description | Size |
|---|-----------|-------------|------|
| 28 | `placeholder_avatar_user.png` | Default user avatar silhouette (dark bg) | 120x120 @3x |
| 29 | `placeholder_avatar_artist.png` | Default artist avatar with verified pending | 120x120 @3x |
| 30 | `placeholder_event_poster.png` | Dark gradient with calendar icon | 375x200 @3x |
| 31 | `placeholder_reel_thumb.png` | Dark gradient with play icon | 120x160 @3x |
| 32 | `placeholder_venue.png` | Venue with map pin silhouette | 375x200 @3x |
| 33 | `placeholder_banner_upload.png` | Dashed border with upload icon | 375x200 @3x |

## 8.6 Map Assets
| # | Asset Name | Description | Size |
|---|-----------|-------------|------|
| 34 | `map_pin_event.png` | Custom map pin for events (pink accent) | 48x64 @3x |
| 35 | `map_pin_venue.png` | Custom map pin for venues (green accent) | 48x64 @3x |
| 36 | `map_pin_user.png` | Custom map pin for user location (white) | 32x32 @3x |

## 8.7 Web / Marketing Assets
| # | Asset Name | Description | Size |
|---|-----------|-------------|------|
| 37 | `web_og_image.png` | Open Graph fallback image for social sharing | 1200x630 |
| 38 | `badge_app_store.svg` | "Download on the App Store" badge | SVG |
| 39 | `badge_play_store.svg` | "Get it on Google Play" badge | SVG |
| 40 | `web_hero_bg.png` | Dark concert/event background for preview pages | 1440x800 |

## 8.8 Backgrounds & Textures
| # | Asset Name | Description | Size |
|---|-----------|-------------|------|
| 41 | `bg_gradient_dark.png` | Subtle dark gradient (for cards/headers) | Tileable |
| 42 | `bg_noise_texture.png` | Subtle grain/noise overlay for depth | Tileable |
| 43 | `bg_mesh_pink_green.png` | Soft mesh gradient with brand accents | 1440x900 |
| 44 | `bg_success_confetti.png` | Static confetti fallback for booking success | 375x200 @3x |

---

# 9. Asset Checklist — Animations & Lottie

> **Format:** Lottie JSON files for React Native and web
> **Duration:** Keep under 3 seconds for micro-interactions
> **Colors:** Match brand palette (white, `#FF5482`, `#00FFA1`)

| # | Asset Name | Description | Duration |
|---|-----------|-------------|----------|
| 1 | `anim_splash_logo.json` | Logo reveal with subtle pulse | 1.5s |
| 2 | `anim_loading_spinner.json` | Branded loading spinner (music wave or circle) | Loop |
| 3 | `anim_pull_to_refresh.json` | Pull-to-refresh animation | 1s |
| 4 | `anim_success_check.json` | Green checkmark success | 1.2s |
| 5 | `anim_booking_confetti.json` | Confetti burst on booking confirmation | 2s |
| 6 | `anim_reaction_fire.json` | Fire emoji pop animation | 0.6s |
| 7 | `anim_reaction_heart.json` | Heart float up animation | 0.6s |
| 8 | `anim_follow_plus.json` | Follow button pulse transition | 0.4s |
| 9 | `anim_empty_state.json` | Gentle bobbing for empty state illustrations | Loop |
| 10 | `anim_upload_progress.json` | Upload progress circle fill | Variable |
| 11 | `anim_notification_bell.json` | Bell shake on new notification | 0.5s |
| 12 | `anim_verified_badge.json` | Verified badge reveal sparkle | 0.8s |
| 13 | `anim_skeleton_shimmer.json` | Skeleton loading shimmer effect | Loop |

---

# 10. Asset Checklist — Audio

> **Format:** MP3 + M4A, <100KB each
> **Usage:** Haptic feedback audio cues (optional, polished UX)

| # | Asset Name | Description |
|---|-----------|-------------|
| 1 | `sfx_react_pop.mp3` | Soft pop sound when reacting |
| 2 | `sfx_repost_whoosh.mp3` | Whoosh sound on repost |
| 3 | `sfx_save_click.mp3` | Click/bookmark sound on save |
| 4 | `sfx_booking_success.mp3` | Success chime on ticket booking |
| 5 | `sfx_notification.mp3` | Notification alert tone |
| 6 | `sfx_error.mp3` | Subtle error tone |

---

# 11. AI Generation Prompt Guide

> Use these prompts as starting points when generating assets via AI tools (Midjourney, DALL·E, Ideogram, etc.)

## 11.1 Style Reference for All Assets
```
Style: Dark, premium, monochrome base with neon accent lighting.
Color palette: Deep black (#050505), white (#FFFFFF), neon pink (#FF5482), neon green (#00FFA1).
Mood: Modern music/events app — vibrant energy, nightlife, live performance.
No text in images unless specifically requested.
Clean, minimal, high-contrast.
```

## 11.2 Sample Prompts — Illustrations

**Welcome Hero:**
```
A dark moody concert crowd silhouette with raised hands, lit by neon pink 
and green stage lights from above. Abstract, wallpaper style. No text. 
Black background. Mobile portrait format. Premium minimal aesthetic.
```

**Empty Feed:**
```
Minimalist abstract speaker icon with sound waves, monochrome white on 
black background, subtle neon pink glow. Flat illustration style. 
200x200 icon. No text.
```

**Empty Tickets:**
```
Minimalist ticket shape with dashed outline on dark background. Subtle 
neon green accent. Flat icon style. No text. 200x200.
```

**Network Error:**
```
Minimalist disconnected cable/plug icon on dark background. Monochrome 
white with subtle neon pink warning glow. Clean flat illustration. 200x200.
```

**Booking Confetti:**
```
Abstract confetti burst with neon pink and green particles on dark 
background. Celebration, event vibes. No text. Transparent background.
```

## 11.3 Sample Prompts — Icons

**For custom icon set generation:**
```
Design a [ICON_NAME] icon in outlined style, 2px stroke width, rounded 
joins and caps. White on transparent background. 24x24 grid. Minimal, 
modern. SVG-ready clean vector.
```

**For reaction emojis:**
```
Design a custom [EMOJI_TYPE] emoji in neon style. Glowing [#FF5482 pink / 
#00FFA1 green] on dark background. Expressive, fun, event-themed. 
48x48 size. No text.
```

## 11.4 Sample Prompts — App Icon

```
Mobile app icon for "EventSocial" — a music and events social platform. 
Abstract sound wave or play button merged with music note. Neon pink 
(#FF5482) and neon green (#00FFA1) gradient on deep black (#050505). 
Clean, modern, recognizable at small sizes. 1024x1024 iOS app icon format. 
No text, symbol only.
```

## 11.5 Sample Prompts — Backgrounds

**Dark mesh gradient:**
```
Abstract mesh gradient background. Deep black base with soft neon pink 
(#FF5482) and neon green (#00FFA1) light blobs. Smooth, unfocused, no 
sharp edges. Premium feel. 1440x900.
```

**Grain texture:**
```
Subtle film grain noise texture overlay. Very light white noise on 
transparent background. Tileable. 512x512.
```

---

# Summary: Total Asset Count

| Category | Count |
|----------|-------|
| **Icons (SVG)** | ~130 icons |
| **Illustrations (PNG)** | ~27 illustrations |
| **Placeholder Images** | ~6 placeholders |
| **Branding Assets** | ~7 brand files |
| **Map Assets** | 3 custom pins |
| **Web/Marketing Assets** | ~4 assets |
| **Backgrounds/Textures** | ~4 textures |
| **Lottie Animations** | ~13 animations |
| **Sound Effects** | ~6 audio files |
| **App Screens (Total)** | ~45+ unique screens |
| | |
| **GRAND TOTAL** | **~200+ assets to generate** |

---

# Folder Structure for Generated Assets

```
RequirementDocs/UIUX/
├── Icons/
│   ├── Navigation/          ← nav_*.svg
│   ├── Actions/             ← action_*.svg
│   ├── Reactions/           ← reaction_*.svg
│   ├── Media/               ← icon_play, icon_mute, etc.
│   ├── Events/              ← icon_calendar, icon_ticket, etc.
│   ├── Status/              ← icon_verified, icon_pending, etc.
│   ├── General/             ← icon_back, icon_close, etc.
│   ├── Settings/            ← icon_settings, icon_bell, etc.
│   ├── Social/              ← icon_instagram, icon_youtube, etc.
│   ├── Analytics/           ← icon_trend, icon_chart, etc.
│   ├── Admin/               ← admin_*.svg
│   └── Categories/          ← cat_*.svg
├── Illustrations/
│   ├── Onboarding/          ← onboarding_*.png
│   ├── EmptyStates/         ← empty_*.png
│   ├── Errors/              ← error_*.png
│   └── Status/              ← status_*.png
├── Placeholders/            ← placeholder_*.png
├── Branding/               ← logo_*, app_icon.*
├── Maps/                   ← map_pin_*.png
├── Backgrounds/            ← bg_*.png
├── Web/                    ← web_*, badge_*
├── Animations/             ← anim_*.json
└── Audio/                  ← sfx_*.mp3
```

---

> **Next Steps:**
> 1. Generate all icons first (they block UI development the most)
> 2. Generate illustrations for empty states and onboarding
> 3. Generate branding (logo, app icon, splash)
> 4. Generate backgrounds and textures
> 5. Create Lottie animations (can use LottieFiles or After Effects)
> 6. Sound effects can be sourced from Freesound.org or generated
