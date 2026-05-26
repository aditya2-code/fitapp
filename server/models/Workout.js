const mongoose = require('mongoose');

// One set: e.g. 10 reps at 80kg
const setSchema = new mongoose.Schema({
  reps:   { type: Number, required: true },
  weight: { type: Number, default: 0 },     // 0 = bodyweight exercise
});

// One exercise block inside a session
const workoutExerciseSchema = new mongoose.Schema({
  exercise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise',
    required: true,
  },
  sets:  [setSchema],
  notes: { type: String, default: '' },
});

// The full workout session document
const workoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Workout title is required'],
      trim: true,           // e.g. "Push Day", "Leg Day"
    },
    exercises: [workoutExerciseSchema],
    durationMinutes: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,    // used to power the consistency heatmap
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Workout', workoutSchema);