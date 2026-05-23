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

  uploads: {
    // Files written here are served at `${publicBaseUrl}/uploads/<file>`.
    dir: process.env.UPLOAD_DIR || './uploads',
    publicBaseUrl: process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 8000}`,
    maxVideoMb: parseInt(process.env.UPLOAD_MAX_VIDEO_MB || '100', 10),
    maxImageMb: parseInt(process.env.UPLOAD_MAX_IMAGE_MB || '10', 10),
  },
};
