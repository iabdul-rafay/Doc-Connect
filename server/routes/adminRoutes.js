const express = require('express');
const {
  getStats,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Every admin route requires an authenticated admin.
router.use(protect, restrictTo('admin'));

router.get('/stats', getStats);
router.get('/users', listUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

module.exports = router;
