const prisma = require('../../prisma');
const { hash, compare } = require('../../lib/password');
const { sign } = require('../../lib/jwt');
const { Unauthorized, Conflict } = require('../../lib/errors');

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

  const publicUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: PUBLIC_USER_SELECT,
  });
  return { user: publicUser, token: tokenFor(publicUser) };
}

async function updateProfile(userId, { phone, city, name }) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(phone !== undefined ? { phone } : {}),
      ...(city !== undefined ? { city } : {}),
      ...(name !== undefined ? { name } : {}),
    },
    select: PUBLIC_USER_SELECT,
  });
}

module.exports = { signup, login, updateProfile, PUBLIC_USER_SELECT };
