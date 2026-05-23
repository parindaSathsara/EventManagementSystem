/**
 * Typed error classes. Each carries an HTTP status code so the error
 * middleware can render them consistently without giant if/else chains.
 */

class HttpError extends Error {
  constructor(status, message, { code, details } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

class BadRequest extends HttpError {
  constructor(message = 'Bad request', opts) {
    super(400, message, opts);
  }
}
class Unauthorized extends HttpError {
  constructor(message = 'Unauthorized', opts) {
    super(401, message, opts);
  }
}
class Forbidden extends HttpError {
  constructor(message = 'Forbidden', opts) {
    super(403, message, opts);
  }
}
class NotFound extends HttpError {
  constructor(message = 'Not found', opts) {
    super(404, message, opts);
  }
}
class Conflict extends HttpError {
  constructor(message = 'Conflict', opts) {
    super(409, message, opts);
  }
}

module.exports = { HttpError, BadRequest, Unauthorized, Forbidden, NotFound, Conflict };
