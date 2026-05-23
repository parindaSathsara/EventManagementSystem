const { z } = require('zod');

const id = z.string().min(1);

const purchaseBody = z.object({
  eventId: id,
  ticketTypeId: id,
  holderName: z.string().trim().min(1).max(120),
});

const updateStatusBody = z.object({
  status: z.enum(['active', 'used', 'refunded', 'cancelled']),
});

const idParams = z.object({ id });

module.exports = { purchaseBody, updateStatusBody, idParams };
