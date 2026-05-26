const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Exercise name is required'],
      trim: true,
    },
    muscleGroup: {
      type: String,
      required: true,
      enum: [
        'Chest',
        'Back',
        'Legs',
        'Shoulders',
        'Arms',
        'Core',
        'Cardio',
        'Full Body',
      ],
    },
    description: {
      type: String,
      default: '',
    },
    isCustom: {
      type: Boolean,
      default: false,   // false = seeded system exercise | true = user created
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,    // null means it belongs to the system library
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Exercise', exerciseSchema);