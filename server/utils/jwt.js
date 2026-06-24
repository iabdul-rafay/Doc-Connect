/**
 * utils/jwt.js
 * Helpers for signing and verifying authentication JWTs.
 */
const jwt = require('jsonwebtoken');

function signAuthToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function verifyAuthToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { signAuthToken, verifyAuthToken };
