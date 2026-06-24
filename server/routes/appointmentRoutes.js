const express = require('express');
const {
  bookAppointment,
  myAppointments,
  doctorAppointments,
  updateStatus,
  cancelOwn,
  patientStats,
} = require('../controllers/appointmentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// Patient
router.post('/', restrictTo('patient'), bookAppointment);
router.get('/mine', restrictTo('patient'), myAppointments);
router.get('/patient/stats', restrictTo('patient'), patientStats);
router.delete('/:id', restrictTo('patient'), cancelOwn);

// Doctor
router.get('/doctor', restrictTo('doctor'), doctorAppointments);
router.patch('/:id/status', restrictTo('doctor'), updateStatus);

module.exports = router;
