const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

function generateTrackingToken() {
  return crypto.randomBytes(32).toString('hex');
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.socket.remoteAddress || 'unknown';
}

function getUserAgent(req) {
  return req.headers['user-agent'] || 'unknown';
}

function buildTrackingUrl(baseUrl, trackingToken) {
  return `${baseUrl}/track/${trackingToken}`;
}

function replacePlaceholders(template, placeholders) {
  let result = template;
  for (const [key, value] of Object.entries(placeholders)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

module.exports = {
  generateTrackingToken,
  getClientIp,
  getUserAgent,
  buildTrackingUrl,
  replacePlaceholders
};
