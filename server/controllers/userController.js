/**
 * controllers/userController.js
 * Shared account actions for any logged-in user: edit profile, change avatar,
 * change password.
 */
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');

// PUT /api/v1/users/me
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, city } = req.body;
  const user = await User.findById(req.user._id);

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (city !== undefined) user.city = city;

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

module.exports = { updateProfile, updateAvatar, changePassword };
