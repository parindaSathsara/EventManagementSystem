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
  const reel = await service.getById(req.params.id, req.user?.id);
  res.json(reel);
}
async function create(req, res) {
  const artistId = await resolveArtistId(req.user.id);
  if (!artistId) throw new Forbidden('Create an artist profile to publish reels.');
  const created = await service.create(req.body, artistId);
  res.status(201).json(created);
}
async function react(req, res) {
  const result = await service.react(req.params.id, req.user.id, req.body.code ?? null);
  res.json(result);
}
async function save(req, res) {
  const result = await service.toggleSave(req.params.id, req.user.id);
  res.json(result);
}
async function repost(req, res) {
  const result = await service.toggleRepost(req.params.id, req.user.id);
  res.json(result);
}

module.exports = { list, getOne, create, react, save, repost };
