/**
 * controllers/notificationController.js
 * List, count, and mark notifications read for the logged-in user.
 */
const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorMiddleware');

// GET /api/v1/notifications
const list = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(40);
  const unread = await Notification.countDocuments({ user: req.user._id, read: false });
  res.json({ success: true, unread, notifications });
});

// GET /api/v1/notifications/unread-count
const unreadCount = asyncHandler(async (req, res) => {
  const unread = await Notification.countDocuments({ user: req.user._id, read: false });
  res.json({ success: true, unread });
});

// PATCH /api/v1/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ success: true });
});

// PATCH /api/v1/notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { read: true });
  res.json({ success: true });
});

module.exports = { list, unreadCount, markAllRead, markRead };
