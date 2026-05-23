const { NotFound } = require('../lib/errors');

module.exports = function notFound(req, _res, next) {
  next(new NotFound(`Route not found: ${req.method} ${req.originalUrl}`));
};
