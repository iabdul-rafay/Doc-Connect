const express = require('express');
const {
  createPrescription,
  myPrescriptions,
  doctorPrescriptions,
} = require('../controllers/prescriptionController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', restrictTo('doctor'), createPrescription);
router.get('/doctor', restrictTo('doctor'), doctorPrescriptions);
router.get('/mine', restrictTo('patient'), myPrescriptions);

module.exports = router;
