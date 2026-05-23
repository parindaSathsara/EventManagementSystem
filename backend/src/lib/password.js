const bcrypt = require('bcryptjs');

// 10 rounds is the right default trade-off: ~80ms/op on commodity hardware,
// enough cost to slow credential stuffing without blocking the event loop
// on every login.
const ROUNDS = 10;

async function hash(plain) {
  return bcrypt.hash(plain, ROUNDS);
}

function compare(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

module.exports = { hash, compare };
