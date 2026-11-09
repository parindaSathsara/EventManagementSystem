const prisma = require('../../prisma');
const { hash, compare } = require('../../lib/password');
const { sign } = require('../../lib/jwt');
const { Unauthorized, Conflict, Forbidden } = require('../../lib/errors');

const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  phone: true,
  city: true,
  avatarUrl: true,
  role: true,
  createdAt: true,
};

function tokenFor(user) {
  return sign({ sub: user.id, role: user.role });
}

async function signup({ email, password, name, phone }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Conflict('That email is already registered.');

  const passwordHash = await hash(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      phone: phone || null,
    },
    select: PUBLIC_USER_SELECT,
  });
  return { user, token: tokenFor(user) };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Unauthorized('Invalid email or password.');

  const ok = await compare(password, user.passwordHash);
  if (!ok) throw new Unauthorized('Invalid email or password.');
  // Checked only after the password, so probing emails can't reveal which
  // accounts are suspended.
  if (user.disabledAt) {
    throw new Forbidden('This account has been disabled. Contact the Stage team.', {
      code: 'ACCOUNT_DISABLED',
    });
  }

  const publicUser = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), loginCount: { increment: 1 } },
    select: PUBLIC_USER_SELECT,
  });
  return { user: publicUser, token: tokenFor(publicUser) };
}

async function updateProfile(userId, { phone, city, name, avatarUrl }) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(phone !== undefined ? { phone } : {}),
      ...(city !== undefined ? { city } : {}),
      ...(name !== undefined ? { name } : {}),
      // `null` clears the photo; `undefined` leaves it untouched.
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    },
    select: PUBLIC_USER_SELECT,
  });
}

module.exports = { signup, login, updateProfile, PUBLIC_USER_SELECT };
