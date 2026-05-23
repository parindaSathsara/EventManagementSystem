/**
 * Server entry. Boots the Express app and wires graceful shutdown so we
 * don't leak Prisma connections on SIGTERM (Docker / systemd / pm2).
 */

const { build } = require('./app');
const config = require('./config');
const prisma = require('./prisma');

const app = build();

const server = app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(
    `[eventsocial] listening on :${config.port} (${config.env})`,
  );
});

async function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`[eventsocial] ${signal} received — shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  // Hard-exit after 10s if connections won't drain.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
