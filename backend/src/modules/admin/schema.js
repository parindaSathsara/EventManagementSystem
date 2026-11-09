const { z } = require('zod');

const id = z.string().trim().min(1).max(64);
const idParams = z.object({ id });

const ROLES = ['customer', 'artist', 'admin'];
const RANGES = ['today', '7d', '30d', '90d'];
const EVENT_STATUSES = ['draft', 'published', 'live', 'cancelled', 'ended'];

const email = z.string().trim().toLowerCase().email('Enter a valid email').max(191);
const password = z.string().min(8, 'Use at least 8 characters').max(72);
const name = z.string().trim().min(1, 'Name is required').max(80);
const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Enter a valid phone number');
const handle = z
  .string()
  .trim()
  .min(2, 'Handle needs at least 2 characters')
  .max(40)
  .regex(/^[a-zA-Z0-9_.]+$/, 'Handle can only contain letters, numbers, _ and .');

const take = z.coerce.number().int().min(1).max(100).default(25);
const skip = z.coerce.number().int().min(0).default(0);

const overviewQuery = z.object({
  range: z.enum(RANGES).default('7d'),
});

// Same three networks organizers can set in the studio. Empty = removed.
const socialUrl = z.string().trim().max(300).optional().nullable();
const socialsInput = z
  .object({ facebook: socialUrl, instagram: socialUrl, tiktok: socialUrl })
  .partial();

const organizerInput = z.object({
  handle,
  category: z.string().trim().max(40).optional().nullable(),
  bio: z.string().trim().max(2000).optional().nullable(),
  isVerified: z.boolean().optional(),
  isPreferred: z.boolean().optional(),
  socials: socialsInput.optional().nullable(),
});

// Profile photo: an absolute URL from POST /uploads/image; null clears it.
const avatarUrl = z.string().trim().url('Upload a valid image').max(500).optional().nullable();

const listUsersQuery = z.object({
  q: z.string().trim().max(120).optional(),
  role: z.enum(ROLES).optional(),
  status: z.enum(['active', 'disabled']).optional(),
  sort: z.enum(['newest', 'last_login', 'most_logins', 'name']).default('newest'),
  take,
  skip,
});

const createUserBody = z
  .object({
    name,
    email,
    password,
    phone: phone.optional().nullable().or(z.literal('').transform(() => null)),
    avatarUrl,
    role: z.enum(ROLES).default('artist'),
    organizer: organizerInput.optional().nullable(),
  })
  .refine((b) => b.role !== 'artist' || !!b.organizer?.handle, {
    message: 'Organizer accounts need a public handle',
    path: ['organizer', 'handle'],
  });

const updateUserBody = z
  .object({
    name: name.optional(),
    email: email.optional(),
    phone: phone.optional().nullable().or(z.literal('').transform(() => null)),
    avatarUrl,
    role: z.enum(ROLES).optional(),
    disabled: z.boolean().optional(),
    organizer: organizerInput.partial().optional().nullable(),
  })
  .refine((b) => Object.keys(b).length > 0, { message: 'Nothing to update' });

const resetPasswordBody = z.object({ password });

const listEventsQuery = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(EVENT_STATUSES).optional(),
  when: z.enum(['all', 'upcoming', 'past']).default('all'),
  organizerId: id.optional(),
  take,
  skip,
});

const eventStatusBody = z.object({ status: z.enum(EVENT_STATUSES) });

const listOrganizersQuery = z.object({
  q: z.string().trim().max(120).optional(),
  id: id.optional(),
  take: z.coerce.number().int().min(1).max(50).default(20),
});

const ACTIVITY_CATEGORIES = ['auth', 'admin', 'event', 'artist', 'profile', 'follow', 'ticket'];

const listActivityQuery = z.object({
  category: z.enum(ACTIVITY_CATEGORIES).optional(),
  action: z.string().trim().max(64).optional(),
  actorId: id.optional(),
  q: z.string().trim().max(120).optional(),
  range: z.enum([...RANGES, 'all']).default('30d'),
  take: z.coerce.number().int().min(1).max(100).default(40),
  skip,
});

module.exports = {
  idParams,
  overviewQuery,
  listUsersQuery,
  createUserBody,
  updateUserBody,
  resetPasswordBody,
  listEventsQuery,
  eventStatusBody,
  listOrganizersQuery,
  listActivityQuery,
  RANGES,
};
