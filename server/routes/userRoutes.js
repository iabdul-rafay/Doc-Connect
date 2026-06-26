const express = require('express');
const { updateProfile, updateAvatar, changePassword, toggleFavorite, listFavorites } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect);

router.put('/me', updateProfile);
router.put('/me/avatar', upload.single('profileImage'), updateAvatar);
router.put('/me/password', changePassword);
router.get('/me/favorites', listFavorites);
router.post('/me/favorites/:doctorId', toggleFavorite);

module.exports = router;
