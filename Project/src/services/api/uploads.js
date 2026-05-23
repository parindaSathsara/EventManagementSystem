/**
 * File upload API. Uses the native FormData multipart pipeline so the
 * device streams the file directly to the backend without buffering the
 * whole video in memory.
 *
 * Returns the backend's response shape:
 *   { url, filename, sizeBytes, mimeType }
 *
 * `url` is the absolute URL the rest of the API expects to receive (e.g.
 * `Reel.videoUrl`).
 *
 * Progress: pass `onProgress` to receive a 0..1 float. We use XMLHttpRequest
 * instead of fetch() because React Native's fetch doesn't expose upload
 * progress events.
 */

import { loadToken, getBaseUrl, ApiError } from './client';

function guessMimeFromUri(uri, fallback) {
  if (!uri) return fallback;
  const lower = uri.toLowerCase();
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.m4v')) return 'video/x-m4v';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return fallback;
}

function basename(uri) {
  if (!uri) return 'file';
  const cleaned = uri.split('?')[0];
  const parts = cleaned.split('/');
  return parts[parts.length - 1] || 'file';
}

async function uploadFile(path, { uri, mimeType, filename }, { onProgress } = {}) {
  const token = await loadToken();
  const url = `${getBaseUrl()}${path}`;

  const form = new FormData();
  // React Native multipart shape: { uri, name, type } — both `name` and
  // `type` are required for Express/Multer to parse the field correctly.
  form.append('file', {
    uri,
    name: filename || basename(uri),
    type: mimeType || guessMimeFromUri(uri, 'application/octet-stream'),
  });

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    // Don't set Content-Type — the runtime fills in the multipart boundary.

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) onProgress(evt.loaded / evt.total);
      };
    }

    xhr.onload = () => {
      let payload = null;
      try {
        payload = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        payload = xhr.responseText;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload);
      } else {
        const message = (payload && (payload.message || payload.error)) || `Upload failed (${xhr.status})`;
        reject(new ApiError(message, { status: xhr.status, code: payload?.code, details: payload?.details }));
      }
    };
    xhr.onerror = () => {
      reject(new ApiError('Upload failed — network error.', { status: 0, code: 'NETWORK' }));
    };
    xhr.ontimeout = () => {
      reject(new ApiError('Upload timed out.', { status: 0, code: 'TIMEOUT' }));
    };

    xhr.send(form);
  });
}

export function uploadVideo(asset, opts) {
  return uploadFile('/uploads/video', asset, opts);
}

export function uploadImage(asset, opts) {
  return uploadFile('/uploads/image', asset, opts);
}
