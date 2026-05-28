const express  = require('express');
const router   = express.Router();
const {
    getExercises,
    getExerciseById,
    createExercise,
    deleteExercise,
} = require('../controllers/exerciseController');
const { protect } = require('../middleware/authMiddleware');

router.get('/',    protect, getExercises);         // GET /api/exercises
router.get('/:id', protect, getExerciseById);      // GET /api/exercises/:id
router.post('/',   protect, createExercise);       // POST /api/exercises
router.delete('/:id', protect, deleteExercise);    // DELETE /api/exercises/:id

module.exports = router;