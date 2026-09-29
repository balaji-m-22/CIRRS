const { CATEGORIES } = require('../models/Report');

// Validates a citizen's issue report before it is saved
function validateReport(req, res, next) {
  const { category, description, latitude, longitude, photo } = req.body;
  const errors = [];

  if (!CATEGORIES.includes(category)) errors.push(`category must be one of: ${CATEGORIES.join(', ')}`);
  if (!description || description.trim().length < 10) errors.push('description must be at least 10 characters');
  if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) errors.push('latitude must be a number between -90 and 90');
  if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) errors.push('longitude must be a number between -180 and 180');
  if (!photo) errors.push('a geotagged photo is required');

   const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
   if (photo && Buffer.byteLength(photo, 'base64') > MAX_PHOTO_BYTES) errors.push('photo must be 5 MB or smaller');

  if (errors.length) return res.status(400).json({ errors });
  next();
}

module.exports = validateReport;
