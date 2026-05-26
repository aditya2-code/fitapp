const mongoose = require('mongoose');

// One entry per participant with their running score
const participantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  score: {
    type: Number,
    default: 0,             // recalculated each time they log a qualifying workout
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

const challengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Challenge title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── What metric determines the winner ──────────────
    metric: {
      type: String,
      enum: ['total_workouts', 'total_minutes', 'challenge_points'],
      default: 'total_workouts',
    },

    // ── Challenge timeline ─────────────────────────────
    startDate: { type: Date, required: true },
    endDate:   { type: Date, required: true },
    isActive:  { type: Boolean, default: true },

    participants: [participantSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Challenge', challengeSchema);