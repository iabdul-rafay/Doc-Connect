/**
 * controllers/prescriptionController.js
 * Doctors write prescriptions (diagnosis + medicines); both sides can read them.
 * Read endpoints also attach `doctorMeta` (specialization/qualifications/hospital)
 * so the client can render a proper prescription letterhead / PDF.
 */
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');
const notify = require('../utils/notify');

// POST /api/v1/prescriptions  (doctor)
const createPrescription = asyncHandler(async (req, res) => {
  const { appointmentId, patientId, diagnosis, medicines, advice, followUpDate } = req.body;

  if (!Array.isArray(medicines) || medicines.length === 0) {
    throw new AppError('Add at least one medicine to the prescription.', 400);
  }
  const cleaned = medicines
    .filter((m) => m && m.name && m.name.trim())
    .map((m) => ({
      name: m.name.trim(),
      dosage: m.dosage || '',
      frequency: m.frequency || '',
      duration: m.duration || '',
      instructions: m.instructions || '',
    }));
  if (cleaned.length === 0) throw new AppError('Each medicine needs at least a name.', 400);

  let patient = patientId;
  let appointment = null;

  if (appointmentId) {
    appointment = await Appointment.findOne({ _id: appointmentId, doctor: req.user._id });
    if (!appointment) throw new AppError('Appointment not found.', 404);
    patient = appointment.patient;
  }
  if (!patient) throw new AppError('A patient is required for the prescription.', 400);

  const prescription = await Prescription.create({
    appointment: appointment ? appointment._id : undefined,
    patient,
    doctor: req.user._id,
    diagnosis: diagnosis || '',
    medicines: cleaned,
    advice: advice || '',
    followUpDate: followUpDate || '',
  });

  if (appointment) {
    appointment.hasPrescription = true;
    if (appointment.status === 'confirmed') appointment.status = 'completed';
    await appointment.save();
  }

  await notify(patient, {
    type: 'prescription',
    title: 'New prescription',
    message: ` added a new prescription for you.`,
    link: '/patient/prescriptions',
  });
  res.status(201).json({ success: true, message: 'Prescription saved.', prescription });
});

// GET /api/v1/prescriptions/mine  (patient)
const myPrescriptions = asyncHandler(async (req, res) => {
  const prescriptions = await Prescription.find({ patient: req.user._id })
    .populate('doctor', 'name email avatar')
    .sort({ createdAt: -1 })
    .lean();

  const ids = [...new Set(prescriptions.map((p) => String(p.doctor?._id)).filter(Boolean))];
  const profiles = await DoctorProfile.find({ user: { $in: ids } })
    .select('user specialization qualifications hospital fee')
    .lean();
  const byUser = Object.fromEntries(profiles.map((p) => [String(p.user), p]));
  prescriptions.forEach((p) => {
    p.doctorMeta = p.doctor ? byUser[String(p.doctor._id)] || null : null;
  });

  res.json({ success: true, count: prescriptions.length, prescriptions });
});

// GET /api/v1/prescriptions/doctor  (doctor)
const doctorPrescriptions = asyncHandler(async (req, res) => {
  const prescriptions = await Prescription.find({ doctor: req.user._id })
    .populate('patient', 'name email avatar phone city')
    .sort({ createdAt: -1 })
    .lean();

  const profile = await DoctorProfile.findOne({ user: req.user._id })
    .select('specialization qualifications hospital fee')
    .lean();
  prescriptions.forEach((p) => {
    p.doctorMeta = profile || null;
  });

  res.json({ success: true, count: prescriptions.length, prescriptions });
});

module.exports = { createPrescription, myPrescriptions, doctorPrescriptions };
