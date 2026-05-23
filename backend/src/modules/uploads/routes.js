/**
 * File upload endpoints. Multer streams the file straight to disk under
 * `config.uploads.dir`, then we return the absolute URL the client should
 * embed in subsequent API calls (e.g. as `Reel.videoUrl`).
 *
 *   POST /api/uploads/video   multipart/form-data, field name: "file"
 *   POST /api/uploads/image   multipart/form-data, field name: "file"
 *
 * Both endpoints require auth — only signed-in users can write to disk.
 *
 * MIME / size validation runs in Multer's fileFilter + limits so we reject
 * over-sized or wrong-type files BEFORE buffering them. The mobile app
 * surfaces the resulting 400/413 via the standard ApiError handler.
 */

const { Router } = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { requireAuth } = require('../../middleware/auth');
const asyncHandler = require('../../lib/async-handler');
const { BadRequest } = require('../../lib/errors');
const config = require('../../config');

const router = Router();

// Resolve the upload directory once and make sure it exists. Doing this at
// module load time means a missing directory surfaces as a server startup
// crash instead of a per-request 500.
const uploadDir = path.resolve(config.uploads.dir);
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_VIDEO = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'];
const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function safeFilename(originalName) {
  const ext = path.extname(originalName).toLowerCase().slice(0, 8) || '';
  // Random filename — never trust the client's `originalname` directly,
  // both for collisions and for path-traversal.
  return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, safeFilename(file.originalname || 'file.bin')),
});

function makeUploader({ allowed, maxBytes, label }) {
  return multer({
    storage,
    limits: { fileSize: maxBytes },
    fileFilter: (_req, file, cb) => {
      if (!allowed.includes(file.mimetype)) {
        return cb(new BadRequest(`Unsupported ${label} type: ${file.mimetype}`));
      }
      cb(null, true);
    },
  });
}

const videoUploader = makeUploader({
  allowed: ALLOWED_VIDEO,
  maxBytes: config.uploads.maxVideoMb * 1024 * 1024,
  label: 'video',
});
const imageUploader = makeUploader({
  allowed: ALLOWED_IMAGE,
  maxBytes: config.uploads.maxImageMb * 1024 * 1024,
  label: 'image',
});

function buildPublicUrl(filename) {
  return `${config.uploads.publicBaseUrl.replace(/\/$/, '')}/uploads/${filename}`;
}

function fileResponse(file) {
  return {
    url: buildPublicUrl(file.filename),
    filename: file.filename,
    sizeBytes: file.size,
    mimeType: file.mimetype,
  };
}

router.post(
  '/video',
  requireAuth,
  videoUploader.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new BadRequest('Missing file (form field "file")');
    res.status(201).json(fileResponse(req.file));
  }),
);

router.post(
  '/image',
  requireAuth,
  imageUploader.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new BadRequest('Missing file (form field "file")');
    res.status(201).json(fileResponse(req.file));
  }),
);

module.exports = router;
