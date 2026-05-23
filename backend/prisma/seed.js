/**
 * Seed: idempotent. Creates a default admin user, one demo artist, a couple
 * of upcoming events with ticket types, and a few reels so the mobile app
 * has something to render on first connect.
 *
 *   node prisma/seed.js
 */

/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@eventsocial.local';
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe!2026';

async function upsertUser({ email, password, name, role, phone, city, avatarUrl }) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: { name, role, phone, city, avatarUrl },
    create: { email, passwordHash, name, role, phone, city, avatarUrl },
  });
}

async function main() {
  console.log('[seed] starting');

  // 1) Admin
  const admin = await upsertUser({
    email: SEED_ADMIN_EMAIL,
    password: SEED_ADMIN_PASSWORD,
    name: 'Platform Admin',
    role: 'admin',
    phone: '+94770000000',
    city: 'Colombo',
  });
  console.log('[seed] admin:', admin.email);

  // 2) Artist user + artist profile
  const artistUser = await upsertUser({
    email: 'mihiran@eventsocial.local',
    password: 'demo1234',
    name: 'Mihiran',
    role: 'artist',
    phone: '+94771112222',
    city: 'Colombo',
    avatarUrl: null,
  });
  const artist = await prisma.artist.upsert({
    where: { userId: artistUser.id },
    update: {
      handle: 'mihiran',
      isVerified: true,
      // Preferred → reels and events auto-publish (skip the approval queue),
      // which is what the demo flow expects.
      isPreferred: true,
      category: 'DJ',
      bio: 'Producer, DJ, live electronics. Headlining Stardust Arena this season.',
    },
    create: {
      userId: artistUser.id,
      handle: 'mihiran',
      isVerified: true,
      isPreferred: true,
      category: 'DJ',
      bio: 'Producer, DJ, live electronics. Headlining Stardust Arena this season.',
    },
  });
  console.log('[seed] artist:', artist.handle);

  // 3) Customer
  const customer = await upsertUser({
    email: 'parinda@eventsocial.local',
    password: 'demo1234',
    name: 'Parinda Sathsader',
    role: 'customer',
    phone: null, // intentionally null so the Complete Profile screen fires
    city: 'Colombo',
  });
  console.log('[seed] customer:', customer.email);

  // 4) One demo event with ticket types
  const startsAt = new Date(Date.now() + 14 * 24 * 3600 * 1000);
  const endsAt = new Date(startsAt.getTime() + 4 * 3600 * 1000);

  const existingEvent = await prisma.event.findFirst({
    where: { title: 'Stardust Arena · Closing Night', organizerArtistId: artist.id },
  });

  const event =
    existingEvent ||
    (await prisma.event.create({
      data: {
        organizerArtistId: artist.id,
        title: 'Stardust Arena · Closing Night',
        description: 'Closing night with surprise guests, full lineup TBA.',
        category: 'Concert',
        coverColor: '#260b3d',
        startsAt,
        endsAt,
        venueName: 'Stardust Arena',
        cityName: 'Colombo',
        addressLine: '12 Marine Drive, Colombo 03',
        geoLat: 6.9271,
        geoLng: 79.8612,
        ageRestriction: '18+',
        status: 'published',
        refundPolicy: 'Full refund up to 48 hours before showtime.',
        ticketTypes: {
          create: [
            { name: 'General Admission', priceLabel: 'LKR 4,500', priceCents: 450000, total: 500, remaining: 500 },
            { name: 'VIP', priceLabel: 'LKR 12,000', priceCents: 1200000, total: 80, remaining: 80 },
          ],
        },
      },
    }));
  console.log('[seed] event:', event.title);

  // 5) One demo reel
  const existingReel = await prisma.reel.findFirst({
    where: { artistId: artist.id, caption: { contains: 'soundcheck' } },
  });
  const reel =
    existingReel ||
    (await prisma.reel.create({
      data: {
        artistId: artist.id,
        caption: 'Stardust soundcheck — get ready for closing night 🔥',
        musicTrackTitle: 'Closing Night (intro)',
        musicTrackArtistName: 'Mihiran',
        linkedEventId: event.id,
        coverColor: '#260b3d',
        visibility: 'public',
        tags: { create: [{ tag: 'stardust' }, { tag: 'liveset' }] },
      },
    }));
  console.log('[seed] reel:', reel.id);

  console.log('[seed] done.');
}

main()
  .catch((e) => {
    console.error('[seed] failed', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
