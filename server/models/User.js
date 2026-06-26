/**
 * models/User.js
 * Core account for both patients and doctors. The `role` chosen at
 * registration decides which dashboard the account unlocks. Accounts must
 * verify their email (isVerified) before they are allowed to log in.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['patient', 'doctor', 'admin'],
        message: 'Role must be patient, doctor, or admin',
      },
      required: true,
    },
    phone: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    avatar: { type: String, default: '' },

    // ── Email verification ────────────────────────────────────────────────
    isVerified: { type: Boolean, default: false },
    verifyTokenHash: { type: String, select: false },
    verifyTokenExpires: { type: Date, select: false },

    // ── Password reset ────────────────────────────────────────────────────
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },

    lastLogin: { type: Date },

    // Patients can favorite doctors (array of doctor user ids).
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Patient medical record (self-managed; visible to doctors on appointments).
    medical: {
      bloodGroup: { type: String, default: '' },
      dateOfBirth: { type: String, default: '' },
      allergies: { type: String, default: '' },
      conditions: { type: String, default: '' },
      emergencyContact: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.verifyTokenHash;
        delete ret.verifyTokenExpires;
        delete ret.resetTokenHash;
        delete ret.resetTokenExpires;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Hash the password whenever it changes.
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  next();
});

userSchema.methods.matchPassword = function matchPassword(plain) {
  return bcrypt.compare(plain, this.password);
};

/**
 * Create a one-time token, store only its hash, and return the raw token.
 * The raw token is emailed to the user; the hash is what we compare against.
 */
userSchema.methods.issueToken = function issueToken(kind, ttlMs) {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  if (kind === 'verify') {
    this.verifyTokenHash = hash;
    this.verifyTokenExpires = new Date(Date.now() + ttlMs);
  } else {
    this.resetTokenHash = hash;
    this.resetTokenExpires = new Date(Date.now() + ttlMs);
  }
  return raw;
};

userSchema.statics.hashToken = function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
};

module.exports = mongoose.model('User', userSchema);
