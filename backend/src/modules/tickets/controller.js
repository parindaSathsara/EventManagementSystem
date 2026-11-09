const service = require('./service');
const activity = require('../../lib/activity');

async function list(req, res) {
  const result = await service.listMine(req.user.id);
  res.json(result);
}
async function getOne(req, res) {
  const ticket = await service.getMine(req.user.id, req.params.id);
  res.json(ticket);
}
async function purchase(req, res) {
  const ticket = await service.purchase(req.body, req.user.id);
  res.status(201).json(ticket);
}
async function reserve(req, res) {
  const { eventId, ticketTypeId, holderName, phone, email } = req.body;
  // optionalAuth: a logged-in user reserving uses their account; a guest
  // (no req.user) stores contact details on the ticket instead.
  const ticket = await service.purchase(
    {
      eventId,
      ticketTypeId,
      holderName,
      guest: req.user ? null : { name: holderName, phone, email },
    },
    req.user ? req.user.id : null,
  );
  activity.record(req, {
    action: 'ticket.reserve',
    actor: req.user || null,
    targetType: 'event',
    targetId: eventId,
    summary: `${holderName} reserved a ticket`,
    meta: { ticketId: ticket?.id, ticketTypeId },
  });
  res.status(201).json(ticket);
}
async function updateStatus(req, res) {
  const updated = await service.updateStatus(
    req.params.id,
    req.body.status,
    req.user.id,
    req.user.role,
  );
  res.json(updated);
}

module.exports = { list, getOne, purchase, reserve, updateStatus };
