const service = require('./service');

async function list(req, res) {
  // optionalAuth: req.user is present only for logged-in managers.
  const result = await service.feed(req.user ? req.user.id : null);
  res.json(result);
}

module.exports = { list };
