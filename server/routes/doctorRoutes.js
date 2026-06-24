const express = require('express');
const {
  listDoctors,
  getDoctor,
  getMyProfile,
  updateMyProfile,
  getDoctorStats,
  getMyPatients,
  getSpecializations,
} = require('../controllers/doctorController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Public directory + metadata
router.get('/', listDoctors);
router.get('/meta/specializations', getSpecializations);

// Doctor-only (specific routes before the dynamic :id route)
router.get('/me/profile', protect, restrictTo('doctor'), getMyProfile);
router.put('/me/profile', protect, restrictTo('doctor'), updateMyProfile);
router.get('/me/stats', protect, restrictTo('doctor'), getDoctorStats);
router.get('/me/patients', protect, restrictTo('doctor'), getMyPatients);

// Public single doctor (keep last — catch-all dynamic param)
router.get('/:id', getDoctor);

module.exports = router;
