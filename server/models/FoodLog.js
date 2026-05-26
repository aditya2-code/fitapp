const mongoose = require('mongoose');

const foodLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String,         // stored as 'YYYY-MM-DD' for easy daily queries
      required: true,
    },
    mealType: {
      type: String,
      required: true,
      enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'],
    },

    // ── Food details from Edamam API ───────────────────
    foodName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      default: 'g',         // 'g', 'oz', 'cup', 'piece'
    },

    // ── Macros (for the logged quantity) ───────────────
    calories:      { type: Number, default: 0 },
    protein:       { type: Number, default: 0 },    // grams
    carbohydrates: { type: Number, default: 0 },    // grams
    fat:           { type: Number, default: 0 },    // grams
  },
  { timestamps: true }
);

module.exports = mongoose.model('FoodLog', foodLogSchema);