const Workout = require('../models/Workout');
const Post    = require('../models/Post');

// ─────────────────────────────────────────────────────────────
// @desc    Create a new workout session
// @route   POST /api/workouts
// @access  Private
// ─────────────────────────────────────────────────────────────
const createWorkout = async (req, res) => {
    try {
        const { title, exercises, durationMinutes, notes, date } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Workout title is required' });
        }

        if (!exercises || exercises.length === 0) {
            return res.status(400).json({ message: 'At least one exercise is required' });
        }

        // Create the workout
        const workout = await Workout.create({
            user:            req.user._id,
            title,
            exercises,
            durationMinutes: durationMinutes || 0,
            notes:           notes || '',
            date:            date || Date.now(),
        });

        // Auto-create a social feed post for this workout
        await Post.create({
            user:     req.user._id,
            postType: 'workout',
            workout:  workout._id,
            caption:  notes || '',
        });

        // Populate exercise details before sending response
        const populatedWorkout = await Workout.findById(workout._id)
            .populate('exercises.exercise', 'name muscleGroup');

        res.status(201).json(populatedWorkout);

    } catch (error) {
        console.error('Create workout error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Get all workouts for a user
// @route   GET /api/workouts/user/:userId
// @access  Private
// ─────────────────────────────────────────────────────────────
const getUserWorkouts = async (req, res) => {
    try {
        const workouts = await Workout.find({ user: req.params.userId })
            .populate('exercises.exercise', 'name muscleGroup')
            .sort({ date: -1 });   // newest first

        res.status(200).json(workouts);

    } catch (error) {
        console.error('Get workouts error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Get single workout by ID
// @route   GET /api/workouts/:id
// @access  Private
// ─────────────────────────────────────────────────────────────
const getWorkoutById = async (req, res) => {
    try {
        const workout = await Workout.findById(req.params.id)
            .populate('exercises.exercise', 'name muscleGroup description');

        if (!workout) {
            return res.status(404).json({ message: 'Workout not found' });
        }

        res.status(200).json(workout);

    } catch (error) {
        console.error('Get workout error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Update a workout
// @route   PUT /api/workouts/:id
// @access  Private
// ─────────────────────────────────────────────────────────────
const updateWorkout = async (req, res) => {
    try {
        const workout = await Workout.findById(req.params.id);

        if (!workout) {
            return res.status(404).json({ message: 'Workout not found' });
        }

        // Only owner can update
        if (workout.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this workout' });
        }

        const { title, exercises, durationMinutes, notes, date } = req.body;

        if (title)                             workout.title           = title;
        if (exercises && exercises.length > 0) workout.exercises       = exercises;
        if (durationMinutes !== undefined)     workout.durationMinutes = durationMinutes;
        if (notes !== undefined)               workout.notes           = notes;
        if (date)                              workout.date            = date;

        const updatedWorkout = await workout.save();

        const populatedWorkout = await Workout.findById(updatedWorkout._id)
            .populate('exercises.exercise', 'name muscleGroup');

        res.status(200).json(populatedWorkout);

    } catch (error) {
        console.error('Update workout error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Delete a workout
// @route   DELETE /api/workouts/:id
// @access  Private
// ─────────────────────────────────────────────────────────────
const deleteWorkout = async (req, res) => {
    try {
        const workout = await Workout.findById(req.params.id);

        if (!workout) {
            return res.status(404).json({ message: 'Workout not found' });
        }

        // Only owner can delete
        if (workout.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this workout' });
        }

        // Also delete the associated social post
        await Post.findOneAndDelete({ workout: workout._id });

        await workout.deleteOne();
        res.status(200).json({ message: 'Workout deleted successfully' });

    } catch (error) {
        console.error('Delete workout error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Get workout dates for heatmap (returns array of dates)
// @route   GET /api/workouts/heatmap/:userId
// @access  Private
// ─────────────────────────────────────────────────────────────
const getWorkoutHeatmap = async (req, res) => {
    try {
        const workouts = await Workout.find(
            { user: req.params.userId },
            { date: 1, _id: 0 }          // only return the date field
        ).sort({ date: 1 });

        // Return just an array of date strings for the frontend heatmap
        const dates = workouts.map((w) =>
            new Date(w.date).toISOString().split('T')[0]   // format: 'YYYY-MM-DD'
        );

        res.status(200).json(dates);

    } catch (error) {
        console.error('Heatmap error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createWorkout,
    getUserWorkouts,
    getWorkoutById,
    updateWorkout,
    deleteWorkout,
    getWorkoutHeatmap,
};