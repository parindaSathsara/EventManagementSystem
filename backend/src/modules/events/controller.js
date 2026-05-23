const service = require('./service');
const prisma = require('../../prisma');
const { Forbidden } = require('../../lib/errors');

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
  res.status(201).json(created);
}

async function update(req, res) {
  const artistId = await resolveArtistId(req.user.id);
  const updated = await service.update(req.params.id, req.body, artistId, req.user.role);
  res.json(updated);
}

async function remove(req, res) {
  const artistId = await resolveArtistId(req.user.id);
  await service.remove(req.params.id, artistId, req.user.role);
  res.status(204).end();
}

async function save(req, res) {
  const result = await service.toggleSave(req.params.id, req.user.id);
  res.json(result);
}

module.exports = { list, getOne, create, update, remove, save };
