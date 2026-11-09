const service = require('./service');
const prisma = require('../../prisma');
const { Forbidden } = require('../../lib/errors');
const activity = require('../../lib/activity');

async function resolveArtistId(userId) {
  const artist = await prisma.artist.findUnique({ where: { userId }, select: { id: true } });
  return artist?.id || null;
}

async function list(req, res) {
  const result = await service.list(req.query, req.user?.id);
  res.json(result);
}

async function getOne(req, res) {
  const event = await service.getById(req.params.id, req.user?.id);
  res.json(event);
}

async function create(req, res) {
  const artistId = await resolveArtistId(req.user.id);
  if (!artistId) throw new Forbidden('You need an artist profile to create events.');
  const created = await service.create(req.body, artistId);
  activity.record(req, {
    action: 'event.create',
    targetType: 'event',
    targetId: created.id,
    summary: `Created event “${created.title}”`,
    meta: { status: created.status, startsAt: created.startsAt },
  });
  res.status(201).json(created);
}

async function update(req, res) {
  const artistId = await resolveArtistId(req.user.id);
  const updated = await service.update(req.params.id, req.body, artistId, req.user.role);
  activity.record(req, {
    action: 'event.update',
    targetType: 'event',
    targetId: updated.id,
    summary: `Updated event “${updated.title}”`,
    meta: { fields: Object.keys(req.body || {}) },
  });
  res.json(updated);
}

async function remove(req, res) {
  const artistId = await resolveArtistId(req.user.id);
  const before = await prisma.event.findUnique({ where: { id: req.params.id }, select: { title: true } });
  await service.remove(req.params.id, artistId, req.user.role);
  activity.record(req, {
    action: 'event.delete',
    targetType: 'event',
    targetId: req.params.id,
    summary: `Deleted event “${before?.title || req.params.id}”`,
  });
  res.status(204).end();
}

async function save(req, res) {
  const result = await service.toggleSave(req.params.id, req.user.id);
  res.json(result);
}

module.exports = { list, getOne, create, update, remove, save };
