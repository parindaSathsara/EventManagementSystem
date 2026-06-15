# Rework 2026-06 · Schema & API changes

**Date:** 2026-06-14
**Migration name:** `guest_mode_banners_social`

## Prisma model changes (`backend/prisma/schema.prisma`)

### Event — new fields
| Field | Type | Purpose |
| --- | --- | --- |
| `bannerImageUrl` | `String?` | Flyer/banner used as the booking CTA |
| `flyersJson` | `String? @db.Text` | JSON array of extra flyer image URLs (slider) |
| `socialsJson` | `String? @db.Text` | JSON `{ facebook, instagram, tiktok }` |

### Ticket — guest reservations
| Field | Change |
| --- | --- |
| `userId` | now **nullable** (`String?`); relation `onDelete: SetNull` |
| `guestName` | new `String?` |
| `guestPhone` | new `String?` |
| `guestEmail` | new `String?` |

`Artist.bio` (company info) and `Artist.socialsJson` (company socials) were
reused as-is — no change.

## API changes

- **`GET /events`, `GET /events/:id`** — responses now include `flyers[]`,
  `socials{}`, and an enriched `organizer{ bio, category, socials }`. Reshaping
  lives in `events/service.js → shape()` (mirrors the existing `geo` reshape).
- **`POST /events` / `PATCH /events/:id`** accept `bannerImageUrl`, `flyers[]`,
  and `socials{}` (validated in `events/schema.js`; serialized to the `*Json`
  columns in `events/service.js`).
- **`POST /tickets/reserve`** (new, `optionalAuth`) — guest-capable booking.
  Body: `{ eventId, ticketTypeId, holderName, phone, email? }`. A logged-in
  user reserving uses their account; a guest's contact is stored on the ticket.
  The existing `POST /tickets` (auth-only) is unchanged.
- **`GET /notifications`** (new module, `optionalAuth`) — computed reminder feed
  for events 1–2 days out (`kind: 'T-1' | 'T-2'`). No new table; computed from
  `Event` on the fly. Mounted in `src/routes.js`.

## Apply / rollback

```bash
cd backend
# DEV (against a dev database):
npx prisma migrate dev --name guest_mode_banners_social
node prisma/seed.js
# PROD:
npx prisma migrate deploy
```

> ⚠️ The configured `DATABASE_URL` points at the live `events` database. Run the
> migration against a dev/staging DB first. All new columns are nullable and the
> `Ticket.userId` change is widening (NOT NULL → NULL), so the migration is
> backward-compatible and non-destructive.

**Rollback:** drop the added columns and re-tighten `Ticket.userId` to `NOT
NULL` (only safe if no guest tickets exist), then remove the
`/tickets/reserve` and `/notifications` routes.
