/**
 * JWT verification middleware.
 *
 *   `requireAuth`   — 401 if no/invalid token, otherwise attaches req.user.
 *   `requireRole`   — composes with requireAuth: rejects unless role matches.
 *   `optionalAuth`  — attaches req.user if a valid token is present, never rejects.
 */

const { verify } = require('../lib/jwt');
const { Unauthorized, Forbidden } = require('../lib/errors');
const prisma = require('../prisma');

function extractToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

async function loadUser(token) {
  const payload = verify(token); // throws on bad/expired
  if (!payload?.sub) throw new Unauthorized('Malformed token');
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      city: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
    },
  });
  if (!user) throw new Unauthorized('User no longer exists');
  return user;
}

async function requireAuth(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) throw new Unauthorized('Missing bearer token');
    req.user = await loadUser(token);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(new Unauthorized('Token expired'));
    if (err.name === 'JsonWebTokenError') return next(new Unauthorized('Invalid token'));
    next(err);
  }
}

async function optionalAuth(req, _res, next) {
  try {
    const token = extractToken(req);
    if (token) req.user = await loadUser(token);
    next();
  } catch {
    // Soft auth — never block the request.
    next();
  }
}

function requireRole(...roles) {
  return function (req, _res, next) {
    if (!req.user) return next(new Unauthorized());
    if (!roles.includes(req.user.role)) return next(new Forbidden('Insufficient role'));
    next();
  };
}

module.exports = { requireAuth, optionalAuth, requireRole };
