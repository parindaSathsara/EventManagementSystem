# Sinhala voice notes — 9 July 2026 — English

Four WhatsApp voice notes from a client giving feedback to a developer on an
events / ticketing app. Transcribed with OpenAI `gpt-4o-transcribe` and Google
Speech-to-Text (si-LK), then reconciled and translated with `gpt-4o`.

The speaker mixes Sinhala with English product terms ("Buy Tickets", "headliner",
"flyer", "event category"), which is why the raw transcripts look half-English.

---

## Clip 1 — 15:46:46 (1.0 MB, the long one)

A walkthrough of UI changes. This is the bulk of the feedback.

1. **Button colour** — the logo is red and black, so change the purple buttons to red.
2. **"Buy Tickets" position** — currently centered; move it slightly to the right.
3. **"See More" on long descriptions** — when a description is too long it doesn't
   expand. Make clicking "See More" open the event page directly.
4. **Back navigation** — going back out of an event jumps to the top of the wall.
   It should return to that event's position instead.
5. **Remove the "Headliner" label** under the first artist in the lineup.
6. **Alert screen font** — match the alert topic's font size to "For You / Following"
   in the timeline.
7. **Remove the event category** shown next to "Buy Now" — ticket categories are
   already displayed there, and one lone category next to "Buy Now" is confusing.
8. **Followers count is broken** — it isn't displaying. It used to work, so this is
   a regression.
9. **"Reveal Soon"** — replace the "No Social Link Added" message with something
   like *"More artists are coming soon from the event companies below"*, and show
   the upcoming-events count. Social links aren't added at that stage anyway.
10. **Expired events** — disable the "Buy Tickets" button once the event date/time
    has passed.
11. **Event time picker** — selecting minutes applies the same value to both start
    time and end time. They need to be settable separately.
12. **Profile categories** — currently DJ / Singer / Band / Producer. Change to
    **Event Company, Artist, Musician, Band, Other**.
13. **Event creation + calendar** — event creation should tie into the calendar;
    also mentions a "+" icon placed between search and the timeline for creating
    an event as an event company / manager.

> Note: `gpt-4o-transcribe` truncated near the end of this clip. Item 13 is
> reconstructed largely from the Google transcript and is the least certain.

---

## Clip 2 — 15:50:17

A question, not a change request:

> "After we publish an event and then edit it, does it refresh and come back to the
> top? Is there an algorithm for that, or not? For example, when we add more artists
> or ticket prices and then edit the event — does it pop up again for everyone who
> followed it? Give me a call when you have time, or a voice note is fine too."

**What's being asked:** does editing an event re-surface it in followers' feeds, and
is that behaviour algorithmic or not. They want an explanation, by call or voice note.

---

## Clip 3 — 15:58:26 (shortest)

A bug report:

> "In our app I can't upload these photos. It's hard to find how to capture a flyer.
> Can you check why it isn't working? I can't upload. Or is it a problem with my device?"

**What's being asked:** photo/flyer upload is failing, and the capture option is hard
to find. They're unsure whether it's the app or their own phone.

---

## Clip 4 — 16:08:15

A follow-up on flyer display:

> "On the wall, an uploaded flyer isn't shown in full — only the top half. Show the top
> portion as it actually is. Then when you click through into the event, show the whole
> flyer, and put the event company's detail box *below* the flyer. Can we do it that
> way? Let me know, or let's talk it over."

**What's being asked:** flyer is cropped on the wall; inside the event show it in full
with the event-company detail box underneath.

---

## Engine notes

| Pass | Result |
|---|---|
| OpenAI `gpt-4o-transcribe` | Best Sinhala transcript. Truncates long clips. |
| OpenAI `whisper-1` transcribe | **Unusable** — decoded Sinhala into Kannada script. Dropped. |
| OpenAI `whisper-1` translations | Decent English, but falls into repetition loops on long audio. |
| Google Speech-to-Text si-LK | Noisier than gpt-4o but runs to the end of long clips. |

OpenAI rejects `language="si"` outright on both transcription models — Sinhala is
reached only via auto-detect with a prompt hint. Google needs `sampleRateHertz=48000`
for WhatsApp PTT files; the 16000 in `sinhala_web.py` fails on them.
