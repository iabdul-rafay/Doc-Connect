/**
 * controllers/adminController.js
 * Admin-only management of patients, doctors, and their data.
 */
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');

// GET /api/v1/admin/stats
const getStats = asyncHandler(async (_req, res) => {
  const [patients, doctors, appointments, prescriptions, verified] = await Promise.all([
    User.countDocuments({ role: 'patient' }),
    User.countDocuments({ role: 'doctor' }),
    Appointment.countDocuments(),
    Prescription.countDocuments(),
    User.countDocuments({ isVerified: true, role: { $ne: 'admin' } }),
  ]);
  res.json({ success: true, stats: { patients, doctors, appointments, prescriptions, verified } });
});

// GET /api/v1/admin/users?role=&search=
const listUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.query;
  const filter = { role: { $ne: 'admin' } };
  if (role && ['patient', 'doctor'].includes(role)) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(filter).sort({ createdAt: -1 }).lean();

  // Attach doctor profiles in one query.
  const doctorIds = users.filter((u) => u.role === 'doctor').map((u) => u._id);
  const profiles = await DoctorProfile.find({ user: { $in: doctorIds } }).lean();
  const byUser = Object.fromEntries(profiles.map((p) => [String(p.user), p]));

  const shaped = users.map((u) => ({
    ...u,
    doctorProfile: u.role === 'doctor' ? byUser[String(u._id)] || null : undefined,
  }));

  res.json({ success: true, count: shaped.length, users: shaped });
});

// POST /api/v1/admin/users  — admin adds a patient or doctor (pre-verified)
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, city, doctorProfile } = req.body;
  if (!name || !email || !password || !role) {
    throw new AppError('Name, email, password, and role are required.', 400);
  }
  if (!['patient', 'doctor'].includes(role)) throw new AppError('Role must be patient or doctor.', 400);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new AppError('An account with this email already exists.', 409);

  const user = await User.create({ name, email, password, role, phone, city, isVerified: true });

  if (role === 'doctor') {
    await DoctorProfile.create({
      user: user._id,
      specialization: doctorProfile?.specialization || 'General Physician',
      ...doctorProfile,
    });
  }

  res.status(201).json({ success: true, message: 'Account created.', user: user.toJSON() });
});

// PUT /api/v1/admin/users/:id  — edit a user's account + (optionally) doctor profile
const updateUser = asyncHandler(async (req, res) => {
  const { name, email, phone, city, isVerified, doctorProfile } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found.', 404);
  if (user.role === 'admin') throw new AppError('Admin accounts cannot be edited here.', 403);

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (phone !== undefined) user.phone = phone;
  if (city !== undefined) user.city = city;
  if (isVerified !== undefined) user.isVerified = isVerified;
  await user.save();

  if (user.role === 'doctor' && doctorProfile) {
    await DoctorProfile.findOneAndUpdate({ user: user._id }, doctorProfile, {
      new: true,
      upsert: true,
      runValidators: true,
    });
  }

  res.json({ success: true, message: 'User updated.', user: user.toJSON() });
});

// DELETE /api/v1/admin/users/:id  — remove a user and all their related data
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found.', 404);
  if (user.role === 'admin') throw new AppError('Admin accounts cannot be deleted.', 403);

  await Promise.all([
    DoctorProfile.deleteOne({ user: user._id }),
    Appointment.deleteMany({ $or: [{ patient: user._id }, { doctor: user._id }] }),
    Prescription.deleteMany({ $or: [{ patient: user._id }, { doctor: user._id }] }),
  ]);
  await user.deleteOne();

  res.json({ success: true, message: 'User and related records deleted.' });
});

module.exports = { getStats, listUsers, createUser, updateUser, deleteUser };
