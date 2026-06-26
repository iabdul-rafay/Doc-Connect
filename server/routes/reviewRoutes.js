const express = require('express');
const { createReview, getDoctorReviews, myReviews } = require('../controllers/reviewController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/doctor/:id', getDoctorReviews); // public
router.post('/', protect, restrictTo('patient'), createReview);
router.get('/mine', protect, restrictTo('patient'), myReviews);

module.exports = router;
