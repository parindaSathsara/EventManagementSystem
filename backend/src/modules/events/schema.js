const { z } = require('zod');

const id = z.string().cuid().or(z.string().min(1));

const ticketTypeInput = z.object({
  name: z.string().trim().min(1).max(80),
  // "LKR 4500" / "Free" / "Coming soon" — organizers publish before prices
  // are locked, so an unpriced type is valid.
  priceLabel: z.string().trim().min(1).max(40),
  priceCents: z.number().int().nonnegative().default(0),
  currency: z.string().trim().min(1).max(8).default('LKR'),
  // Quantity is no longer collected on the create form (ticket sales moved to
  // third-party platforms), so capacity defaults high and is display-only.
  total: z.number().int().positive().default(10000),
});

const socialsInput = z
  .object({
    facebook: z.string().trim().max(300).optional().nullable(),
    instagram: z.string().trim().max(300).optional().nullable(),
    tiktok: z.string().trim().max(300).optional().nullable(),
  })
  .partial()
  .optional()
  .nullable();

// Free-form lineup artist entered by the event manager (name + their socials).
const lineupArtistInput = z.object({
  name: z.string().trim().min(1).max(120),
  avatarUrl: z.string().url().optional().nullable(),
  socials: socialsInput,
});

const createEventBody = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional(),
  category: z.string().trim().max(40).default('Concert'),
  coverColor: z.string().trim().max(20).default('#1a0a2e'),
  coverImageUrl: z.string().url().optional().nullable(),
  bannerImageUrl: z.string().url().optional().nullable(),
  flyers: z.array(z.string().url()).max(20).optional().default([]),
  socials: socialsInput,
  // Third-party ticketing platform link — "Buy Now" on the guest side opens
  // this URL directly. One link per event.
  ticketUrl: z.string().trim().url().max(500).optional().nullable(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  // True when only the day is announced — the client sends noon/end-of-day
  // for startsAt/endsAt and the guest UI shows "Time revealed soon".
  startTimeTba: z.boolean().default(false),
  timezone: z.string().trim().max(40).default('Asia/Colombo'),
  // Venue is optional — events are announced before the venue is confirmed
  // (client feedback 2026-08-10). Empty means "revealed soon" on the guest
  // side, so it is stored as an empty string rather than rejected.
  venueName: z.string().trim().max(160).default(''),
  cityName: z.string().trim().min(1).max(80),
  addressLine: z.string().max(240).optional(),
  geoLat: z.number().min(-90).max(90).optional().nullable(),
  geoLng: z.number().min(-180).max(180).optional().nullable(),
  ageRestriction: z.string().max(20).default('All ages'),
  status: z.enum(['draft', 'published', 'live', 'cancelled', 'ended']).default('published'),
  // Refund / cancellation policies were dropped from the product entirely —
  // ticketing (and its policies) live on the third-party platform.
  ticketTypes: z.array(ticketTypeInput).default([]),
  lineupArtistIds: z.array(id).default([]),
  // Free-form lineup (name + their socials), stored as lineupJson.
  lineup: z.array(lineupArtistInput).max(30).optional(),
});

const updateEventBody = createEventBody.partial();

const listEventsQuery = z.object({
  // ?status=upcoming|live|past|all
  status: z.enum(['upcoming', 'live', 'past', 'all', 'draft']).optional().default('all'),
  organizerId: id.optional(),
  cityName: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  // pagination
  take: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});

const idParams = z.object({ id });

module.exports = {
  createEventBody,
  updateEventBody,
  listEventsQuery,
  idParams,
};
