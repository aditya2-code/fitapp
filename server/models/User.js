const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    profilePicture: {
      type: String,         // Cloudinary URL
      default: '',
    },

    // ── Fitness Goals ──────────────────────────────────
    fitnessGoals: {
      type: [String],       // ['strength', 'endurance', 'muscle-ups']
      default: [],
    },

    // ── Physical Metrics ───────────────────────────────
    metrics: {
      weight: { type: Number, default: 0 },   // kg
      height: { type: Number, default: 0 },   // cm
    },

    // ── Social Graph ───────────────────────────────────
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // ── Push Notifications ─────────────────────────────
    fcmToken: {
      type: String,
      default: '',          // Firebase token, added in Phase 8
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);