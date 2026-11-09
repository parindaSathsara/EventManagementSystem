const service = require('./service');
const activity = require('../../lib/activity');

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
  activity.record(req, {
    action: 'artist.become',
    targetType: 'artist',
    targetId: artist.id,
    summary: `${req.user.name} became an organizer (@${artist.handle})`,
  });
  res.status(201).json(artist);
}
async function updateMine(req, res) {
  const updated = await service.updateArtist(req.user.id, req.body);
  activity.record(req, {
    action: 'artist.update',
    targetType: 'artist',
    targetId: updated.id,
    summary: `@${updated.handle} updated their organizer profile`,
    meta: { fields: Object.keys(req.body || {}) },
  });
  res.json(updated);
}
async function follow(req, res) {
  const result = await service.toggleFollow(req.params.id, req.user.id);
  activity.record(req, {
    action: result?.following === false ? 'follow.remove' : 'follow.add',
    targetType: 'artist',
    targetId: req.params.id,
    summary: result?.following === false ? `${req.user.name} unfollowed an organizer` : `${req.user.name} followed an organizer`,
  });
  res.json(result);
}
async function guestFollow(req, res) {
  const { deviceId, follow: wantFollow } = req.body;
  const result = await service.setGuestFollow(req.params.id, deviceId, wantFollow);
  if (result?.changed !== false) {
    activity.record(req, {
      action: wantFollow ? 'follow.add' : 'follow.remove',
      actor: null,
      targetType: 'artist',
      targetId: req.params.id,
      summary: wantFollow ? 'A guest followed an organizer' : 'A guest unfollowed an organizer',
      meta: { deviceId },
    });
  }
  res.json(result);
}

module.exports = { list, getOne, getMine, become, updateMine, follow, guestFollow };
