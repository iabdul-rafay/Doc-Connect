/**
 * controllers/reviewController.js
 * Patients review doctors after a completed appointment; anyone can read a
 * doctor's reviews.
 */
const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');
const notify = require('../utils/notify');

// POST /api/v1/reviews  (patient)
const createReview = asyncHandler(async (req, res) => {
  const { doctorId, appointmentId, rating, comment } = req.body;
  if (!doctorId || !rating) throw new AppError('A doctor and a rating are required.', 400);
  if (rating < 1 || rating > 5) throw new AppError('Rating must be between 1 and 5.', 400);

  // Must have at least one completed appointment with this doctor.
  const completed = await Appointment.findOne({
    patient: req.user._id,
    doctor: doctorId,
    status: 'completed',
    ...(appointmentId ? { _id: appointmentId } : {}),
  });
  if (!completed) throw new AppError('You can only review a doctor after a completed visit.', 403);

  try {
    const review = await Review.create({
      doctor: doctorId,
      patient: req.user._id,
      appointment: appointmentId || completed._id,
      rating,
      comment: comment || '',
    });
    await notify(doctorId, {
      type: 'review',
      title: 'New review',
      message: ` left you a -star review.`,
      link: '/doctor/profile',
    });
    res.status(201).json({ success: true, message: 'Thanks for your review!', review });
  } catch (err) {
    if (err.code === 11000) throw new AppError('You have already reviewed this visit.', 409);
    throw err;
  }
});

// GET /api/v1/reviews/doctor/:id  (public)
const getDoctorReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ doctor: req.params.id })
    .populate('patient', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(50);
  const agg = await Review.aggregate([
    { $match: { doctor: require('mongoose').Types.ObjectId.createFromHexString(req.params.id) } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const summary = agg[0] ? { average: Math.round(agg[0].avg * 10) / 10, count: agg[0].count } : { average: 0, count: 0 };
  res.json({ success: true, summary, reviews });
});

// GET /api/v1/reviews/mine  (patient) — which appointments they've reviewed
const myReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ patient: req.user._id }).select('doctor appointment rating');
  res.json({ success: true, reviews });
});

module.exports = { createReview, getDoctorReviews, myReviews };
