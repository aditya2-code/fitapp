import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import { useAuth }             from '../../context/AuthContext';
import { workoutAPI, nutritionAPI } from '../../api';
import Spinner from '../../components/common/Spinner';
import toast   from 'react-hot-toast';

// ── Heatmap Component ──────────────────────────────────────────
const WorkoutHeatmap = ({ dates }) => {
    const today      = new Date();
    const cells      = [];
    const dateSet    = new Set(dates);

    for (let i = 83; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toISOString().split('T')[0];
        cells.push({ key, worked: dateSet.has(key) });
    }

    return (
        <div className="flex flex-wrap gap-1">
            {cells.map((cell) => (
                <div
                    key={cell.key}
                    title={cell.key}
                    className={`w-4 h-4 rounded-sm transition ${
                        cell.worked ? 'bg-primary' : 'bg-dark'
                    }`}
                />
            ))}
        </div>
    );
};

// ── Stat Card ──────────────────────────────────────────────────
const StatCard = ({ label, value, icon, color }) => (
    <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">{label}</span>
            <span className="text-2xl">{icon}</span>
        </div>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
);

// ── Main Dashboard ─────────────────────────────────────────────
const DashboardPage = () => {
    const { user }                     = useAuth();
    const navigate                     = useNavigate();
    const [recentWorkouts, setRecent]  = useState([]);
    const [heatmapDates,   setHeatmap] = useState([]);
    const [todayNutrition, setToday]   = useState(null);
    const [loading,        setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const today = new Date().toISOString().split('T')[0];

                const [workoutsRes, heatmapRes, nutritionRes] = await Promise.all([
                    workoutAPI.getUserWorkouts(user._id),
                    workoutAPI.getHeatmap(user._id),
                    nutritionAPI.getDailyLog(user._id, today),
                ]);

                setRecent(workoutsRes.data.slice(0, 3));
                setHeatmap(heatmapRes.data);
                setToday(nutritionRes.data.totals);
            } catch (error) {
                toast.error('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [user._id]);

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">
                    Good {new Date().getHours() < 12 ? 'Morning' : 'Evening'},{' '}
                    <span className="text-primary">{user?.name?.split(' ')[0]}</span> 👋
                </h1>
                <p className="text-slate-400 mt-1">
                    {new Date().toLocaleDateString('en-US', {
                        weekday: 'long', year: 'numeric',
                        month: 'long',  day: 'numeric',
                    })}
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Calories Today"
                    value={todayNutrition?.calories || 0}
                    icon="🔥"
                    color="text-orange-400"
                />
                <StatCard
                    label="Protein Today"
                    value={`${todayNutrition?.protein || 0}g`}
                    icon="🥩"
                    color="text-red-400"
                />
                <StatCard
                    label="Workouts Logged"
                    value={heatmapDates.length}
                    icon="💪"
                    color="text-primary"
                />
                <StatCard
                    label="Following"
                    value={user?.following?.length || 0}
                    icon="👥"
                    color="text-secondary"
                />
            </div>

            {/* Consistency Heatmap */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">
                        Workout Consistency
                    </h2>
                    <span className="text-slate-400 text-sm">Last 84 days</span>
                </div>
                <WorkoutHeatmap dates={heatmapDates} />
                <div className="flex items-center gap-2 mt-3">
                    <span className="text-slate-500 text-xs">Less</span>
                    <div className="w-4 h-4 rounded-sm bg-dark" />
                    <div className="w-4 h-4 rounded-sm bg-primary opacity-50" />
                    <div className="w-4 h-4 rounded-sm bg-primary" />
                    <span className="text-slate-500 text-xs">More</span>
                </div>
            </div>

            {/* Recent Workouts */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Recent Workouts</h2>
                    <button
                        onClick={() => navigate('/workouts')}
                        className="text-primary text-sm hover:underline"
                    >
                        View all →
                    </button>
                </div>

                {recentWorkouts.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-slate-500 mb-4">No workouts logged yet</p>
                        <button
                            onClick={() => navigate('/workouts')}
                            className="bg-primary text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
                        >
                            Log First Workout
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentWorkouts.map((workout) => (
                            <div
                                key={workout._id}
                                className="flex items-center justify-between p-4 bg-dark rounded-xl border border-border hover:border-primary transition cursor-pointer"
                                onClick={() => navigate('/workouts')}
                            >
                                <div>
                                    <p className="text-white font-medium">{workout.title}</p>
                                    <p className="text-slate-400 text-sm">
                                        {workout.exercises.length} exercises ·{' '}
                                        {workout.durationMinutes} min
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-400 text-sm">
                                        {new Date(workout.date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Log Workout',    icon: '💪', path: '/workouts'   },
                    { label: 'Track Food',     icon: '🥗', path: '/nutrition'  },
                    { label: 'View Feed',      icon: '📰', path: '/feed'       },
                    { label: 'Challenges',     icon: '🏆', path: '/challenges' },
                ].map((action) => (
                    <button
                        key={action.path}
                        onClick={() => navigate(action.path)}
                        className="bg-card border border-border rounded-xl p-4 hover:border-primary transition text-center"
                    >
                        <div className="text-3xl mb-2">{action.icon}</div>
                        <p className="text-white text-sm font-medium">{action.label}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DashboardPage;