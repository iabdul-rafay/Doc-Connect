/**
 * models/Notification.js
 * An in-app notification for a single recipient (patient/doctor/admin).
 */
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, default: 'info' }, // appointment | prescription | review | info
    title: { type: String, required: true },
    message: { type: String, default: '' },
    link: { type: String, default: '' }, // in-app route to open
    read: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { transform: (_d, r) => (delete r.__v, r) } }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
