/**
 * Seed: idempotent. Creates a default admin, a customer, and several EDM
 * "event companies" (artists that double as organizers) each with upcoming
 * events — banners, flyers, socials, lineups, and ticket types.
 *
 * The events are plausible stand-ins inspired by https://edmcalendar.lk
 * (e.g. La Foresta · The Sound Garden, Spotseeker · The Key to Happiness).
 * The live site loads its listings via JavaScript and can't be scraped, so
 * these are hand-authored. Dates are computed relative to "now" so the
 * calendar's Year / Month / Day views always have something to show.
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

const DAY = 24 * 3600 * 1000;
const HOUR = 3600 * 1000;

/** A date N days from now at 21:00 UTC (typical show start). */
function inDays(n, hourUtc = 16) {
  const base = new Date(Date.now() + n * DAY);
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), hourUtc, 0, 0));
}

// Real EDM flyer posters + DJ photos served by the backend from uploads/seed/
// (copied from the edmcalendar.lk reference). Reference via the public base URL.
const ASSET_BASE = (process.env.PUBLIC_BASE_URL || 'https://events-api.aahaas.com').replace(/\/+$/, '');
function asset(file) {
  return `${ASSET_BASE}/uploads/seed/${file}`;
}

// Company/organizer avatars (pravatar — reliable, real faces).
function avatar(n) {
  return `https://i.pravatar.cc/300?img=${n}`;
}

// Lineup DJs reused across events: real names, photos, and socials.
const DJ = {
  manik: { name: 'DJ Manik', avatarUrl: asset('dj-manik.jpg'), socials: { instagram: 'https://instagram.com/djmanik', facebook: 'https://facebook.com/djmanik' } },
  zaeem: { name: 'Zaeem', avatarUrl: asset('dj-zaeem.jpg'), socials: { instagram: 'https://instagram.com/zaeem', tiktok: 'https://tiktok.com/@zaeem' } },
  roshan: { name: 'Roshan', avatarUrl: asset('dj-roshan.jpg'), socials: { instagram: 'https://instagram.com/roshan' } },
  gayan: { name: 'Gayan', avatarUrl: asset('dj-gayan.jpg'), socials: { facebook: 'https://facebook.com/gayan.music' } },
  bmpi: { name: 'BMPI', avatarUrl: asset('dj-bmpi.jpg'), socials: { instagram: 'https://instagram.com/bmpi' } },
};

async function upsertUser({ email, password, name, role, phone, city, avatarUrl }) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: { name, role, phone, city, avatarUrl },
    create: { email, passwordHash, name, role, phone, city, avatarUrl },
  });
}

async function upsertCompany({ email, name, handle, category, bio, socials, avatarUrl, isPreferred = true }) {
  const user = await upsertUser({
    email,
    password: 'demo1234',
    name,
    role: 'artist',
    phone: '+94770000000',
    city: 'Colombo',
    avatarUrl,
  });
  const data = {
    handle,
    category,
    bio,
    isVerified: true,
    isPreferred,
    socialsJson: socials ? JSON.stringify(socials) : null,
  };
  return prisma.artist.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });
}

/** Create an event if one with the same title+organizer doesn't exist yet. */
async function ensureEvent(organizer, ev, lineupArtistIds = []) {
  const existing = await prisma.event.findFirst({
    where: { title: ev.title, organizerArtistId: organizer.id },
  });
  if (existing) return existing;

  return prisma.event.create({
    data: {
      organizerArtistId: organizer.id,
      title: ev.title,
      description: ev.description,
      category: ev.category || 'Festival',
      coverColor: ev.coverColor || '#1a0a2e',
      bannerImageUrl: ev.banner,
      flyersJson: JSON.stringify(ev.flyers || [ev.banner]),
      socialsJson: ev.socials ? JSON.stringify(ev.socials) : null,
      lineupJson: ev.lineup ? JSON.stringify(ev.lineup) : null,
      startsAt: ev.startsAt,
      endsAt: ev.endsAt || new Date(ev.startsAt.getTime() + 5 * HOUR),
      venueName: ev.venueName,
      cityName: ev.cityName || 'Colombo',
      addressLine: ev.addressLine,
      geoLat: ev.geoLat ?? 6.9271,
      geoLng: ev.geoLng ?? 79.8612,
      ageRestriction: ev.ageRestriction || '18+',
      status: 'published',
      refundPolicy: 'Full refund up to 48 hours before showtime.',
      ticketTypes: { create: ev.ticketTypes },
      lineup: {
        create: lineupArtistIds.map((aid, i) => ({ artistId: aid, order: i })),
      },
    },
  });
}

