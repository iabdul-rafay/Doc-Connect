const express = require('express');
const { updateProfile, updateAvatar, changePassword } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect);

router.put('/me', updateProfile);
router.put('/me/avatar', upload.single('profileImage'), updateAvatar);
router.put('/me/password', changePassword);

module.exports = router;
