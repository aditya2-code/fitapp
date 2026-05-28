const express = require('express');
const router  = express.Router();
const {
    searchFood,
    logFood,
    getDailyLog,
    deleteFoodEntry,
    getNutritionSummary,
} = require('../controllers/nutritionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/search',            protect, searchFood);           // GET  /api/nutrition/search?q=
router.post('/log',              protect, logFood);              // POST /api/nutrition/log
router.get('/log/:userId/:date', protect, getDailyLog);          // GET  /api/nutrition/log/:userId/:date
router.delete('/log/:entryId',   protect, deleteFoodEntry);      // DELETE /api/nutrition/log/:entryId
router.get('/summary/:userId',   protect, getNutritionSummary);  // GET  /api/nutrition/summary/:userId

module.exports = router;