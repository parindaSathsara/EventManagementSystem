# New folder — 2 voice notes, 26 July 2026 — English

Client feedback on the events / ticketing app. Sinhala transcribed with
`gpt-4o-transcribe` + Google Speech-to-Text (si-LK), reconciled and translated
with `gpt-4o`. Sinhala originals are in the per-clip `.txt` / `.json` files.

---

## Clip 1 — `WhatsApp Ptt 2026-07-26 at 18.28.29.ogg` (0.96 MB)

### Translation

> Brother, I checked the app — I just took a deep look at it now. There are a few
> small tweaks needed here and there. Could you take a look at these small issues
> and fix them? After that, I'll send you a logo tomorrow. I said the logo will be
> ready tomorrow. Once I send it and it's added, everything will be complete. After
> everything is done, check it over and let me know.
>
> Initially, when setting up an account, there's a section called "artist profile."
> We need to remove the "artist" label and replace it with "stage profile." In the
> public identity section there's a field labelled "handle," where the example name
> "Mihiran" appears. Instead of showing a default name like that, let's have it say
> "Enter name." Similarly, in the bio box, let's have it say "Enter short bio."
>
> In the account's edit-profile section there's a social media field labelled
> "Spotify." Change "Spotify" to "TikTok." Also, in the typing box where it says
> "your handle," make sure it reflects the same change. For YouTube, let's have it
> say "channel name."
>
> In the profile section under "upcoming events," when we click on an event it
> doesn't display the event details. Check whether this option is working or needs
> fixing. On the homepage under "active events," the date is shown in black. It
> would be better in white — black is hard to see.
>
> When creating an event, in the lineup section there's a "headliner" label that
> appears first. We should remove it. When users go to create an event, the first
> thing they see is that "headliner" label, and it should be gone.
>
> When clicking "buy ticket," it currently opens a form we originally created. We
> need to remove that form because we're now using a third-party ticketing
> platform. Make clicking "buy ticket" link directly to the third-party platform.
>
> Lastly, in the timeline, when users go to an event there's a "buy now" button on
> the left with "ticket from" and the ticket price. Remove the "ticket from" part
> and just have the "buy now" button. That's all for now. I'll send the logo
> tomorrow, and once that's done everything will be complete.

### Action items

1. Replace **"Artist profile" with "Stage profile"** in account setup.
2. Handle field shows a hardcoded example name **"Mihiran"** — replace with the
   placeholder **"Enter name."**
3. Bio box placeholder → **"Enter short bio."**
4. Social links: **replace Spotify with TikTok** in edit-profile.
5. The **"your handle"** typing box must follow that same Spotify → TikTok change.
6. YouTube field → **"channel name."**
7. **Bug:** under the profile's **Upcoming Events**, clicking an event does not open
   its details. Check whether the option works at all.
8. **Active Events** date on the homepage renders black and is hard to read — make
   it **white**.
9. **Remove the "Headliner" label** from the lineup on event creation.
10. **"Buy Ticket" still opens the old built-in form.** They've moved to a
    third-party ticketing platform — remove the form and link straight out to it.
11. Timeline: drop **"Ticket from &lt;price&gt;"** and keep only the Buy Now button.

### Notes

- "Check the metrics and let me know" near the start is uncertain in both engines —
  it may just mean "check it over and report back."
- The third-party ticketing platform is **not named** in the clip.

---

## Clip 2 — `WhatsApp Ptt 2026-07-26 at 18.35.08.ogg` (0.19 MB)

A follow-up he says he forgot to include in the previous note.

### Translation

> Brother, I couldn't say this in the voice note earlier. In the accounts we
> developed before, there was a place to show a profile photo. But now, in the
> accounts we're creating, there's no place to show a profile photo. Should we add
> a place to upload a profile photo at the initial stage of creating an account?
> This could be either when entering the Gmail address, or after adding the phone
> number. Also, should we create a place to edit the profile photo? When someone
> goes into the profile section there should be an option to edit it.
>
> Without a profile photo it looks a bit messy. For example, if there are only two
> letters or words — like "Wavescape" — it only shows the letters. It looks
> confusing without a profile photo. Can we add a place for a profile photo? Please
> check this and let me know.

### Action items

1. Add **profile-photo upload during account creation** — either at the Gmail step
   or after the phone-number step.
2. Add **profile-photo editing** under Edit Profile.
3. Improve the **no-photo fallback** — bare initials look broken.

### Notes

- "Wavescape" appears to be an example account name. The initials example came
  through garbled in **both** engines, so treat that specific detail as uncertain.

---

## Carry-over from the 9 July batch

Item 9 above — **remove the "Headliner" label** — is the same request he made on
9 July. He is asking a second time, seventeen days later, which suggests it was
never done. Worth checking before replying to him.
