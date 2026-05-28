const Exercise = require('../models/Exercise');

// ─────────────────────────────────────────────────────────────
// @desc    Get all exercises (filterable by muscle group)
// @route   GET /api/exercises
// @access  Private
// ─────────────────────────────────────────────────────────────
const getExercises = async (req, res) => {
    try {
        const filter = {};

        // If muscleGroup query param is provided, filter by it
        if (req.query.muscleGroup) {
            filter.muscleGroup = req.query.muscleGroup;
        }

        // Show system exercises + exercises created by the logged-in user
        filter.$or = [
            { isCustom: false },
            { isCustom: true, createdBy: req.user._id }
        ];

        const exercises = await Exercise.find(filter).sort({ muscleGroup: 1, name: 1 });
        res.status(200).json(exercises);

    } catch (error) {
        console.error('Get exercises error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Get single exercise by ID
// @route   GET /api/exercises/:id
// @access  Private
// ─────────────────────────────────────────────────────────────
const getExerciseById = async (req, res) => {
    try {
        const exercise = await Exercise.findById(req.params.id);

        if (!exercise) {
            return res.status(404).json({ message: 'Exercise not found' });
        }

        res.status(200).json(exercise);

    } catch (error) {
        console.error('Get exercise error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Create a custom exercise
// @route   POST /api/exercises
// @access  Private
// ─────────────────────────────────────────────────────────────
const createExercise = async (req, res) => {
    try {
        const { name, muscleGroup, description } = req.body;

        if (!name || !muscleGroup) {
            return res.status(400).json({ message: 'Name and muscle group are required' });
        }

        // Check if exercise with same name already exists
        const existing = await Exercise.findOne({
            name: { $regex: `^${name}$`, $options: 'i' },
            createdBy: req.user._id
        });

        if (existing) {
            return res.status(400).json({ message: 'You already have an exercise with this name' });
        }

        const exercise = await Exercise.create({
            name,
            muscleGroup,
            description: description || '',
            isCustom:   true,
            createdBy:  req.user._id,
        });

        res.status(201).json(exercise);

    } catch (error) {
        console.error('Create exercise error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


// ─────────────────────────────────────────────────────────────
// @desc    Delete a custom exercise
// @route   DELETE /api/exercises/:id
// @access  Private
// ─────────────────────────────────────────────────────────────
const deleteExercise = async (req, res) => {
    try {
        const exercise = await Exercise.findById(req.params.id);

        if (!exercise) {
            return res.status(404).json({ message: 'Exercise not found' });
        }

        // Only the creator can delete their custom exercise
        if (!exercise.isCustom || exercise.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this exercise' });
        }

        await exercise.deleteOne();
        res.status(200).json({ message: 'Exercise deleted successfully' });

    } catch (error) {
        console.error('Delete exercise error:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getExercises, getExerciseById, createExercise, deleteExercise };