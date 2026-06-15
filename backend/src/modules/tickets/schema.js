const { z } = require('zod');

const id = z.string().min(1);

const purchaseBody = z.object({
  eventId: id,
  ticketTypeId: id,
  holderName: z.string().trim().min(1).max(120),
});

// Guest reservation — no account required, but we capture contact details.
const reserveBody = z.object({
  eventId: id,
  ticketTypeId: id,
  holderName: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(4).max(40),
  email: z.string().trim().email().max(160).optional(),
});

const updateStatusBody = z.object({
  status: z.enum(['active', 'used', 'refunded', 'cancelled']),
});

const idParams = z.object({ id });

module.exports = { purchaseBody, reserveBody, updateStatusBody, idParams };
