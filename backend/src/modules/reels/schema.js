const { z } = require('zod');

const id = z.string().min(1);

const REACTION_CODES = ['fire', 'love', 'handsUp', 'wow', 'party'];

const createReelBody = z.object({
  caption: z.string().trim().min(1).max(500),
  musicTrackTitle: z.string().max(160).optional().nullable(),
  musicTrackArtistName: z.string().max(160).optional().nullable(),
  linkedEventId: id.optional().nullable(),
  coverColor: z.string().max(20).default('#1a0a2e'),
  coverImageUrl: z.string().url().optional().nullable(),
  videoUrl: z.string().url().optional().nullable(),
  visibility: z.enum(['public', 'followers', 'private']).default('public'),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});

const listReelsQuery = z.object({
  artistId: id.optional(),
  tag: z.string().optional(),
  eventId: id.optional(),
  feed: z.enum(['forYou', 'following']).optional(),
  take: z.coerce.number().int().min(1).max(50).default(20),
  skip: z.coerce.number().int().min(0).default(0),
});

const reactBody = z.object({
  // Pass null/omit to clear an existing reaction.
  code: z.enum(REACTION_CODES).nullable().optional(),
});

const idParams = z.object({ id });

module.exports = { createReelBody, listReelsQuery, reactBody, idParams, REACTION_CODES };