async function main() {
  console.log('[seed] starting');

  // 1) Admin + customer ------------------------------------------------------
  const admin = await upsertUser({
    email: SEED_ADMIN_EMAIL,
    password: SEED_ADMIN_PASSWORD,
    name: 'Platform Admin',
    role: 'admin',
    phone: '+94770000000',
    city: 'Colombo',
  });
  console.log('[seed] admin:', admin.email);

  await upsertUser({
    email: 'parinda@eventsocial.local',
    password: 'demo1234',
    name: 'Parinda Sathsader',
    role: 'customer',
    phone: null,
    city: 'Colombo',
  });

  // 2) Lineup DJs (artists used only inside lineups) -------------------------
  const djMihiran = await upsertCompany({
    email: 'mihiran@eventsocial.local',
    name: 'Mihiran',
    handle: 'mihiran',
    category: 'DJ',
    bio: 'Producer, DJ, live electronics. Headlining Stardust Arena this season.',
    avatarUrl: avatar(12),
    socials: { instagram: 'https://instagram.com/mihiran', tiktok: 'https://tiktok.com/@mihiran' },
  });

  // 3) Event companies (organizers) -----------------------------------------
  const laForesta = await upsertCompany({
    email: 'laforesta@eventsocial.local',
    name: 'La Foresta',
    handle: 'laforesta',
    category: 'Event Company',
    bio: 'Open-air label showcases blending progressive house and underground sounds. We build immersive forest stages across the island, bringing world-class production to intimate crowds. Follow for lineup drops and early-bird releases.',
    avatarUrl: avatar(15),
    socials: {
      facebook: 'https://facebook.com/laforesta.lk',
      instagram: 'https://instagram.com/laforesta.lk',
      tiktok: 'https://tiktok.com/@laforesta.lk',
    },
  });

  const spotseeker = await upsertCompany({
    email: 'spotseeker@eventsocial.local',
    name: 'Spotseeker',
    handle: 'spotseeker',
    category: 'Event Company',
    bio: 'Sri Lanka’s premier ticketing & events crew. From rooftop sundowners to harbour-side festivals, we curate the moments worth chasing. Tap a flyer to book — secure checkout in seconds.',
    avatarUrl: avatar(8),
    socials: {
      facebook: 'https://facebook.com/spotseeker',
      instagram: 'https://instagram.com/spotseeker.lk',
    },
  });

  const pulse = await upsertCompany({
    email: 'pulse@eventsocial.local',
    name: 'Pulse Collective',
    handle: 'pulsecollective',
    category: 'Event Company',
    bio: 'A collective of selectors and visual artists throwing high-energy warehouse nights. Tech-house, psytrance and everything that moves a floor till sunrise.',
    avatarUrl: avatar(60),
    socials: {
      instagram: 'https://instagram.com/pulse.collective',
      tiktok: 'https://tiktok.com/@pulse.collective',
    },
  });

  // 4) Events — real EDM names + posters, spread across upcoming weeks -------
  const events = [
    // La Foresta
    [laForesta, {
      title: 'Lost Garden',
      description: 'A label showcase under the canopy. Progressive house all night with a surprise B2B closing set. Bring your crew, lose yourself in the forest.',
      category: 'Festival',
      coverColor: '#123524',
      banner: asset('lost-garden.jpg'),
      flyers: [asset('lost-garden.jpg'), asset('chill-bay-fiesta.jpg')],
      startsAt: inDays(2),
      venueName: 'La Foresta Grove',
      addressLine: 'Bolgoda Lake, Moratuwa',
      geoLat: 6.7806, geoLng: 79.9003,
      ticketTypes: [
        { name: 'Early Bird', priceLabel: 'LKR 3,500', priceCents: 350000, currency: 'LKR', total: 300, remaining: 300 },
        { name: 'General', priceLabel: 'LKR 5,000', priceCents: 500000, currency: 'LKR', total: 400, remaining: 400 },
      ],
      lineup: [DJ.manik, DJ.roshan],
    }],

    [laForesta, {
      title: 'Afro Eclipse',
      description: 'Sundowner to moonrise. Deep, melodic, afro-house — an open-air terrace session.',
      category: 'Party',
      coverColor: '#1d3a2a',
      banner: asset('afro-eclipse.jpg'),
      startsAt: inDays(34),
      venueName: 'Terrace @ La Foresta',
      addressLine: 'Bolgoda Lake, Moratuwa',
      ticketTypes: [
        { name: 'General', priceLabel: 'LKR 4,000', priceCents: 400000, currency: 'LKR', total: 250, remaining: 250 },
      ],
      lineup: [DJ.gayan],
    }],

    // Spotseeker
    [spotseeker, {
      title: 'The Key to Happiness',
      description: 'Harbour-side festival at Port City Colombo. International headliner, full production, fireworks finale. The one you’ll talk about all year.',
      category: 'Festival',
      coverColor: '#2a1145',
      banner: asset('the-key-to-happiness.jpg'),
      flyers: [asset('the-key-to-happiness.jpg'), asset('viral-festival.jpg')],
      startsAt: inDays(9),
      venueName: 'Port City Colombo',
      addressLine: 'Port City, Colombo 01',
      geoLat: 6.9430, geoLng: 79.8400,
      ticketTypes: [
        { name: 'General Admission', priceLabel: 'LKR 6,500', priceCents: 650000, currency: 'LKR', total: 1000, remaining: 1000 },
        { name: 'VIP', priceLabel: 'LKR 15,000', priceCents: 1500000, currency: 'LKR', total: 150, remaining: 150 },
      ],
      lineup: [DJ.manik, DJ.zaeem, DJ.bmpi],
    }],

    [spotseeker, {
      title: 'Viral Festival',
      description: 'The biggest open-air on the calendar — multi-stage, all-day into all-night.',
      category: 'Festival',
      coverColor: '#3a1a2a',
      banner: asset('viral-festival.jpg'),
      startsAt: inDays(48),
      venueName: 'Diyatha Uyana',
      addressLine: 'Battaramulla',
      ticketTypes: [
        { name: 'General', priceLabel: 'LKR 4,500', priceCents: 450000, currency: 'LKR', total: 800, remaining: 800 },
      ],
      lineup: [DJ.zaeem, DJ.gayan],
    }],

    // Pulse Collective
    [pulse, {
      title: 'House of Rave',
      description: 'Warehouse tech-house marathon. Three rooms, one collective, till sunrise.',
      category: 'Party',
      coverColor: '#0b2545',
      banner: asset('house-of-rave.jpg'),
      flyers: [asset('house-of-rave.jpg'), asset('infinity-rave.jpg')],
      startsAt: inDays(16),
      venueName: 'The Warehouse',
      addressLine: 'Orugodawatta, Colombo 09',
      ticketTypes: [
        { name: 'Phase 1', priceLabel: 'LKR 3,000', priceCents: 300000, currency: 'LKR', total: 400, remaining: 400 },
        { name: 'Phase 2', priceLabel: 'LKR 4,000', priceCents: 400000, currency: 'LKR', total: 400, remaining: 400 },
      ],
      lineup: [DJ.bmpi, DJ.roshan],
    }],

    [pulse, {
      title: 'Infinity Rave 2.0',
      description: 'Psytrance & breakbeat under blacklight. Visual artists in residence.',
      category: 'Live Set',
      coverColor: '#241046',
      banner: asset('infinity-rave.jpg'),
      startsAt: inDays(63),
      venueName: 'Hangar 7',
      addressLine: 'Ratmalana',
      ticketTypes: [
        { name: 'General', priceLabel: 'LKR 3,800', priceCents: 380000, currency: 'LKR', total: 300, remaining: 300 },
      ],
      lineup: [DJ.roshan],
    }],

    // Mihiran
    [djMihiran, {
      title: 'Lumina 2.0',
      description: 'A night of melodic techno and immersive light design with surprise guests.',
      category: 'Concert',
      coverColor: '#260b3d',
      banner: asset('lumina.jpg'),
      flyers: [asset('lumina.jpg'), asset('lucio-frequencies.jpg')],
      startsAt: inDays(14),
      venueName: 'Stardust Arena',
      addressLine: '12 Marine Drive, Colombo 03',
      ticketTypes: [
        { name: 'General Admission', priceLabel: 'LKR 4,500', priceCents: 450000, currency: 'LKR', total: 500, remaining: 500 },
        { name: 'VIP', priceLabel: 'LKR 12,000', priceCents: 1200000, currency: 'LKR', total: 80, remaining: 80 },
      ],
      lineup: [DJ.manik, DJ.zaeem],
    }],

    [djMihiran, {
      title: 'Maaya Underground',
      description: 'Late-night underground selectors across two rooms.',
      category: 'Party',
      coverColor: '#1a0a2e',
      banner: asset('maaya-underground.jpg'),
      startsAt: inDays(40),
      venueName: 'RHYTHM & Blues',
      addressLine: 'Colombo 03',
      ticketTypes: [
        { name: 'General', priceLabel: 'LKR 3,500', priceCents: 350000, currency: 'LKR', total: 250, remaining: 250 },
      ],
      lineup: [DJ.bmpi],
    }],
  ];

  // Clean previous seed so re-runs reflect the latest names/posters, and remove
  // the retired "Udara Jayasanka" manager entirely (cascade deletes its events).
  const retired = await prisma.artist.findMany({
    where: { handle: { in: ['udarajayasanka', 'asava', 'ranilb'] } },
    select: { id: true },
  });
  if (retired.length) {
    await prisma.artist.deleteMany({ where: { id: { in: retired.map((a) => a.id) } } });
    console.log('[seed] removed retired managers:', retired.length);
  }
  const seedOrgIds = [laForesta.id, spotseeker.id, pulse.id, djMihiran.id];
  const purged = await prisma.event.deleteMany({ where: { organizerArtistId: { in: seedOrgIds } } });
  console.log('[seed] cleared previous seed events:', purged.count);

  let firstEvent = null;
  for (const [organizer, ev] of events) {
    const created = await ensureEvent(organizer, ev, []);
    if (!firstEvent) firstEvent = created;
    console.log('[seed] event:', created.title);
  }

  // 5) One demo reel linked to an event -------------------------------------
  const existingReel = await prisma.reel.findFirst({
    where: { artistId: djMihiran.id, caption: { contains: 'soundcheck' } },
  });
  if (!existingReel) {
    await prisma.reel.create({
      data: {
        artistId: djMihiran.id,
        caption: 'Stardust soundcheck — get ready for closing night 🔥',
        musicTrackTitle: 'Closing Night (intro)',
        musicTrackArtistName: 'Mihiran',
        linkedEventId: firstEvent ? firstEvent.id : null,
        coverColor: '#260b3d',
        visibility: 'public',
        tags: { create: [{ tag: 'stardust' }, { tag: 'liveset' }] },
      },
    });
  }

  console.log('[seed] done.');
}

main()
  .catch((e) => {
    console.error('[seed] failed', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
