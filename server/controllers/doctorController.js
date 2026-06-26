/**
 * controllers/doctorController.js
 * Public doctor directory (search/filter) and the doctor's own profile editing.
 */
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const Review = require('../models/Review');
const mongoose = require('mongoose');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');

// GET /api/v1/doctors  (public) — search + filter by name/specialization/city
const listDoctors = asyncHandler(async (req, res) => {
  const { search = '', specialization = '', city = '' } = req.query;

  const profileFilter = {};
  if (specialization) profileFilter.specialization = specialization;

  let profiles = await DoctorProfile.find(profileFilter).populate({
    path: 'user',
    match: { isVerified: true },
    select: 'name email city avatar phone',
  });

  // Drop profiles whose user didn't match (unverified) and apply text filters.
  profiles = profiles.filter((p) => p.user);
  const term = search.trim().toLowerCase();
  const cityTerm = city.trim().toLowerCase();

  const ratingMap = await ratingsFor(profiles.map((p) => p.user._id));

  const doctors = profiles
    .filter((p) => (term ? p.user.name.toLowerCase().includes(term) : true))
    .filter((p) => (cityTerm ? (p.user.city || '').toLowerCase().includes(cityTerm) : true))
    .map((p) => shapeDoctor(p, ratingMap));

  res.json({ success: true, count: doctors.length, doctors });
});

// Aggregate average rating + count per doctor id, returned as a lookup map.
async function ratingsFor(ids) {
  if (!ids.length) return {};
  const agg = await Review.aggregate([
    { $match: { doctor: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) } } },
    { $group: { _id: '$doctor', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  return Object.fromEntries(
    agg.map((r) => [String(r._id), { average: Math.round(r.avg * 10) / 10, count: r.count }])
  );
}

// GET /api/v1/doctors/:id  (public) — full profile of one doctor (by user id)
const getDoctor = asyncHandler(async (req, res) => {
  const profile = await DoctorProfile.findOne({ user: req.params.id }).populate(
    'user',
    'name email city avatar phone'
  );
  if (!profile || !profile.user) throw new AppError('Doctor not found.', 404);
  const ratingMap = await ratingsFor([profile.user._id]);
  res.json({ success: true, doctor: shapeDoctor(profile, ratingMap) });
});

// GET /api/v1/doctors/me/profile  (doctor)
const getMyProfile = asyncHandler(async (req, res) => {
  let profile = await DoctorProfile.findOne({ user: req.user._id }).populate(
    'user',
    'name email city avatar phone'
  );
  if (!profile) {
    profile = await DoctorProfile.create({ user: req.user._id, specialization: 'General Physician' });
    profile = await profile.populate('user', 'name email city avatar phone');
  }
  res.json({ success: true, doctor: shapeDoctor(profile) });
});

// PUT /api/v1/doctors/me/profile  (doctor)
const updateMyProfile = asyncHandler(async (req, res) => {
  const fields = [
    'specialization', 'qualifications', 'licenseNumber', 'hospital',
    'experienceYears', 'fee', 'about', 'availableDays', 'startTime',
    'endTime', 'acceptingPatients',
  ];
  const updates = {};
  for (const f of fields) if (req.body[f] !== undefined) updates[f] = req.body[f];

  const profile = await DoctorProfile.findOneAndUpdate({ user: req.user._id }, updates, {
    new: true,
    runValidators: true,
    upsert: true,
  }).populate('user', 'name email city avatar phone');

  res.json({ success: true, message: 'Profile updated.', doctor: shapeDoctor(profile) });
});

// GET /api/v1/doctors/me/stats  (doctor)
const getDoctorStats = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;
  const [pending, confirmed, completed, total, prescriptions, patients] = await Promise.all([
    Appointment.countDocuments({ doctor: doctorId, status: 'pending' }),
    Appointment.countDocuments({ doctor: doctorId, status: 'confirmed' }),
    Appointment.countDocuments({ doctor: doctorId, status: 'completed' }),
    Appointment.countDocuments({ doctor: doctorId }),
    Prescription.countDocuments({ doctor: doctorId }),
    Appointment.distinct('patient', { doctor: doctorId }),
  ]);

  res.json({
    success: true,
    stats: {
      pending,
      confirmed,
      completed,
      totalAppointments: total,
      prescriptions,
      uniquePatients: patients.length,
    },
  });
});

// GET /api/v1/doctors/me/patients  (doctor) — everyone who ever booked them
const getMyPatients = asyncHandler(async (req, res) => {
  const ids = await Appointment.distinct('patient', { doctor: req.user._id });
  const patients = await User.find({ _id: { $in: ids } }).select('name email phone city avatar');
  res.json({ success: true, count: patients.length, patients });
});

// GET /api/v1/doctors/meta/specializations  (public)
const getSpecializations = asyncHandler(async (_req, res) => {
  res.json({ success: true, specializations: DoctorProfile.SPECIALIZATIONS });
});

function shapeDoctor(profile, ratingMap = {}) {
  const u = profile.user;
  const r = ratingMap[String(u._id)] || { average: 0, count: 0 };
  return {
    id: u._id,
    profileId: profile._id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    city: u.city,
    avatar: u.avatar,
    specialization: profile.specialization,
    qualifications: profile.qualifications,
    licenseNumber: profile.licenseNumber,
    hospital: profile.hospital,
    experienceYears: profile.experienceYears,
    fee: profile.fee,
    about: profile.about,
    availableDays: profile.availableDays,
    startTime: profile.startTime,
    endTime: profile.endTime,
    acceptingPatients: profile.acceptingPatients,
    rating: r.average,
    reviewCount: r.count,
  };
}

module.exports = {
  listDoctors,
  getDoctor,
  getMyProfile,
  updateMyProfile,
  getDoctorStats,
  getMyPatients,
  getSpecializations,
};
