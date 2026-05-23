/**
 * Single PrismaClient instance.
 *
 * In dev (with nodemon) we attach to globalThis so hot reloads don't open a
 * new pool every save — a classic Node + Prisma footgun that exhausts MySQL
 * connections in minutes.
 */

const { PrismaClient } = require('@prisma/client');
const config = require('./config');

const prisma =
  globalThis.__eventsocialPrisma__ ||
  new PrismaClient({
    log: config.isProd ? ['error'] : ['query', 'warn', 'error'],
  });

if (!config.isProd) {
  globalThis.__eventsocialPrisma__ = prisma;
}

module.exports = prisma;
