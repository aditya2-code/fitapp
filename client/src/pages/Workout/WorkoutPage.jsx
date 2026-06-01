import { useState, useEffect, useCallback } from 'react';
import { useAuth }                           from '../../context/AuthContext';
import { workoutAPI, exerciseAPI }           from '../../api';
import Spinner                               from '../../components/common/Spinner';
import toast                                 from 'react-hot-toast';

const MUSCLE_GROUPS = [
    'All','Chest','Back','Legs',
    'Shoulders','Arms','Core','Cardio','Full Body',
];

const WorkoutPage = () => {
    const { user } = useAuth();

    const [workouts,   setWorkouts]   = useState([]);
    const [exercises,  setExercises]  = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [showLogger, setShowLogger] = useState(false);
    const [filter,     setFilter]     = useState('All');

    const [title,    setTitle]    = useState('');
    const [duration, setDuration] = useState('');
    const [notes,    setNotes]    = useState('');
    const [logItems, setLogItems] = useState([
        { exerciseId: '', sets: [{ reps: '', weight: '' }] },
    ]);
    const [saving, setSaving] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [workoutsRes, exercisesRes] = await Promise.all([
                workoutAPI.getUserWorkouts(user._id),
                exerciseAPI.getAll(),
            ]);
            setWorkouts(workoutsRes.data);
            setExercises(exercisesRes.data);
        } catch {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [user._id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const addSet = (itemIdx) => {
        const updated = [...logItems];
        updated[itemIdx].sets.push({ reps: '', weight: '' });
        setLogItems(updated);
    };

    const removeSet = (itemIdx, setIdx) => {
        const updated = [...logItems];
        updated[itemIdx].sets.splice(setIdx, 1);
        setLogItems(updated);
    };

    const updateSet = (itemIdx, setIdx, field, value) => {
        const updated = [...logItems];
        updated[itemIdx].sets[setIdx][field] = value;
        setLogItems(updated);
    };

    const addExercise = () => {
        setLogItems([...logItems, { exerciseId: '', sets: [{ reps: '', weight: '' }] }]);
    };

    const removeExercise = (idx) => {
        setLogItems(logItems.filter((_, i) => i !== idx));
    };

    const updateExercise = (idx, value) => {
        const updated = [...logItems];
        updated[idx].exerciseId = value;
        setLogItems(updated);
    };

    const handleSubmit = async () => {
        if (!title.trim()) return toast.error('Workout title is required');
        if (logItems.some((item) => !item.exerciseId))
            return toast.error('Please select an exercise for each row');

        setSaving(true);
        try {
            const payload = {
                title,
                durationMinutes: parseInt(duration) || 0,
                notes,
                exercises: logItems.map((item) => ({
                    exercise: item.exerciseId,
                    sets:     item.sets.map((s) => ({
                        reps:   parseInt(s.reps)    || 0,
                        weight: parseFloat(s.weight) || 0,
                    })),
                })),
            };

            const res = await workoutAPI.create(payload);
            setWorkouts([res.data, ...workouts]);
            setShowLogger(false);
            resetForm();
            toast.success('Workout logged! 💪');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save workout');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setTitle(''); setDuration(''); setNotes('');
        setLogItems([{ exerciseId: '', sets: [{ reps: '', weight: '' }] }]);
    };

    const handleDelete = async (id) => {
        try {
            await workoutAPI.delete(id);
            setWorkouts(workouts.filter((w) => w._id !== id));
            toast.success('Workout deleted');
        } catch {
            toast.error('Failed to delete workout');
        }
    };

    const filteredExercises = filter === 'All'
        ? exercises
        : exercises.filter((e) => e.muscleGroup === filter);

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">💪 Workouts</h1>
                <button
                    onClick={() => setShowLogger(!showLogger)}
                    className="bg-primary text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
                >
                    {showLogger ? 'Cancel' : '+ Log Workout'}
                </button>
            </div>

            {/* Workout Logger Form */}
            {showLogger && (
                <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                    <h2 className="text-xl font-semibold text-white">New Workout Session</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-slate-400 text-sm mb-1">
                                Session Title *
                            </label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Push Day"
                                className="w-full bg-dark border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-sm mb-1">
                                Duration (minutes)
                            </label>
                            <input
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                placeholder="e.g. 60"
                                className="w-full bg-dark border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    {/* Muscle Group Filter */}
                    <div>
                        <label className="block text-slate-400 text-sm mb-2">
                            Filter by muscle group
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {MUSCLE_GROUPS.map((mg) => (
                                <button
                                    key={mg}
                                    onClick={() => setFilter(mg)}
                                    className={`px-3 py-1 rounded-full text-xs border transition ${
                                        filter === mg
                                            ? 'bg-primary border-primary text-white'
                                            : 'bg-dark border-border text-slate-400 hover:border-primary'
                                    }`}
                                >
                                    {mg}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Exercise Rows */}
                    <div className="space-y-4">
                        {logItems.map((item, itemIdx) => (
                            <div
                                key={itemIdx}
                                className="bg-dark border border-border rounded-xl p-4 space-y-3"
                            >
                                <div className="flex items-center gap-3">
                                    <select
                                        value={item.exerciseId}
                                        onChange={(e) => updateExercise(itemIdx, e.target.value)}
                                        className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                                    >
                                        <option value="">Select exercise...</option>
                                        {filteredExercises.map((ex) => (
                                            <option key={ex._id} value={ex._id}>
                                                {ex.name} ({ex.muscleGroup})
                                            </option>
                                        ))}
                                    </select>
                                    {logItems.length > 1 && (
                                        <button
                                            onClick={() => removeExercise(itemIdx)}
                                            className="text-red-400 hover:text-red-300 text-xl"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>

                                {/* Sets */}
                                <div className="space-y-2">
                                    <div className="grid grid-cols-4 gap-2 text-slate-500 text-xs px-1">
                                        <span>Set</span>
                                        <span>Reps</span>
                                        <span>Weight (kg)</span>
                                        <span></span>
                                    </div>
                                    {item.sets.map((set, setIdx) => (
                                        <div key={setIdx} className="grid grid-cols-4 gap-2 items-center">
                                            <span className="text-slate-400 text-sm text-center">
                                                {setIdx + 1}
                                            </span>
                                            <input
                                                type="number"
                                                value={set.reps}
                                                onChange={(e) =>
                                                    updateSet(itemIdx, setIdx, 'reps', e.target.value)
                                                }
                                                placeholder="10"
                                                className="bg-card border border-border rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-primary"
                                            />
                                            <input
                                                type="number"
                                                value={set.weight}
                                                onChange={(e) =>
                                                    updateSet(itemIdx, setIdx, 'weight', e.target.value)
                                                }
                                                placeholder="0"
                                                className="bg-card border border-border rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-primary"
                                            />
                                            {item.sets.length > 1 && (
                                                <button
                                                    onClick={() => removeSet(itemIdx, setIdx)}
                                                    className="text-red-400 text-sm hover:text-red-300"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => addSet(itemIdx)}
                                    className="text-primary text-sm hover:underline"
                                >
                                    + Add Set
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addExercise}
                        className="w-full border border-dashed border-border text-slate-400 py-3 rounded-xl hover:border-primary hover:text-primary transition"
                    >
                        + Add Exercise
                    </button>

                    <div>
                        <label className="block text-slate-400 text-sm mb-1">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="How did it feel?"
                            rows={2}
                            className="w-full bg-dark border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary resize-none"
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? <Spinner size="sm" /> : '💾 Save Workout'}
                    </button>
                </div>
            )}

            {/* Workout History */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">
                    History ({workouts.length})
                </h2>

                {workouts.length === 0 ? (
                    <div className="bg-card border border-border rounded-2xl p-12 text-center">
                        <p className="text-slate-500 text-lg mb-4">No workouts yet</p>
                        <button
                            onClick={() => setShowLogger(true)}
                            className="bg-primary text-white px-8 py-3 rounded-lg hover:opacity-90 transition"
                        >
                            Log Your First Workout
                        </button>
                    </div>
                ) : (
                    workouts.map((workout) => (
                        <div
                            key={workout._id}
                            className="bg-card border border-border rounded-2xl p-5"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-white font-semibold text-lg">
                                        {workout.title}
                                    </h3>
                                    <p className="text-slate-400 text-sm mt-1">
                                        📅 {new Date(workout.date).toLocaleDateString()} ·
                                        ⏱ {workout.durationMinutes} min ·
                                        🏋️ {workout.exercises.length} exercises
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDelete(workout._id)}
                                    className="text-slate-500 hover:text-red-400 transition text-sm"
                                >
                                    🗑
                                </button>
                            </div>

                            <div className="mt-4 space-y-2">
                                {workout.exercises.map((ex, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between bg-dark rounded-lg px-4 py-2"
                                    >
                                        <span className="text-white text-sm">
                                            {ex.exercise?.name || 'Exercise'}
                                        </span>
                                        <span className="text-slate-400 text-xs">
                                            {ex.sets.length} sets ·{' '}
                                            {ex.sets.reduce((a, s) => a + (s.reps || 0), 0)} total reps
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {workout.notes && (
                                <p className="text-slate-400 text-sm mt-3 italic">
                                    "{workout.notes}"
                                </p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default WorkoutPage;