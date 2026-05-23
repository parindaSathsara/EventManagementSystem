const { z } = require('zod');

const id = z.string().min(1);

const listArtistsQuery = z.object({
  search: z.string().optional(),
  verifiedOnly: z.coerce.boolean().optional(),
  take: z.coerce.number().int().min(1).max(100).default(50),
  skip: z.coerce.number().int().min(0).default(0),
});

// When a user upgrades from customer → artist they pick handle/bio/category.
const becomeArtistBody = z.object({
  handle: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-zA-Z0-9_.]+$/, 'Handle can only contain letters, numbers, _ and .'),
  bio: z.string().max(2000).optional(),
  category: z.string().trim().max(40).optional(),
});

const updateArtistBody = z.object({
  handle: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-zA-Z0-9_.]+$/)
    .optional(),
  bio: z.string().max(2000).optional(),
  category: z.string().trim().max(40).optional(),
  socialsJson: z.string().max(4000).optional(),
});

const idParams = z.object({ id });

module.exports = { listArtistsQuery, becomeArtistBody, updateArtistBody, idParams };
