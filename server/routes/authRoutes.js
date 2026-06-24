const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  register,
  verifyEmail,
  resendVerification,
  login,
  getMe,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Throttle auth-sensitive endpoints to slow down brute force / email spam.
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true, legacyHeaders: false });

router.post('/register', limiter, register);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', limiter, resendVerification);
router.post('/login', limiter, login);
router.post('/forgot-password', limiter, forgotPassword);
router.post('/reset-password', limiter, resetPassword);
router.get('/me', protect, getMe);

module.exports = router;
