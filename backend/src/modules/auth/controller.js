const service = require('./service');

async function signup(req, res) {
  const result = await service.signup(req.body);
  res.status(201).json(result);
}

async function login(req, res) {
  const result = await service.login(req.body);
  res.json(result);
}

async function me(req, res) {
  res.json(req.user);
}

async function completeProfile(req, res) {
  const updated = await service.updateProfile(req.user.id, req.body);
  res.json(updated);
}

module.exports = { signup, login, me, completeProfile };
