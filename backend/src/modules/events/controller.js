const service = require('./service');
const prisma = require('../../prisma');
const { BadRequest, Forbidden } = require('../../lib/errors');
const activity = require('../../lib/activity');

async function resolveArtistId(userId) {
  const artist = await prisma.artist.findUnique({ where: { userId }, select: { id: true } });
  return artist?.id || null;
}

/**
 * `organizerArtistId` in the body lets a super admin publish for any
 * organizer. Returns the organizer to act as (or null to keep the default),
 * and strips the field so services only ever see a vetted value.
 */
async function adminOrganizerOverride(req) {
  const { organizerArtistId, ...body } = req.body;
  req.body = body;
  if (!organizerArtistId) return null;
  if (req.user.role !== 'admin') throw new Forbidden('Only super admins can publish for another organizer.');
  const organizer = await prisma.artist.findUnique({
    where: { id: organizerArtistId },
    select: { id: true, handle: true },
  });
  if (!organizer) throw new BadRequest('That organizer no longer exists.');
  return organizer;
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
  const onBehalf = await adminOrganizerOverride(req);
  const artistId = onBehalf ? onBehalf.id : await resolveArtistId(req.user.id);
  if (!artistId) throw new Forbidden('You need an artist profile to create events.');
  const created = await service.create(req.body, artistId);
  activity.record(req, {
    action: 'event.create',
    targetType: 'event',
    targetId: created.id,
    summary: onBehalf
      ? `Created event “${created.title}” for @${onBehalf.handle}`
      : `Created event “${created.title}”`,
    meta: { status: created.status, startsAt: created.startsAt, organizerArtistId: artistId },
  });
  res.status(201).json(created);
}

async function update(req, res) {
  const moveTo = await adminOrganizerOverride(req);
  const artistId = await resolveArtistId(req.user.id);
  const input = moveTo ? { ...req.body, organizerArtistId: moveTo.id } : req.body;
  const updated = await service.update(req.params.id, input, artistId, req.user.role);
  activity.record(req, {
    action: 'event.update',
    targetType: 'event',
    targetId: updated.id,
    summary: moveTo ? `Updated event “${updated.title}” (now under @${moveTo.handle})` : `Updated event “${updated.title}”`,
    meta: { fields: Object.keys(input || {}) },
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
