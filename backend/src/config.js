/**
 * Environment loader. All env access goes through this file so we have
 * one place to validate, default, and document required vars.
 *
 * Fails fast on missing critical config in production.
 */

require('dotenv').config();

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

module.exports = {
  env: NODE_ENV,
  isProd,
  port: parseInt(process.env.PORT || '8000', 10),

  databaseUrl: isProd ? required('DATABASE_URL') : process.env.DATABASE_URL,

  jwt: {
    secret: isProd ? required('JWT_SECRET') : process.env.JWT_SECRET || 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  },

  cors: {
    origins: (process.env.CORS_ORIGINS || '*')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '300', 10),
  },

  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@eventsocial.local',
    adminPassword: process.env.SEED_ADMIN_PASSWORD || 'ChangeMe!2026',
  },

  push: {
    // Master switch. Turn off to keep the in-app feed working while nothing
    // is delivered to the OS (useful on staging).
    enabled: process.env.PUSH_ENABLED !== 'false',
    // The background sweep that sends reminders / catch-up publishes. Runs
    // in-process — safe because events-ai is a single pm2 instance. If that
    // ever becomes a cluster, set PUSH_SCHEDULER_ENABLED=false on all but one.
    schedulerEnabled: process.env.PUSH_SCHEDULER_ENABLED !== 'false',
    sweepIntervalMs: parseInt(process.env.PUSH_SWEEP_INTERVAL_MS || '300000', 10), // 5 min
    // Optional Expo access token — only required once "enhanced push security"
    // is enabled on the Expo account.
    accessToken: process.env.EXPO_ACCESS_TOKEN || '',
    requestTimeoutMs: parseInt(process.env.PUSH_REQUEST_TIMEOUT_MS || '15000', 10),
    // Reminders go out at this local hour. The server runs UTC; the audience
    // is in Asia/Colombo (UTC+5:30), so we shift by a fixed offset rather than
    // dragging in a tz database for one number.
    reminderHour: parseInt(process.env.PUSH_REMINDER_HOUR || '10', 10),
    tzOffsetMinutes: parseInt(process.env.PUSH_TZ_OFFSET_MINUTES || '330', 10),
    // Lead times, in days before the event. 5 days came from client feedback
    // (2 days' notice was too short); 1 is the night-before nudge.
    reminderDays: (process.env.PUSH_REMINDER_DAYS || '5,1')
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => b - a),
    // A device is retired after this many consecutive delivery failures.
    maxFailures: parseInt(process.env.PUSH_MAX_FAILURES || '5', 10),
    // Catch-up window for "published" alerts when the process was down.
    publishCatchupHours: parseInt(process.env.PUSH_PUBLISH_CATCHUP_HOURS || '48', 10),
    // Delivery-ledger rows older than this are pruned.
    deliveryRetentionDays: parseInt(process.env.PUSH_DELIVERY_RETENTION_DAYS || '60', 10),
  },

  uploads: {
    // Files written here are served at `${publicBaseUrl}/uploads/<file>`.
    dir: process.env.UPLOAD_DIR || './uploads',
    publicBaseUrl: process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 8000}`,
    maxVideoMb: parseInt(process.env.UPLOAD_MAX_VIDEO_MB || '100', 10),
    maxImageMb: parseInt(process.env.UPLOAD_MAX_IMAGE_MB || '10', 10),
  },
};
