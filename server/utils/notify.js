/**
 * utils/notify.js
 * Fire-and-forget helper to create an in-app notification. Never throws — a
 * failed notification must not break the action that triggered it.
 */
const Notification = require('../models/Notification');

module.exports = async function notify(userId, { type = 'info', title, message = '', link = '' }) {
  try {
    if (!userId || !title) return;
    await Notification.create({ user: userId, type, title, message, link });
  } catch (err) {
    console.error('notify failed:', err.message);
  }
};
