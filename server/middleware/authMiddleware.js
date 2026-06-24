/**
 * middleware/authMiddleware.js
 * `protect` attaches the authenticated user to req.user.
 * `restrictTo(...roles)` gates a route to specific roles.
 */
const User = require('../models/User');
const { verifyAuthToken } = require('../utils/jwt');
const { AppError } = require('./errorMiddleware');

async function protect(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new AppError('You are not logged in. Please log in to continue.', 401);

    let decoded;
    try {
      decoded = verifyAuthToken(token);
    } catch {
      throw new AppError('Your session is invalid or has expired. Please log in again.', 401);
    }

    const user = await User.findById(decoded.id);
    if (!user) throw new AppError('The account for this session no longer exists.', 401);
    if (!user.isVerified) throw new AppError('Please verify your email before continuing.', 403);

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

function restrictTo(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
}

module.exports = { protect, restrictTo };
