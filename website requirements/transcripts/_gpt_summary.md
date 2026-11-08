Client voice-note summary: Stage events WEBSITE (Next.js)

Themes and actionable changes

Discover (event grid/listing)
- Ticket price/categories display (Clip 1)
  - Implement rule on event cards: if exactly 2 ticket categories exist, show both labels; otherwise hide the ticket price/categories line entirely.
  - Optional longer-term: make the ticket categories area dynamically reflect all categories as they’re added (needs confirmation; see Ambiguities).
- Flyer image cropping on cards (Clip 2)
  - Adjust image styles so flyers align from top and avoid face/neck cropping (e.g., object-fit: cover; object-position: top center). Maintain consistent card aspect ratio.
- “Browse by” order (Clip 3)
  - Set the order to: All, Festival, EDM, Live Event, Concert, Hip Hop, [last item unclear – see Ambiguities].
- Follow and Following filter (Clips 7, 12)
  - Add Follow capability (users follow organizers/companies).
  - Add a “Following” view/filter in Discover to show events from followed organizers (parity with app).
- Discover caption (Clip 10)
  - No change implemented yet. The caption currently reads “Find your next night out.” Confirm if copy needs to change (see Ambiguities).

Event detail page
- Full-bleed flyer hero treatment (Clip 11)
  - Make the event flyer fill the main viewport area and retain the current blur effect.
  - Do not render the standard header/footer over the hero area (or render them hidden/overlay per final UX); ensure clear back/close navigation.
- Artist social links (Clip 14)
  - In the lineup, display Facebook, Instagram, and TikTok icons next to each artist’s name (if links exist).
  - Clicking an icon opens the artist’s profile on that platform in a new tab.
- Ticket section fallbacks (Clip 13)
  - If tickets aren’t added, show a status message like “Stay tuned” or “Tickets coming soon” in the tickets section.
  - Stop auto-creating/publishing a default “General Admission” ticket when none are provided (or hide it) per final decision (see Ambiguities).
- Flyer fallback logic (Clip 13)
  - If no flyer is uploaded for the event, do not auto-pull an unrelated/previous flyer. Show a neutral placeholder or nothing (confirm preferred placeholder; see Ambiguities).

Header and top navigation
- Rename “Artists” to “Artists & Organizers” (Clip 5)
  - Update the label, pending final copy decision (see Ambiguities).
- Remove “Tickets” from the header (Clip 9)
  - Hide/remove Tickets from the top nav for now. Keep third‑party QR flow operational in the backend.
- Branding/logo (Clip 4)
  - Replace the changing/incorrect logo with the provided Danan logo. Implement correct variants for light/dark if needed (see Ambiguities).

Organizer workspace and dashboard
- Sidebar and labels (Clip 15)
  - In Workspace, keep “New reel” and remove the duplicate/other reel item for now (clarify which one is “the other”).
  - Change “View as Customer” to “View as User.”
- Overview metrics (Clip 17)
  - Replace “Tickets Book” with “Follow Count” (number of followers of the organizer).
  - Add a fourth metric “Day Count” and display four tiles: Upcoming Events, Follow Count, Events Saved, Day Count (define Day Count; see Ambiguities).
- Ticket creation form UX (Clip 18)
  - In the ticket name field, treat “General Admission” as placeholder text (not prefilled value). Allow typing directly without deleting preset text. Validate if left empty.

Alerts and following
- Alerts behavior (Clips 7, 8, 12)
  - Implement Alerts to show updates from followed organizers (parity with app).
  - Clarify visibility: should Alerts be available to all signed-in users or only organizers? If both, define differences (see Ambiguities).

Footer
- Remove these links for now (Clip 16)
  - Under “Your Stage”: remove “My Tickets.”
  - Under “Discover”: remove “Reels.”

Reels
- Web Reels timing (Clip 6)
  - Defer Reels section to the next update. No user-facing Reels entry in footer for now (Clip 16).
  - Organizer Workspace still shows “New reel” (Clip 15) while the public section is deferred.

Third‑party ticketing/QR
- Keep current QR pass-through (Clip 9)
  - No change to QR ingestion for third‑party purchases; only remove the “Tickets” header nav link.

Ambiguities / decisions needed from client
- Ticket categories on cards (Clip 1)
  - Long-term behavior when there are 3+ categories: show all? show first 2 + “+N more”? or always hide beyond 2?
  - When there’s exactly 1 category, should we also hide the price line (as implied) or show that single category/price?
- Discover image crop specifics (Clip 2)
  - Confirm target aspect ratio for cards and whether to always align from top center. Any exceptions?
- “Browse by” taxonomy (Clip 3)
  - Confirm the last category after “Hip Hop” (audio unclear).
  - Confirm exact casing and wording: “Live Event” vs “Live Events.”
- Header renaming (Clip 5)
  - Confirm final copy for the menu label: “Artists & Organizers” or another phrasing? Any tooltip/helper text desired?
- Event detail hero (Clip 11)
  - Should the global header/footer be fully hidden on event pages, or overlaid/transparent until scroll?
  - Confirm desired scroll behavior and placement of navigation/back CTA.
- Alerts scope (Clips 8, 12)
  - Is Alerts available to all signed-in users or only to organizers?
  - Define what counts as an “update” (new events, changes, announcements?) and sources (organizers only, or artists too?).
- Social links source (Clip 14)
  - Confirm that the Facebook/Instagram/TikTok URLs are per-artist (entered by organizer) and shown only when present.
- Default ticket logic (Clip 13)
  - Should we disable auto-creation of “General Admission” entirely, or keep it in draft and never auto-publish? If we keep it, do we still show “Coming soon” when only a default exists?
- Flyer fallback (Clip 13)
  - Provide/approve a neutral placeholder asset or prefer to show nothing until a flyer is uploaded.
- “Day Count” definition (Clip 17)
  - What exactly should “Day Count” represent? Examples: days until next event, active days this month, event days this month, etc.
- Organizer Overview “Events Saved” (Clip 17)
  - Confirm whether this means events saved/bookmarked by users for this organizer, or events saved by the organizer as drafts.
- Workspace “New reel” duplication (Clip 15)
  - Identify which “other” Reel item to remove (screenshot or path).
- Discover caption (Clip 10)
  - Do you want to change “Find your next night out”? If yes, provide final copy.
- Following targets (Clips 7, 12)
  - Confirm whether users can follow only organizers/companies, or also artists, events, and/or genres.
- “My Tickets” removal impact (Clip 16)
  - If users import third‑party QR tickets, where should they access/view them with “My Tickets” removed? Provide alternate entry point.

Items that are about the mobile app (not the website)
- Reference parity only (no immediate app action): image-cropping behavior, Follow/Alerts flows “same as in the app” (Clips 2, 7, 8, 12, 14).
- Potential app-specific change: show “Stay tuned”/“Tickets coming soon” in the app ticket section when no tickets exist (Clip 13). Please confirm if you also want this implemented on the website (we’ve planned it for web unless you say otherwise).

Notes for implementation
- Await the Danan logo asset and any light/dark variants (Clip 4).
- Ensure follow data model supports organizer follows and drives both Discover “Following” and Alerts feeds.
- Coordinate UI copy updates once client confirms ambiguous items.