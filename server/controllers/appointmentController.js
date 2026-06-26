/**
 * controllers/appointmentController.js
 * Patients book appointments; doctors confirm/cancel/complete them.
 */
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorMiddleware');
const notify = require('../utils/notify');

// POST /api/v1/appointments  (patient)
const bookAppointment = asyncHandler(async (req, res) => {
  const { doctorId, date, time, reason } = req.body;
  if (!doctorId || !date || !time) {
    throw new AppError('Doctor, date, and time are required to book.', 400);
  }

  const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isVerified: true });
  if (!doctor) throw new AppError('That doctor is not available.', 404);

  // Prevent obvious double-booking of the same slot by the same patient.
  const clash = await Appointment.findOne({
    patient: req.user._id,
    doctor: doctorId,
    date,
    time,
    status: { $in: ['pending', 'confirmed'] },
  });
  if (clash) throw new AppError('You already have a request for this doctor at that time.', 409);

  const appointment = await Appointment.create({
    patient: req.user._id,
    doctor: doctorId,
    date,
    time,
    reason,
  });

  await notify(doctorId, {
    type: 'appointment',
    title: 'New appointment request',
    message: ` requested  at .`,
    link: '/doctor/appointments',
  });
  res.status(201).json({ success: true, message: 'Appointment requested.', appointment });
});

// GET /api/v1/appointments/mine  (patient)
const myAppointments = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({ patient: req.user._id })
    .populate('doctor', 'name email avatar city')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: appointments.length, appointments });
});

// GET /api/v1/appointments/doctor  (doctor)
const doctorAppointments = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { doctor: req.user._id };
  if (status) filter.status = status;

  const appointments = await Appointment.find(filter)
    .populate('patient', 'name email phone avatar city medical')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: appointments.length, appointments });
});

// PATCH /api/v1/appointments/:id/status  (doctor)
const updateStatus = asyncHandler(async (req, res) => {
  const { status, doctorNote } = req.body;
  if (!Appointment.STATUSES.includes(status)) throw new AppError('Invalid status.', 400);

  const appointment = await Appointment.findOne({ _id: req.params.id, doctor: req.user._id });
  if (!appointment) throw new AppError('Appointment not found.', 404);

  appointment.status = status;
  if (doctorNote !== undefined) appointment.doctorNote = doctorNote;
  await appointment.save();

  await notify(appointment.patient, {
    type: 'appointment',
    title: `Appointment `,
    message: ` marked your appointment as .`,
    link: '/patient/appointments',
  });
  res.json({ success: true, message: `Appointment marked ${status}.`, appointment });
});

// DELETE /api/v1/appointments/:id  (patient cancels their own request)
const cancelOwn = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findOne({ _id: req.params.id, patient: req.user._id });
  if (!appointment) throw new AppError('Appointment not found.', 404);
  if (appointment.status === 'completed') {
    throw new AppError('Completed appointments cannot be cancelled.', 400);
  }
  appointment.status = 'cancelled';
  await appointment.save();
  await notify(appointment.doctor, {
    type: 'appointment',
    title: 'Appointment cancelled',
    message: ` cancelled their appointment.`,
    link: '/doctor/appointments',
  });
  res.json({ success: true, message: 'Appointment cancelled.', appointment });
});

// GET /api/v1/appointments/patient/stats  (patient)
const patientStats = asyncHandler(async (req, res) => {
  const patient = req.user._id;
  const [pending, confirmed, completed, total] = await Promise.all([
    Appointment.countDocuments({ patient, status: 'pending' }),
    Appointment.countDocuments({ patient, status: 'confirmed' }),
    Appointment.countDocuments({ patient, status: 'completed' }),
    Appointment.countDocuments({ patient }),
  ]);
  res.json({ success: true, stats: { pending, confirmed, completed, total } });
});

module.exports = {
  bookAppointment,
  myAppointments,
  doctorAppointments,
  updateStatus,
  cancelOwn,
  patientStats,
};
