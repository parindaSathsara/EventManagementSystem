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

// Landscape concert/EDM banners (Unsplash, stable IDs).
const BANNERS = [
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1280&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1280&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1280&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1280&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1280&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=1280&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1280&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=1280&q=80&auto=format&fit=crop',
];
let _bannerCursor = 0;
function flyer() {
  const url = BANNERS[_bannerCursor % BANNERS.length];
  _bannerCursor += 1;
  return url;
}

// Avatar placeholders (pravatar — reliable, real faces).
function avatar(n) {
  return `https://i.pravatar.cc/300?img=${n}`;
}

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
  const djAsava = await upsertCompany({
    email: 'asava@eventsocial.local',
    name: 'Asava',
    handle: 'asava',
    category: 'DJ',
    bio: 'Melodic techno selector from Colombo.',
    avatarUrl: avatar(33),
    socials: { instagram: 'https://instagram.com/asava' },
  });
  const djRanil = await upsertCompany({
    email: 'ranil@eventsocial.local',
    name: 'Ranil B',
    handle: 'ranilb',
    category: 'DJ',
    bio: 'Drum & bass / breakbeat.',
    avatarUrl: avatar(51),
    socials: { instagram: 'https://instagram.com/ranilb' },
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

  const udara = await upsertCompany({
    email: 'udara@eventsocial.local',
    name: 'Udara Jayasanka',
    handle: 'udarajayasanka',
    category: 'Event Company',
    bio: 'Live concerts and artist showcases across Sri Lanka. Big stages, full bands, unforgettable nights — bringing the country’s favourite acts to a venue near you.',
    avatarUrl: avatar(68),
    socials: {
      facebook: 'https://facebook.com/udara.jayasanka',
      instagram: 'https://instagram.com/udara.jayasanka',
      tiktok: 'https://tiktok.com/@udara.jayasanka',
    },
  });

  // 4) Events — spread across now, +20d, next month, month after ------------
  const events = [
    // La Foresta
    [laForesta, {
      title: 'The Sound Garden',
      description: 'A label showcase under the canopy. Progressive house all night with a surprise B2B closing set. Bring your crew, lose yourself in the forest.',
      category: 'Festival',
      coverColor: '#123524',
      banner: flyer('soundgarden'),
      flyers: [flyer('soundgarden'), flyer('soundgarden2')],
      socials: { instagram: 'https://instagram.com/laforesta.lk' },
      startsAt: inDays(2),
      venueName: 'La Foresta Grove',
      addressLine: 'Bolgoda Lake, Moratuwa',
      geoLat: 6.7806, geoLng: 79.9003,
      ticketTypes: [
        { name: 'Early Bird', priceLabel: 'LKR 3,500', priceCents: 350000, currency: 'LKR', total: 300, remaining: 300 },
        { name: 'General', priceLabel: 'LKR 5,000', priceCents: 500000, currency: 'LKR', total: 400, remaining: 400 },
      ],
    }, [djAsava.id, djMihiran.id]],

    [laForesta, {
      title: 'Jungle Terrace',
      description: 'Sundowner to moonrise. Deep, melodic, hypnotic — an open-air terrace session.',
      category: 'Party',
      coverColor: '#1d3a2a',
      banner: flyer('jungleterrace'),
      startsAt: inDays(34),
      venueName: 'Terrace @ La Foresta',
      addressLine: 'Bolgoda Lake, Moratuwa',
      ticketTypes: [
        { name: 'General', priceLabel: 'LKR 4,000', priceCents: 400000, currency: 'LKR', total: 250, remaining: 250 },
      ],
    }, [djAsava.id]],

    // Spotseeker
    [spotseeker, {
      title: 'The Key to Happiness',
      description: 'Harbour-side festival at Port City Colombo. International headliner, full production, fireworks finale. The one you’ll talk about all year.',
      category: 'Festival',
      coverColor: '#2a1145',
      banner: flyer('keytohappiness'),
      flyers: [flyer('keytohappiness'), flyer('keytohappiness2'), flyer('keytohappiness3')],
      socials: { facebook: 'https://facebook.com/spotseeker', instagram: 'https://instagram.com/spotseeker.lk' },
      startsAt: inDays(9),
      venueName: 'Port City Colombo',
      addressLine: 'Port City, Colombo 01',
      geoLat: 6.9430, geoLng: 79.8400,
      ticketTypes: [
        { name: 'General Admission', priceLabel: 'LKR 6,500', priceCents: 650000, currency: 'LKR', total: 1000, remaining: 1000 },
        { name: 'VIP', priceLabel: 'LKR 15,000', priceCents: 1500000, currency: 'LKR', total: 150, remaining: 150 },
      ],
    }, [djMihiran.id, djRanil.id]],

    [spotseeker, {
      title: 'Rooftop Sundowners',
      description: 'Golden-hour house on a Colombo rooftop. Limited capacity, big views.',
      category: 'Party',
      coverColor: '#3a1a2a',
      banner: flyer('rooftopsundowners'),
      startsAt: inDays(48),
      venueName: 'Sky Lounge',
      addressLine: 'Marine Drive, Colombo 03',
      ticketTypes: [
        { name: 'General', priceLabel: 'LKR 4,500', priceCents: 450000, currency: 'LKR', total: 180, remaining: 180 },
      ],
    }, [djAsava.id]],

    // Pulse Collective
    [pulse, {
      title: 'Neon Tide',
      description: 'Warehouse tech-house marathon. Three rooms, one collective, till sunrise.',
      category: 'Party',
      coverColor: '#0b2545',
      banner: flyer('neontide'),
      flyers: [flyer('neontide'), flyer('neontide2')],
      startsAt: inDays(16),
      venueName: 'The Warehouse',
      addressLine: 'Orugodawatta, Colombo 09',
      ticketTypes: [
        { name: 'Phase 1', priceLabel: 'LKR 3,000', priceCents: 300000, currency: 'LKR', total: 400, remaining: 400 },
        { name: 'Phase 2', priceLabel: 'LKR 4,000', priceCents: 400000, currency: 'LKR', total: 400, remaining: 400 },
      ],
    }, [djRanil.id, djAsava.id]],

    [pulse, {
      title: 'Afterglow',
      description: 'Psytrance & breakbeat under blacklight. Visual artists in residence.',
      category: 'Live Set',
      coverColor: '#241046',
      banner: flyer('afterglow'),
      startsAt: inDays(63),
      venueName: 'Hangar 7',
      addressLine: 'Ratmalana',
      ticketTypes: [
        { name: 'General', priceLabel: 'LKR 3,800', priceCents: 380000, currency: 'LKR', total: 300, remaining: 300 },
      ],
    }, [djRanil.id]],

    // Mihiran (kept from the original demo)
    [djMihiran, {
      title: 'Stardust Arena · Closing Night',
      description: 'Closing night with surprise guests, full lineup TBA.',
      category: 'Concert',
      coverColor: '#260b3d',
      banner: flyer('stardust'),
      startsAt: inDays(14),
      venueName: 'Stardust Arena',
      addressLine: '12 Marine Drive, Colombo 03',
      ticketTypes: [
        { name: 'General Admission', priceLabel: 'LKR 4,500', priceCents: 450000, currency: 'LKR', total: 500, remaining: 500 },
        { name: 'VIP', priceLabel: 'LKR 12,000', priceCents: 1200000, currency: 'LKR', total: 80, remaining: 80 },
      ],
    }, [djMihiran.id]],

    // Udara Jayasanka — live concerts with named artists + their own socials
    [udara, {
      title: 'Sahara Flash Live in Colombo',
      description: 'A full-band live concert night with the country’s favourite voices. Lights, brass, and an all-star lineup under one roof.',
      category: 'Concert',
      coverColor: '#2a1145',
      banner: flyer(),
      flyers: [flyer(), flyer()],
      startsAt: inDays(5),
      venueName: 'Nelum Pokuna Theatre',
      addressLine: 'Nelum Pokuna Mawatha, Colombo 07',
      ticketTypes: [
        { name: 'Balcony', priceLabel: 'LKR 3,000', priceCents: 300000, currency: 'LKR', total: 300, remaining: 300 },
        { name: 'Front Row', priceLabel: 'LKR 7,500', priceCents: 750000, currency: 'LKR', total: 100, remaining: 100 },
      ],
      lineup: [
        { name: 'Bathiya & Santhush', socials: { facebook: 'https://facebook.com/BnSmusic', instagram: 'https://instagram.com/bns_official' } },
        { name: 'Umaria Sinhawansa', socials: { instagram: 'https://instagram.com/umariasinhawansa', tiktok: 'https://tiktok.com/@umaria' } },
        { name: 'Sahara Flash', socials: { facebook: 'https://facebook.com/saharaflashsl' } },
      ],
    }, []],

    [udara, {
      title: 'Unplugged · Acoustic Night',
      description: 'An intimate acoustic evening — stripped-back sets from Sri Lanka’s finest singer-songwriters.',
      category: 'Live Set',
      coverColor: '#123524',
      banner: flyer(),
      startsAt: inDays(27),
      venueName: 'Musaeus College Auditorium',
      addressLine: 'Colombo 07',
      ticketTypes: [
        { name: 'General', priceLabel: 'LKR 2,500', priceCents: 250000, currency: 'LKR', total: 250, remaining: 250 },
      ],
      lineup: [
        { name: 'Sanuka Wickramasinghe', socials: { instagram: 'https://instagram.com/sanukaofficial', facebook: 'https://facebook.com/sanukamusic' } },
        { name: 'Dinesh Gamage', socials: { instagram: 'https://instagram.com/dineshgamage' } },
      ],
    }, []],
  ];

  let firstEvent = null;
  for (const [organizer, ev, lineup] of events) {
    const created = await ensureEvent(organizer, ev, lineup);
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
