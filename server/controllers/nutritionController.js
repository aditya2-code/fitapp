const FoodLog = require('../models/FoodLog');
const axios   = require('axios');

// ─────────────────────────────────────────────────────────────
// @desc    Search for food items via USDA FoodData Central API
// @route   GET /api/nutrition/search?q=
// @access  Private
// ─────────────────────────────────────────────────────────────
const searchFood = async (req, res) => {
    try {
        const query = req.query.q;

        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const response = await axios.get(
            'https://api.nal.usda.gov/fdc/v1/foods/search',
            {
                params: {
                    query:       query,
                    api_key:     process.env.USDA_API_KEY,
                    dataType:    'SR Legacy,Survey (FNDDS)',  // most reliable nutrient data
                    pageSize:    15,                          // limit to 15 results
                },
            }
        );

        if (!response.data.foods || response.data.foods.length === 0) {
            return res.status(200).json([]);
        }

        // Helper to extract a specific nutrient value by nutrient number
        const getNutrient = (nutrients, number) => {
            const found = nutrients.find((n) => n.nutrientNumber === number);
            return found ? Math.round(found.value || 0) : 0;
        };

        // Clean and format the response
        const foods = response.data.foods.map((food) => ({
            fdcId:       food.fdcId,
            label:       food.description,
            category:    food.foodCategory || 'General',
            // All nutrient values are per 100g
            nutrients: {
                calories: getNutrient(food.foodNutrients, '208'),  // Energy kcal
                protein:  getNutrient(food.foodNutrients, '203'),  // Protein
                fat:      getNutrient(food.foodNutrients, '204'),  // Total Fat
                carbs:    getNutrient(food.foodNutrients, '205'),  // Carbohydrates
            },
        }));

        res.status(200).json(foods);

    } catch (error) {
        console.error('Food search error:', error.message);
        res.status(500).json({ message: 'Error fetching food data from USDA' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Log a food item to a user's daily log
// @route   POST /api/nutrition/log
// @access  Private
// ─────────────────────────────────────────────────────────────
const logFood = async (req, res) => {
    try {
        const {
            date,
            mealType,
            foodName,
            quantity,
            unit,
            calories,
            protein,
            carbohydrates,
            fat,
        } = req.body;

        // Validate required fields
        if (!date || !mealType || !foodName || !quantity) {
            return res.status(400).json({
                message: 'Date, meal type, food name and quantity are required',
            });
        }

        // Validate meal type
        const validMeals = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
        if (!validMeals.includes(mealType)) {
            return res.status(400).json({
                message: 'Meal type must be Breakfast, Lunch, Dinner or Snacks',
            });
        }

        // USDA nutrients are per 100g so we scale by quantity
        const factor = quantity / 100;

        const entry = await FoodLog.create({
            user:          req.user._id,
            date,
            mealType,
            foodName,
            quantity,
            unit:          unit          || 'g',
            calories:      calories      ? Math.round(calories      * factor) : 0,
            protein:       protein       ? Math.round(protein       * factor) : 0,
            carbohydrates: carbohydrates ? Math.round(carbohydrates * factor) : 0,
            fat:           fat           ? Math.round(fat           * factor) : 0,
        });

        res.status(201).json(entry);

    } catch (error) {
        console.error('Log food error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Get all food entries for a user on a specific date
// @route   GET /api/nutrition/log/:userId/:date
// @access  Private
// ─────────────────────────────────────────────────────────────
const getDailyLog = async (req, res) => {
    try {
        const { userId, date } = req.params;

        const entries = await FoodLog.find({ user: userId, date }).sort({
            createdAt: 1,
        });

        // Group entries by meal type
        const grouped = {
            Breakfast: [],
            Lunch:     [],
            Dinner:    [],
            Snacks:    [],
        };

        entries.forEach((entry) => {
            grouped[entry.mealType].push(entry);
        });

        // Calculate daily macro totals
        const totals = entries.reduce(
            (acc, entry) => {
                acc.calories      += entry.calories;
                acc.protein       += entry.protein;
                acc.carbohydrates += entry.carbohydrates;
                acc.fat           += entry.fat;
                return acc;
            },
            { calories: 0, protein: 0, carbohydrates: 0, fat: 0 }
        );

        res.status(200).json({
            date,
            grouped,    // broken down by meal — powers the daily log UI
            totals,     // daily summary — powers the macro pie chart
        });

    } catch (error) {
        console.error('Get daily log error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Delete a food log entry
// @route   DELETE /api/nutrition/log/:entryId
// @access  Private
// ─────────────────────────────────────────────────────────────
const deleteFoodEntry = async (req, res) => {
    try {
        const entry = await FoodLog.findById(req.params.entryId);

        if (!entry) {
            return res.status(404).json({ message: 'Food entry not found' });
        }

        if (entry.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this entry' });
        }

        await entry.deleteOne();
        res.status(200).json({ message: 'Food entry deleted successfully' });

    } catch (error) {
        console.error('Delete food entry error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Get nutrition summary for a date range (for charts)
// @route   GET /api/nutrition/summary/:userId?startDate=&endDate=
// @access  Private
// ─────────────────────────────────────────────────────────────
const getNutritionSummary = async (req, res) => {
    try {
        const { userId }             = req.params;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'startDate and endDate are required' });
        }

        const entries = await FoodLog.find({
            user: userId,
            date: { $gte: startDate, $lte: endDate },
        });

        // Group totals by date for chart rendering
        const summaryMap = {};

        entries.forEach((entry) => {
            if (!summaryMap[entry.date]) {
                summaryMap[entry.date] = {
                    calories: 0, protein: 0, carbohydrates: 0, fat: 0,
                };
            }
            summaryMap[entry.date].calories      += entry.calories;
            summaryMap[entry.date].protein       += entry.protein;
            summaryMap[entry.date].carbohydrates += entry.carbohydrates;
            summaryMap[entry.date].fat           += entry.fat;
        });

        // Convert to sorted array for Chart.js
        const summary = Object.entries(summaryMap)
            .map(([date, macros]) => ({ date, ...macros }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        res.status(200).json(summary);

    } catch (error) {
        console.error('Nutrition summary error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    searchFood,
    logFood,
    getDailyLog,
    deleteFoodEntry,
    getNutritionSummary,
};