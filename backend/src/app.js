/**
 * Express app composition. The HTTP listener lives in src/index.js so this
 * module is import-safe for tests.
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const routes = require('./routes');
const errorHandler = require('./middleware/error');
const notFound = require('./middleware/notFound');

function build() {
  const app = express();

  // Behind a reverse proxy in production (NGINX / Caddy / Cloud LB).
  app.set('trust proxy', 1);

  // Security headers. CSP is mostly irrelevant for a JSON API, but the rest
  // (X-Frame-Options, X-Content-Type-Options, etc.) are free wins.
  app.use(helmet({ contentSecurityPolicy: false }));

  // CORS — open in dev, narrowed via CORS_ORIGINS in prod.
  app.use(
    cors({
      origin: config.cors.origins.includes('*') ? true : config.cors.origins,
      credentials: true,
    }),
  );

  // Request logging — concise in prod, verbose in dev.
  if (!config.isProd) app.use(morgan('dev'));
  else app.use(morgan('combined'));

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));

  // Global, generous rate limit. Tighter limits live on the auth routes.
  app.use(
    rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    }),
  );

  app.use('/api', routes);

  // Static file serving for user-uploaded videos / images. The path is
  // intentionally outside /api so it doesn't go through the JSON middleware.
  app.use(
    '/uploads',
    express.static(path.resolve(config.uploads.dir), {
      // 7-day immutable cache — every file gets a unique random name on
      // upload, so we can mark the content as immutable safely.
      maxAge: '7d',
      immutable: true,
      fallthrough: false,
    }),
  );

  // Friendly root response so a browser hit to / shows something useful.
  app.get('/', (_req, res) => {
    res.json({
      name: 'eventsocial-backend',
      docs: '/api/health',
      version: '0.1.0',
    });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { build };
