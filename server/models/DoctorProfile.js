/**
 * models/DoctorProfile.js
 * Professional details for a doctor account. Created/edited from the doctor
 * dashboard. One profile per doctor user.
 */
const mongoose = require('mongoose');

const SPECIALIZATIONS = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Neurologist',
  'Orthopedic Surgeon',
  'Gynecologist',
  'Pediatrician',
  'Psychiatrist',
  'Gastroenterologist',
  'Endocrinologist',
  'Pulmonologist',
  'Ophthalmologist',
  'ENT Specialist',
  'Urologist',
  'Dentist',
];

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const doctorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      enum: SPECIALIZATIONS,
      required: [true, 'Specialization is required'],
    },
    qualifications: { type: String, trim: true, default: '' }, // e.g. "MBBS, FCPS"
    licenseNumber: { type: String, trim: true, default: '' },
    hospital: { type: String, trim: true, default: '' },
    experienceYears: { type: Number, min: 0, max: 60, default: 0 },
    fee: { type: Number, min: 0, default: 0 },
    about: { type: String, trim: true, maxlength: 1000, default: '' },

    // Days the doctor accepts appointments + working hours.
    availableDays: {
      type: [String],
      enum: WEEKDAYS,
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },
    startTime: { type: String, default: '09:00' },
    endTime: { type: String, default: '17:00' },

    acceptingPatients: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { transform: (_d, r) => (delete r.__v, r) } }
);

doctorProfileSchema.index({ specialization: 1 });

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
module.exports.SPECIALIZATIONS = SPECIALIZATIONS;
module.exports.WEEKDAYS = WEEKDAYS;
