const mongoose = require('mongoose');

// Individual comment on a post
const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── What triggered this post ───────────────────────
    postType: {
      type: String,
      enum: ['workout', 'achievement', 'status'],
      default: 'workout',
    },
    workout: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workout',
      default: null,        // linked when postType is 'workout'
    },
    caption: {
      type: String,
      default: '',
      trim: true,
    },

    // ── Social interactions ────────────────────────────
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);