// Photo helpers: accept a base64 string or data URL, check size/type, save to /uploads.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_DIR = process.env.CIRRS_UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB (GitHub Issue #1)
const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

// Returns { buffer, ext } or { error }
function parsePhoto(input) {
  if (!input || typeof input !== 'string') return { error: 'a photo is required' };
  let mime = 'image/jpeg';
  let b64 = input;
  const m = input.match(/^data:([\w/+.-]+);base64,(.*)$/s);
  if (m) { mime = m[1]; b64 = m[2]; }
  if (!TYPES[mime]) return { error: 'photo must be a JPEG, PNG or WebP image' };
  const buffer = Buffer.from(b64, 'base64');
  if (!buffer.length) return { error: 'photo is empty' };
  if (buffer.length > MAX_PHOTO_BYTES) return { error: 'photo must be 5 MB or smaller' };
  return { buffer, ext: TYPES[mime] };
}

// Saves a validated photo and returns its public URL path
function savePhoto(input) {
  const parsed = parsePhoto(input);
  if (parsed.error) throw Object.assign(new Error(parsed.error), { status: 400 });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const name = `${crypto.randomUUID()}.${parsed.ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), parsed.buffer);
  return `/uploads/${name}`;
}

module.exports = { UPLOAD_DIR, MAX_PHOTO_BYTES, parsePhoto, savePhoto };
