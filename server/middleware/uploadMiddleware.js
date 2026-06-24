/**
 * middleware/uploadMiddleware.js
 * Stores uploaded avatars under /uploads/profiles with a size + type guard.
 */
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { AppError } = require('./errorMiddleware');

const dir = path.join(__dirname, '..', 'uploads', 'profiles');
fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dir),
  filename: (req, file, cb) =>
    cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    if (/^image\/(png|jpe?g|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new AppError('Only PNG, JPG, or WEBP images are allowed.', 400));
  },
});

module.exports = upload;
