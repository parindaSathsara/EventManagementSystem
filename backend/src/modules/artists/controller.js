const service = require('./service');

async function list(req, res) {
  const result = await service.list(req.query, req.user?.id);
  res.json(result);
}
async function getOne(req, res) {
  const artist = await service.getById(req.params.id, req.user?.id);
  res.json(artist);
}
async function getMine(req, res) {
  const artist = await service.getMine(req.user.id);
  res.json(artist); // null when the caller hasn't become an artist yet
}
async function become(req, res) {
  const artist = await service.becomeArtist(req.user.id, req.body);
  res.status(201).json(artist);
}
async function updateMine(req, res) {
  const updated = await service.updateArtist(req.user.id, req.body);
  res.json(updated);
}
async function follow(req, res) {
  const result = await service.toggleFollow(req.params.id, req.user.id);
  res.json(result);
}

module.exports = { list, getOne, getMine, become, updateMine, follow };
