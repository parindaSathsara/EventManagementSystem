/**
 * Global error handler. Renders a consistent JSON shape:
 *   { message, code?, details? }
 *
 * Logs unexpected (non-HttpError) errors with stack so we don't lose
 * crashes in production. Known HttpErrors render at their declared status.
 */

const { HttpError } = require('../lib/errors');

// Prisma-specific known error codes we want to translate. Keep this small —
// most validation happens via zod before hitting the DB.
const PRISMA_KNOWN = {
  P2002: { status: 409, message: 'A record with these unique fields already exists.' },
  P2025: { status: 404, message: 'Record not found.' },
};

// Multer raises its own MulterError class with a `.code` field; surface the
// common ones as 4xx with friendlier messages.
const MULTER_KNOWN = {
  LIMIT_FILE_SIZE: { status: 413, message: 'File is too large.' },
  LIMIT_UNEXPECTED_FILE: { status: 400, message: 'Unexpected file field.' },
  LIMIT_PART_COUNT: { status: 400, message: 'Too many parts in the upload.' },
};

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      message: err.message,
      code: err.code,
      details: err.details,
    });
  }

  if (err?.code && PRISMA_KNOWN[err.code]) {
    const mapped = PRISMA_KNOWN[err.code];
    return res
      .status(mapped.status)
      .json({ message: mapped.message, code: err.code, details: err.meta });
  }

  // Multer surfaces `err.name === 'MulterError'` with `err.code` set.
  if (err?.name === 'MulterError' && MULTER_KNOWN[err.code]) {
    const mapped = MULTER_KNOWN[err.code];
    return res.status(mapped.status).json({ message: mapped.message, code: err.code });
  }

  // Unexpected — log and return a safe 500.
  // eslint-disable-next-line no-console
  console.error('[error]', err);
  res.status(500).json({
    message: 'Internal server error',
    code: 'INTERNAL',
  });
}

module.exports = errorHandler;
