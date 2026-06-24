/**
 * models/Appointment.js
 * A booking request from a patient to a doctor. The doctor moves it through
 * pending → confirmed/cancelled, and marks it completed after the visit.
 */
const mongoose = require('mongoose');

const STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    date: { type: String, required: true }, // YYYY-MM-DD
    time: { type: String, required: true }, // HH:MM
    reason: { type: String, trim: true, maxlength: 500, default: '' },

    status: { type: String, enum: STATUSES, default: 'pending' },
    doctorNote: { type: String, trim: true, maxlength: 500, default: '' },

    hasPrescription: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { transform: (_d, r) => (delete r.__v, r) } }
);

appointmentSchema.index({ patient: 1, createdAt: -1 });
appointmentSchema.index({ doctor: 1, createdAt: -1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
module.exports.STATUSES = STATUSES;
