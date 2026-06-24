/**
 * controllers/authController.js
 * Registration with mandatory email verification, login (blocked until
 * verified), resend verification, and password reset.
 */
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');
const { signAuthToken } = require('../utils/jwt');
const { sendVerificationEmail, sendResetEmail } = require('../utils/email');

const VERIFY_TTL = 24 * 60 * 60 * 1000; // 24h
const RESET_TTL = 60 * 60 * 1000; // 1h

function clientUrl() {
  return (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
}

// POST /api/v1/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, city, doctorProfile } = req.body;

  if (!name || !email || !password || !role) {
    throw new AppError('Name, email, password, and role are all required.', 400);
  }
  // Admin accounts are provisioned by the team, never self-registered.
  if (!['patient', 'doctor'].includes(role)) {
    throw new AppError('Please choose to register as a patient or a doctor.', 400);
  }
  if (role === 'doctor' && (!doctorProfile || !doctorProfile.specialization)) {
    throw new AppError('Doctors must provide their professional details to register.', 400);
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new AppError('An account with this email already exists.', 409);

  const user = new User({ name, email, password, role, phone, city });
  const rawToken = user.issueToken('verify', VERIFY_TTL);
  await user.save();

  // Doctors submit their full profile during sign-up; store it now.
  if (role === 'doctor') {
    const allowed = [
      'specialization', 'qualifications', 'licenseNumber', 'hospital',
      'experienceYears', 'fee', 'about', 'availableDays', 'startTime', 'endTime',
    ];
    const profile = { user: user._id };
    for (const f of allowed) if (doctorProfile[f] !== undefined) profile[f] = doctorProfile[f];
    try {
      await DoctorProfile.create(profile);
    } catch (err) {
      // Don't leave an orphan account if the profile is invalid.
      await User.deleteOne({ _id: user._id });
      throw new AppError(`Profile error: ${err.message}`, 400);
    }
  }

  const verifyUrl = `${clientUrl()}/verify-email?token=${rawToken}`;
  // Don't await: email sending can be slow or fail (bad SMTP creds, network
  // issues), and it should never delay or break the registration response.
  sendVerificationEmail(user, verifyUrl).catch((err) => {
    console.error('⚠  Verification email failed to send:', err.message);
  });

  res.status(201).json({
    success: true,
    message: `Account created. We sent a verification link to ${user.email}. Verify it to log in.`,
  });
});

// GET /api/v1/auth/verify-email?token=...
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) throw new AppError('Verification token is missing.', 400);

  const hash = User.hashToken(token);
  const user = await User.findOne({
    verifyTokenHash: hash,
    verifyTokenExpires: { $gt: new Date() },
  }).select('+verifyTokenHash +verifyTokenExpires');

  if (!user) {
    throw new AppError('This verification link is invalid or has expired. Request a new one.', 400);
  }

  user.isVerified = true;
  user.verifyTokenHash = undefined;
  user.verifyTokenExpires = undefined;
  await user.save({ validateBeforeSave: false });

  // Log them straight in after a successful verification.
  const authToken = signAuthToken(user);
  res.json({
    success: true,
    message: 'Email verified. Welcome to Doc-Connect.',
    token: authToken,
    user: user.toJSON(),
  });
});

// POST /api/v1/auth/resend-verification
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new AppError('Please provide your email address.', 400);

  const user = await User.findOne({ email: email.toLowerCase() });

  // Always respond the same way to avoid leaking which emails are registered.
  if (user && !user.isVerified) {
    const rawToken = user.issueToken('verify', VERIFY_TTL);
    await user.save({ validateBeforeSave: false });
    const verifyUrl = `${clientUrl()}/verify-email?token=${rawToken}`;
    sendVerificationEmail(user, verifyUrl).catch((err) => {
      console.error('⚠  Resend verification failed:', err.message);
    });
  }

  res.json({
    success: true,
    message: 'If that account exists and is unverified, a new link is on its way.',
  });
});

// POST /api/v1/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Please enter your email and password.', 400);

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    throw new AppError('Incorrect email or password.', 401);
  }

  // Gate: unverified accounts cannot log in.
  if (!user.isVerified) {
    throw new AppError('Your email is not verified yet. Check your inbox for the link.', 403);
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: 'Logged in successfully.',
    token: signAuthToken(user),
    user: user.toJSON(),
  });
});

// GET /api/v1/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toJSON() });
});

// POST /api/v1/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new AppError('Please provide your email address.', 400);

  const user = await User.findOne({ email: email.toLowerCase() });
  if (user) {
    const rawToken = user.issueToken('reset', RESET_TTL);
    await user.save({ validateBeforeSave: false });
    const resetUrl = `${clientUrl()}/reset-password?token=${rawToken}`;
    sendResetEmail(user, resetUrl).catch((err) => {
      console.error('⚠  Reset email failed:', err.message);
    });
  }

  res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
});

// POST /api/v1/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) throw new AppError('A token and a new password are required.', 400);

  const hash = User.hashToken(token);
  const user = await User.findOne({
    resetTokenHash: hash,
    resetTokenExpires: { $gt: new Date() },
  }).select('+resetTokenHash +resetTokenExpires');

  if (!user) throw new AppError('This reset link is invalid or has expired.', 400);

  user.password = password;
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  user.isVerified = true; // resetting via emailed link also confirms the address
  await user.save();

  res.json({
    success: true,
    message: 'Password updated. You are now logged in.',
    token: signAuthToken(user),
    user: user.toJSON(),
  });
});

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  login,
  getMe,
  forgotPassword,
  resetPassword,
};