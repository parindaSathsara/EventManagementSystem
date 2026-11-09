const { z } = require('zod');

const KINDS = ['page', 'event', 'artist', 'app_open'];

const trackBody = z
  .object({
    kind: z.enum(KINDS),
    targetId: z.string().trim().min(1).max(64).optional().nullable(),
    path: z.string().trim().max(255).optional().nullable(),
    // Anonymous per-browser (web) / per-install (app) id.
    visitorId: z.string().trim().min(6).max(80),
    source: z.enum(['web', 'app']),
    referrer: z.string().trim().max(255).optional().nullable(),
  })
  .refine((b) => (b.kind === 'event' || b.kind === 'artist' ? !!b.targetId : true), {
    message: 'targetId is required for event/artist views',
    path: ['targetId'],
  });

module.exports = { trackBody, KINDS };
