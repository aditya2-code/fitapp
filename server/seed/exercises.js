const mongoose  = require('mongoose');
const dotenv    = require('dotenv');
const Exercise  = require('../models/Exercise');

dotenv.config();

const exercises = [
    // ── Chest ──────────────────────────────────────────────
    { name: 'Bench Press',            muscleGroup: 'Chest' },
    { name: 'Incline Bench Press',    muscleGroup: 'Chest' },
    { name: 'Decline Bench Press',    muscleGroup: 'Chest' },
    { name: 'Push Up',                muscleGroup: 'Chest' },
    { name: 'Chest Fly',              muscleGroup: 'Chest' },
    { name: 'Cable Crossover',        muscleGroup: 'Chest' },

    // ── Back ───────────────────────────────────────────────
    { name: 'Pull Up',                muscleGroup: 'Back' },
    { name: 'Deadlift',               muscleGroup: 'Back' },
    { name: 'Bent Over Row',          muscleGroup: 'Back' },
    { name: 'Lat Pulldown',           muscleGroup: 'Back' },
    { name: 'Seated Cable Row',       muscleGroup: 'Back' },
    { name: 'T-Bar Row',              muscleGroup: 'Back' },
    { name: 'Face Pull',              muscleGroup: 'Back' },

    // ── Legs ───────────────────────────────────────────────
    { name: 'Squat',                  muscleGroup: 'Legs' },
    { name: 'Leg Press',              muscleGroup: 'Legs' },
    { name: 'Romanian Deadlift',      muscleGroup: 'Legs' },
    { name: 'Lunges',                 muscleGroup: 'Legs' },
    { name: 'Leg Curl',               muscleGroup: 'Legs' },
    { name: 'Leg Extension',          muscleGroup: 'Legs' },
    { name: 'Calf Raise',             muscleGroup: 'Legs' },
    { name: 'Hack Squat',             muscleGroup: 'Legs' },

    // ── Shoulders ──────────────────────────────────────────
    { name: 'Overhead Press',         muscleGroup: 'Shoulders' },
    { name: 'Lateral Raise',          muscleGroup: 'Shoulders' },
    { name: 'Front Raise',            muscleGroup: 'Shoulders' },
    { name: 'Arnold Press',           muscleGroup: 'Shoulders' },
    { name: 'Rear Delt Fly',          muscleGroup: 'Shoulders' },

    // ── Arms ───────────────────────────────────────────────
    { name: 'Barbell Curl',           muscleGroup: 'Arms' },
    { name: 'Hammer Curl',            muscleGroup: 'Arms' },
    { name: 'Tricep Pushdown',        muscleGroup: 'Arms' },
    { name: 'Skull Crushers',         muscleGroup: 'Arms' },
    { name: 'Concentration Curl',     muscleGroup: 'Arms' },
    { name: 'Dips',                   muscleGroup: 'Arms' },

    // ── Core ───────────────────────────────────────────────
    { name: 'Plank',                  muscleGroup: 'Core' },
    { name: 'Crunches',               muscleGroup: 'Core' },
    { name: 'Russian Twist',          muscleGroup: 'Core' },
    { name: 'Hanging Leg Raise',      muscleGroup: 'Core' },
    { name: 'Ab Wheel Rollout',       muscleGroup: 'Core' },

    // ── Cardio ─────────────────────────────────────────────
    { name: 'Running',                muscleGroup: 'Cardio' },
    { name: 'Cycling',                muscleGroup: 'Cardio' },
    { name: 'Jump Rope',              muscleGroup: 'Cardio' },
    { name: 'Rowing Machine',         muscleGroup: 'Cardio' },
    { name: 'Stair Climber',          muscleGroup: 'Cardio' },

    // ── Full Body ──────────────────────────────────────────
    { name: 'Burpees',                muscleGroup: 'Full Body' },
    { name: 'Kettlebell Swing',       muscleGroup: 'Full Body' },
    { name: 'Clean and Press',        muscleGroup: 'Full Body' },
    { name: 'Muscle Up',              muscleGroup: 'Full Body' },
];

const seedExercises = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected for seeding...');

        // Clear existing system exercises before reseeding
        await Exercise.deleteMany({ isCustom: false });
        console.log('Old system exercises cleared');

        await Exercise.insertMany(exercises);
        console.log(`✅ ${exercises.length} exercises seeded successfully`);

        process.exit(0);

    } catch (error) {
        console.error('Seed error:', error.message);
        process.exit(1);
    }
};

seedExercises();