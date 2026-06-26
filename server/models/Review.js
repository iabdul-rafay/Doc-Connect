/**
 * models/Review.js
 * A patient's star rating + comment for a doctor, tied to a completed
 * appointment. One review per appointment.
 */
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true, maxlength: 600, default: '' },
  },
  { timestamps: true, toJSON: { transform: (_d, r) => (delete r.__v, r) } }
);

reviewSchema.index({ doctor: 1, createdAt: -1 });
reviewSchema.index({ patient: 1, appointment: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Review', reviewSchema);
