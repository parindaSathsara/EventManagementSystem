const service = require('./service');
const { isBot } = require('../../lib/request-meta');

async function track(req, res) {
  // Crawlers and link-preview bots would otherwise dominate the view counts.
  if (isBot(req)) return res.status(202).json({ counted: false });
  const result = await service.track(req.body, req.user?.id);
  res.status(202).json(result);
}

module.exports = { track };
