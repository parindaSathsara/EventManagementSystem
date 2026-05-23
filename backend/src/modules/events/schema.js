const { z } = require('zod');

const id = z.string().cuid().or(z.string().min(1));

const ticketTypeInput = z.object({
  name: z.string().trim().min(1).max(80),
  priceLabel: z.string().trim().min(1).max(40),
  priceCents: z.number().int().nonnegative().default(0),
  currency: z.string().trim().min(1).max(8).default('LKR'),
  total: z.number().int().positive(),
});

const createEventBody = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional(),
  category: z.string().trim().max(40).default('Concert'),
  coverColor: z.string().trim().max(20).default('#1a0a2e'),
  coverImageUrl: z.string().url().optional().nullable(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  timezone: z.string().trim().max(40).default('Asia/Colombo'),
  venueName: z.string().trim().min(1).max(160),
  cityName: z.string().trim().min(1).max(80),
  addressLine: z.string().max(240).optional(),
  geoLat: z.number().min(-90).max(90).optional().nullable(),
  geoLng: z.number().min(-180).max(180).optional().nullable(),
  ageRestriction: z.string().max(20).default('All ages'),
  status: z.enum(['draft', 'published', 'live', 'cancelled', 'ended']).default('published'),
  refundPolicy: z.string().max(2000).optional(),
  cancellationPolicy: z.string().max(2000).optional(),
  ticketTypes: z.array(ticketTypeInput).default([]),
  lineupArtistIds: z.array(id).default([]),
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
