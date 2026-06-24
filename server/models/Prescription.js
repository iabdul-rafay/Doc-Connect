/**
 * models/Prescription.js
 * A prescription a doctor writes for a patient, typically tied to an
 * appointment. Holds a diagnosis plus a list of prescribed medicines.
 */
const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, trim: true, default: '' }, // e.g. "500mg"
    frequency: { type: String, trim: true, default: '' }, // e.g. "Twice a day"
    duration: { type: String, trim: true, default: '' }, // e.g. "5 days"
    instructions: { type: String, trim: true, default: '' }, // e.g. "After meals"
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    diagnosis: { type: String, trim: true, default: '' },
    medicines: {
      type: [medicineSchema],
      validate: [(arr) => arr.length > 0, 'Add at least one medicine'],
    },
    advice: { type: String, trim: true, maxlength: 1000, default: '' },
    followUpDate: { type: String, default: '' }, // YYYY-MM-DD
  },
  { timestamps: true, toJSON: { transform: (_d, r) => (delete r.__v, r) } }
);

prescriptionSchema.index({ patient: 1, createdAt: -1 });
prescriptionSchema.index({ doctor: 1, createdAt: -1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
