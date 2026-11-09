/**
 * Who/where a request came from, for the audit log and traffic analytics.
 *
 * These values are for DISPLAY in the admin console only — never for access
 * decisions. Forwarded headers can be spoofed; the rate limiter keeps using
 * Express' own `req.ip`.
 */

const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse|pingdom|uptime/i;

function clientIp(req) {
  // The website reaches us through its own /api proxy (Vercel rewrite → nginx),
  // so the left-most forwarded hop is the visitor; req.ip would be the proxy.
  const forwarded = String(req.headers['x-forwarded-for'] || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const ip = forwarded[0] || req.headers['x-real-ip'] || req.ip || '';
  return String(ip).replace(/^::ffff:/, '').slice(0, 64) || null;
}

function userAgent(req) {
  const ua = req.headers['user-agent'];
  return ua ? String(ua).slice(0, 255) : null;
}

/**
 * web | app | api. Both first-party clients send `X-Client`; anything else
 * (curl, scripts, the old APK) is "api".
 */
function clientSource(req) {
  const hinted = String(req.headers['x-client'] || '').toLowerCase();
  if (hinted === 'web' || hinted === 'app') return hinted;
  return 'api';
}

function isBot(req) {
  return BOT_UA.test(String(req.headers['user-agent'] || ''));
}

module.exports = { clientIp, userAgent, clientSource, isBot };
