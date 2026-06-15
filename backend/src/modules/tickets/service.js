const prisma = require('../../prisma');
const { NotFound, BadRequest, Forbidden } = require('../../lib/errors');

const TICKET_INCLUDE = {
  event: {
    select: {
      id: true,
      title: true,
      startsAt: true,
      endsAt: true,
      venueName: true,
      cityName: true,
      coverColor: true,
      status: true,
    },
  },
  ticketType: { select: { id: true, name: true, priceLabel: true } },
};

/**
 * Hoist `ticketType.name` to a flat `typeName` and drop the nested object —
 * the mobile app reads `ticket.typeName` directly.
 */
function shape(t) {
  if (!t) return t;
  return {
    ...t,
    typeName: t.ticketType?.name || null,
  };
}

function generateQrPayload(eventId) {
  // Predictable-but-unique payload. Adequate as a stable id for the in-app
  // QR placeholder; for production we'd HMAC-sign this.
  return `ES-${Date.now().toString(36).toUpperCase()}-${eventId.slice(0, 8).toUpperCase()}`;
}

async function listMine(userId) {
  const items = await prisma.ticket.findMany({
    where: { userId },
    include: TICKET_INCLUDE,
    orderBy: { issuedAt: 'desc' },
  });
  return { items: items.map(shape), total: items.length };
}

async function getMine(userId, ticketId) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: TICKET_INCLUDE,
  });
  if (!ticket) throw new NotFound('Ticket not found');
  if (ticket.userId !== userId) throw new Forbidden('Not your ticket.');
  return shape(ticket);
}

/**
 * Atomic booking — decrements the ticket type remaining count and creates
 * the ticket in a single transaction. Rolls back on stock exhaustion.
 */
/**
 * Book a ticket. Works for both account holders (`userId` set) and guests
 * (`userId` null + `guest` contact). Atomic stock decrement either way.
 */
async function purchase({ eventId, ticketTypeId, holderName, guest = null }, userId = null) {
  return prisma.$transaction(async (tx) => {
    const ticketType = await tx.ticketType.findUnique({ where: { id: ticketTypeId } });
    if (!ticketType || ticketType.eventId !== eventId) {
      throw new NotFound('Ticket type not found for this event.');
    }
    if (ticketType.remaining <= 0) {
      throw new BadRequest('Sold out — no remaining tickets for this tier.');
    }

    await tx.ticketType.update({
      where: { id: ticketTypeId },
      data: { remaining: { decrement: 1 } },
    });

    const created = await tx.ticket.create({
      data: {
        eventId,
        ticketTypeId,
        userId: userId || null,
        holderName: holderName || guest?.name || 'Guest',
        guestName: guest?.name || null,
        guestPhone: guest?.phone || null,
        guestEmail: guest?.email || null,
        qrPayload: generateQrPayload(eventId),
      },
      include: TICKET_INCLUDE,
    });
    return shape(created);
  });
}

async function updateStatus(ticketId, status, userId, role) {
  const existing = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!existing) throw new NotFound('Ticket not found');
  // Owner can mark used/cancelled; admin can do anything.
  if (role !== 'admin' && existing.userId !== userId) {
    throw new Forbidden('Not your ticket.');
  }
  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status,
      ...(status === 'used' ? { usedAt: new Date() } : {}),
    },
    include: TICKET_INCLUDE,
  });
  return shape(updated);
}

module.exports = { listMine, getMine, purchase, updateStatus };
