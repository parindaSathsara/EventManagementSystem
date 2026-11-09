#!/usr/bin/env node
/**
 * Create (or promote) a super-admin account for the web console at /admin.
 *
 *   node scripts/create-super-admin.js <email> <password> "<Full name>"
 *
 * - New email     → creates the account with role `admin`.
 * - Existing user → promotes it to `admin`, re-activates it, and sets the
 *                   given password (so a forgotten admin password is
 *                   recoverable from the server).
 *
 * Run it on the server from backend/ so it picks up the production .env.
 * After that, more admins/organizers are created from the console itself.
 */

const prisma = require('../src/prisma');
const { hash } = require('../src/lib/password');

async function main() {
  const [emailArg, password, ...nameParts] = process.argv.slice(2);
  const email = String(emailArg || '').trim().toLowerCase();
  const name = nameParts.join(' ').trim() || 'Stage Admin';

  if (!/^\S+@\S+\.\S+$/.test(email) || !password) {
    console.error('Usage: node scripts/create-super-admin.js <email> <password> "<Full name>"');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Use a password of at least 8 characters.');
    process.exit(1);
  }

  const passwordHash = await hash(password);
  const existing = await prisma.user.findUnique({ where: { email } });
  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { role: 'admin', disabledAt: null, passwordHash },
      })
    : await prisma.user.create({ data: { email, name, passwordHash, role: 'admin' } });

  await prisma.activityLog.create({
    data: {
      action: existing ? 'admin.user_role' : 'admin.user_create',
      actorEmail: 'server-cli',
      targetType: 'user',
      targetId: user.id,
      summary: existing
        ? `Promoted ${user.name} to super admin from the server`
        : `Created super admin ${user.name} (${user.email}) from the server`,
      source: 'api',
    },
  });

  console.log(`${existing ? 'Promoted' : 'Created'} super admin: ${user.email}`);
  console.log('Sign in at https://<website>/admin/login');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
