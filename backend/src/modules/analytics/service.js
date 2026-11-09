const prisma = require('../../prisma');

// A repeat view from the same visitor inside this window is the same "visit"
// (a refresh, a back-and-forth, React re-mounting) and is not counted again.
const DEDUPE_MS = {
  page: 60 * 1000,
  event: 30 * 60 * 1000,
  artist: 30 * 60 * 1000,
  app_open: 30 * 60 * 1000,
};

/** Strip query strings / fragments so `/events?focus=search` groups with `/events`. */
function normalisePath(path) {
  if (!path) return null;
  const clean = String(path).split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  return clean.slice(0, 255);
}

// In-process claim on (visitor, kind, target). Checked and set synchronously,
// so two identical beacons arriving together (a double-mounted component, a
// retry) can't both pass the DB lookup below before either has inserted.
// events-ai runs as a single process; the DB check still covers restarts.
const recentClaims = new Map();
const MAX_CLAIMS = 50000;

function claim(key, windowMs) {
  const now = Date.now();
  const last = recentClaims.get(key);
  if (last && now - last < windowMs) return false;
  if (recentClaims.size >= MAX_CLAIMS) {
    for (const [k, t] of recentClaims) if (now - t > 30 * 60 * 1000) recentClaims.delete(k);
    if (recentClaims.size >= MAX_CLAIMS) recentClaims.clear();
  }
  recentClaims.set(key, now);
  return true;
}

async function track({ kind, targetId, path, visitorId, source, referrer }, userId) {
  const row = {
    kind,
    targetId: targetId || null,
    path: normalisePath(path),
    visitorId,
    userId: userId || null,
    source,
    referrer: referrer ? String(referrer).slice(0, 255) : null,
  };

  const windowMs = DEDUPE_MS[kind] || 60 * 1000;
  if (!claim(`${visitorId}|${kind}|${row.targetId || row.path || ''}`, windowMs)) return { counted: false };

  const since = new Date(Date.now() - windowMs);
  const recent = await prisma.viewEvent.findFirst({
    where: {
      visitorId,
      kind,
      createdAt: { gte: since },
      ...(kind === 'page' ? { path: row.path } : {}),
      ...(kind === 'event' || kind === 'artist' ? { targetId: row.targetId } : {}),
    },
    select: { id: true },
  });
  if (recent) return { counted: false };

  await prisma.viewEvent.create({ data: row });
  return { counted: true };
}

module.exports = { track, normalisePath };
