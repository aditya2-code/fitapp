const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,       // who receives this
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,       // who triggered it
    },
    type: {
      type: String,
      required: true,
      enum: [
        'new_follower',       // someone followed you
        'post_like',          // someone liked your post
        'post_comment',       // someone commented on your post
        'workout_reminder',   // system: log your workout
        'meal_reminder',      // system: log your meal
        'challenge_update',   // leaderboard position changed
      ],
    },

    // ID of the related content (e.g. Post ID for a like notification)
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    message: {
      type: String,
      default: '',          // e.g. "Alex liked your workout"
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);