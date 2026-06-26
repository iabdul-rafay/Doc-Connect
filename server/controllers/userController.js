/**
 * controllers/userController.js
 * Shared account actions for any logged-in user: edit profile, change avatar,
 * change password.
 */
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');

// PUT /api/v1/users/me
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, city, medical } = req.body;
  const user = await User.findById(req.user._id);

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (city !== undefined) user.city = city;

  if (medical && typeof medical === 'object') {
    if (!user.medical) user.medical = {};
    ['bloodGroup', 'dateOfBirth', 'allergies', 'conditions', 'emergencyContact'].forEach((k) => {
      if (medical[k] !== undefined) user.medical[k] = medical[k];
    });
  }

  await user.save();
  res.json({ success: true, message: 'Profile updated.', user: user.toJSON() });
});

// PUT /api/v1/users/me/avatar  (multipart: profileImage)
const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No image was uploaded.', 400);
  const user = await User.findById(req.user._id);

  // Remove the previous file if it exists.
  if (user.avatar) {
    const old = path.join(__dirname, '..', 'uploads', 'profiles', path.basename(user.avatar));
    fs.existsSync(old) && fs.unlinkSync(old);
  }

  user.avatar = `/uploads/profiles/${req.file.filename}`;
  await user.save();
  res.json({ success: true, message: 'Photo updated.', user: user.toJSON() });
});

// PUT /api/v1/users/me/password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new AppError('Both the current and new password are required.', 400);
  }
  if (newPassword.length < 8) throw new AppError('New password must be at least 8 characters.', 400);

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    throw new AppError('Your current password is incorrect.', 401);
  }

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password changed.' });
});

// POST /api/v1/users/me/favorites/:doctorId  — toggle a favorite doctor
const toggleFavorite = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const user = await User.findById(req.user._id);
  const idx = user.favorites.findIndex((f) => String(f) === doctorId);
  let favorited;
  if (idx >= 0) { user.favorites.splice(idx, 1); favorited = false; }
  else { user.favorites.push(doctorId); favorited = true; }
  await user.save();
  res.json({ success: true, favorited, favorites: user.favorites });
});

// GET /api/v1/users/me/favorites  — full doctor cards for favorited doctors
const listFavorites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const ids = user.favorites || [];
  if (!ids.length) return res.json({ success: true, favorites: [], doctors: [] });

  const profiles = await DoctorProfile.find({ user: { $in: ids } })
    .populate('user', 'name email avatar city');
  const doctors = profiles
    .filter((p) => p.user)
    .map((p) => ({
      id: p.user._id,
      name: p.user.name,
      avatar: p.user.avatar,
      city: p.user.city,
      specialization: p.specialization,
      fee: p.fee,
    }));
  res.json({ success: true, favorites: ids, doctors });
});

module.exports = { updateProfile, updateAvatar, changePassword, toggleFavorite, listFavorites };
