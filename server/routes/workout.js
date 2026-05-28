const express  = require('express');
const router   = express.Router();
const {
    createWorkout,
    getUserWorkouts,
    getWorkoutById,
    updateWorkout,
    deleteWorkout,
    getWorkoutHeatmap,
} = require('../controllers/workoutController');
const { protect } = require('../middleware/authMiddleware');

router.post('/',                   protect, createWorkout);      // POST /api/workouts
router.get('/user/:userId',        protect, getUserWorkouts);    // GET /api/workouts/user/:userId
router.get('/heatmap/:userId',     protect, getWorkoutHeatmap);  // GET /api/workouts/heatmap/:userId
router.get('/:id',                 protect, getWorkoutById);     // GET /api/workouts/:id
router.put('/:id',                 protect, updateWorkout);      // PUT /api/workouts/:id
router.delete('/:id',              protect, deleteWorkout);      // DELETE /api/workouts/:id

module.exports = router;