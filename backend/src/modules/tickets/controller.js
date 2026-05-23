const service = require('./service');

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
async function updateStatus(req, res) {
  const updated = await service.updateStatus(
    req.params.id,
    req.body.status,
    req.user.id,
    req.user.role,
  );
  res.json(updated);
}

module.exports = { list, getOne, purchase, updateStatus };
