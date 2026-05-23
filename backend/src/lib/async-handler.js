/**
 * Wraps an async route handler so thrown errors flow into Express'
 * error middleware instead of crashing the process.
 *
 *   router.get('/foo', asyncHandler(async (req, res) => { ... }));
 */

module.exports = function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
