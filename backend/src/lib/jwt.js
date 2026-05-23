const jwt = require('jsonwebtoken');
const config = require('../config');

function sign(payload, opts = {}) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: opts.expiresIn || config.jwt.expiresIn,
  });
}

function verify(token) {
  return jwt.verify(token, config.jwt.secret);
}

module.exports = { sign, verify };
