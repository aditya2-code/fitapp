import { useState, useEffect, useCallback } from 'react';
import { useAuth }                           from '../../context/AuthContext';
import { challengeAPI, workoutAPI }          from '../../api';
import Spinner                               from '../../components/common/Spinner';
import toast                                 from 'react-hot-toast';

const METRICS = [
    { value: 'total_workouts',   label: 'Total Workouts',   icon: '💪' },
    { value: 'total_minutes',    label: 'Total Minutes',    icon: '⏱'  },
    { value: 'challenge_points', label: 'Challenge Points', icon: '⭐' },
];

const ChallengesPage = () => {
    const { user } = useAuth();

    const [challenges,   setChallenges]   = useState([]);
    const [leaderboard,  setLeaderboard]  = useState(null);
    const [workouts,     setWorkouts]     = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [showCreate,   setShowCreate]   = useState(false);
    const [activeTab,    setActiveTab]    = useState('all');
    const [selectedChal, setSelectedChal] = useState(null);
    const [submitting,   setSubmitting]   = useState(false);
    const [selectedWkt,  setSelectedWkt]  = useState('');

    const [form, setForm] = useState({
        title: '', description: '',
        metric: 'total_workouts',
        startDate: '', endDate: '',
    });

    const fetchData = useCallback(async () => {
        try {
            const [chalRes, wktRes] = await Promise.all([
                challengeAPI.getAll(),
                workoutAPI.getUserWorkouts(user._id),
            ]);
            setChallenges(chalRes.data);
            setWorkouts(wktRes.data);
        } catch {
            toast.error('Failed to load challenges');
        } finally {
            setLoading(false);
        }
    }, [user._id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreate = async () => {
        if (!form.title || !form.startDate || !form.endDate)
            return toast.error('Title, start and end date are required');
        setSubmitting(true);
        try {
            const res = await challengeAPI.create(form);
            setChallenges([res.data, ...challenges]);
            setShowCreate(false);
            setForm({
                title: '', description: '',
                metric: 'total_workouts',
                startDate: '', endDate: '',
            });
            toast.success('Challenge created!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create');
        } finally {
            setSubmitting(false);
        }
    };

    const handleJoin = async (id) => {
        try {
            await challengeAPI.join(id);
            fetchData();
            toast.success('Joined challenge!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to join');
        }
    };

    const handleLeave = async (id) => {
        try {
            await challengeAPI.leave(id);
            fetchData();
            toast.success('Left challenge');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to leave');
        }
    };

    const handleDelete = async (id) => {
        try {
            await challengeAPI.delete(id);
            setChallenges(challenges.filter((c) => c._id !== id));
            if (selectedChal?._id === id) {
                setSelectedChal(null);
                setLeaderboard(null);
            }
            toast.success('Challenge deleted');
        } catch {
            toast.error('Failed to delete');
        }
    };

    const handleViewLeaderboard = async (challenge) => {
        try {
            setSelectedChal(challenge);
            const res = await challengeAPI.getLeaderboard(challenge._id);
            setLeaderboard(res.data);
        } catch {
            toast.error('Failed to load leaderboard');
        }
    };

    const handleSubmitWorkout = async () => {
        if (!selectedWkt) return toast.error('Select a workout first');
        setSubmitting(true);
        try {
            await challengeAPI.submit(selectedChal._id, { workoutId: selectedWkt });
            const res = await challengeAPI.getLeaderboard(selectedChal._id);
            setLeaderboard(res.data);
            setSelectedWkt('');
            toast.success('Workout submitted! Score updated 🎉');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    const isParticipant = (challenge) =>
        challenge.participants?.some((p) => p.user?._id === user._id);

    const isCreator = (challenge) =>
        challenge.createdBy?._id === user._id;

    const filtered = challenges.filter((c) => {
        if (activeTab === 'mine')   return isParticipant(c);
        if (activeTab === 'active') return c.isActive;
        return true;
    });

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">🏆 Challenges</h1>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="bg-primary text-white px-6 py-2 rounded-lg hover:opacity-90 transition"
                >
                    {showCreate ? 'Cancel' : '+ Create Challenge'}
                </button>
            </div>

            {/* Create Form */}
            {showCreate && (
                <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                    <h2 className="text-white font-semibold text-lg">New Challenge</h2>

                    <div>
                        <label className="block text-slate-400 text-sm mb-1">Title *</label>
                        <input
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="e.g. 30 Day Pull-Up Challenge"
                            className="w-full bg-dark border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-400 text-sm mb-1">Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Describe the challenge..."
                            rows={2}
                            className="w-full bg-dark border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary resize-none"
                        />
                    </div>

                    {/* Metric Selector */}
                    <div>
                        <label className="block text-slate-400 text-sm mb-2">
                            Scoring Metric
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {METRICS.map((m) => (
                                <button
                                    key={m.value}
                                    onClick={() => setForm({ ...form, metric: m.value })}
                                    className={`p-3 rounded-xl border text-center transition ${
                                        form.metric === m.value
                                            ? 'border-primary bg-primary/10 text-white'
                                            : 'border-border bg-dark text-slate-400 hover:border-primary'
                                    }`}
                                >
                                    <div className="text-2xl">{m.icon}</div>
                                    <p className="text-xs mt-1">{m.label}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-slate-400 text-sm mb-1">
                                Start Date *
                            </label>
                            <input
                                type="date"
                                value={form.startDate}
                                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                className="w-full bg-dark border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-sm mb-1">
                                End Date *
                            </label>
                            <input
                                type="date"
                                value={form.endDate}
                                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                                className="w-full bg-dark border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={submitting}
                        className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {submitting ? <Spinner size="sm" /> : '🏆 Create Challenge'}
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Left — Challenge List */}
                <div className="space-y-4">

                    {/* Tabs */}
                    <div className="flex gap-2">
                        {['all', 'active', 'mine'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition capitalize ${
                                    activeTab === tab
                                        ? 'bg-primary border-primary text-white'
                                        : 'bg-dark border-border text-slate-400 hover:border-primary'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {filtered.length === 0 ? (
                        <div className="bg-card border border-border rounded-2xl p-8 text-center">
                            <p className="text-slate-500">No challenges found</p>
                        </div>
                    ) : (
                        filtered.map((challenge) => (
                            <div
                                key={challenge._id}
                                className={`bg-card border rounded-2xl p-5 cursor-pointer transition ${
                                    selectedChal?._id === challenge._id
                                        ? 'border-primary'
                                        : 'border-border hover:border-slate-500'
                                }`}
                                onClick={() => handleViewLeaderboard(challenge)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-white font-semibold">
                                                {challenge.title}
                                            </h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                challenge.isActive
                                                    ? 'bg-secondary/20 text-secondary'
                                                    : 'bg-slate-700 text-slate-400'
                                            }`}>
                                                {challenge.isActive ? 'Active' : 'Ended'}
                                            </span>
                                        </div>
                                        {challenge.description && (
                                            <p className="text-slate-400 text-sm mt-1">
                                                {challenge.description}
                                            </p>
                                        )}
                                        <div className="flex gap-4 mt-2 text-xs text-slate-500 flex-wrap">
                                            <span>
                                                📅 {new Date(challenge.startDate).toLocaleDateString()} -
                                                {new Date(challenge.endDate).toLocaleDateString()}
                                            </span>
                                            <span>
                                                👥 {challenge.participants?.length || 0} participants
                                            </span>
                                        </div>
                                        <div className="mt-2">
                                            <span className="text-xs bg-dark border border-border px-2 py-1 rounded-full text-slate-400">
                                                {METRICS.find(m => m.value === challenge.metric)?.icon}{' '}
                                                {METRICS.find(m => m.value === challenge.metric)?.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div
                                    className="flex gap-2 mt-4"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {isParticipant(challenge) ? (
                                        <>
                                            {!isCreator(challenge) && (
                                                <button
                                                    onClick={() => handleLeave(challenge._id)}
                                                    className="text-xs border border-border text-slate-400 px-3 py-1.5 rounded-lg hover:border-red-400 hover:text-red-400 transition"
                                                >
                                                    Leave
                                                </button>
                                            )}
                                            {isCreator(challenge) && (
                                                <button
                                                    onClick={() => handleDelete(challenge._id)}
                                                    className="text-xs border border-border text-slate-400 px-3 py-1.5 rounded-lg hover:border-red-400 hover:text-red-400 transition"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                            <span className="text-xs bg-secondary/20 text-secondary px-3 py-1.5 rounded-lg">
                                                ✓ Joined
                                            </span>
                                        </>
                                    ) : (
                                        challenge.isActive && (
                                            <button
                                                onClick={() => handleJoin(challenge._id)}
                                                className="text-xs bg-primary text-white px-4 py-1.5 rounded-lg hover:opacity-90 transition"
                                            >
                                                Join Challenge
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Right — Leaderboard */}
                <div>
                    {!selectedChal ? (
                        <div className="bg-card border border-border rounded-2xl p-12 text-center sticky top-6">
                            <p className="text-5xl mb-4">🏆</p>
                            <p className="text-slate-500">
                                Select a challenge to view its leaderboard
                            </p>
                        </div>
                    ) : (
                        <div className="bg-card border border-primary rounded-2xl p-6 space-y-4 sticky top-6">
                            <div>
                                <h2 className="text-white font-semibold text-lg">
                                    🏆 {leaderboard?.challengeTitle}
                                </h2>
                                <p className="text-slate-400 text-sm">
                                    {leaderboard?.totalParticipants} participants ·{' '}
                                    {METRICS.find(m => m.value === leaderboard?.metric)?.label}
                                </p>
                            </div>

                            {/* Submit Workout */}
                            {isParticipant(selectedChal) && selectedChal.isActive && (
                                <div className="bg-dark border border-border rounded-xl p-4 space-y-3">
                                    <p className="text-white text-sm font-medium">
                                        Submit a workout
                                    </p>
                                    <select
                                        value={selectedWkt}
                                        onChange={(e) => setSelectedWkt(e.target.value)}
                                        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary"
                                    >
                                        <option value="">Select workout...</option>
                                        {workouts.map((w) => (
                                            <option key={w._id} value={w._id}>
                                                {w.title} — {new Date(w.date).toLocaleDateString()}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleSubmitWorkout}
                                        disabled={submitting}
                                        className="w-full bg-primary text-white py-2 rounded-lg text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {submitting ? <Spinner size="sm" /> : 'Submit & Update Score'}
                                    </button>
                                </div>
                            )}

                            {/* Rankings */}
                            <div className="space-y-2">
                                {leaderboard?.leaderboard?.map((entry) => (
                                    <div
                                        key={entry.user?._id}
                                        className={`flex items-center gap-3 p-3 rounded-xl transition ${
                                            entry.isCurrentUser
                                                ? 'bg-primary/10 border border-primary/30'
                                                : 'bg-dark'
                                        }`}
                                    >
                                        {/* Rank Badge */}
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                                            entry.rank === 1 ? 'bg-yellow-500 text-black'  :
                                            entry.rank === 2 ? 'bg-slate-400 text-black'   :
                                            entry.rank === 3 ? 'bg-orange-600 text-white'  :
                                            'bg-dark border border-border text-slate-400'
                                        }`}>
                                            {entry.rank === 1 ? '🥇' :
                                             entry.rank === 2 ? '🥈' :
                                             entry.rank === 3 ? '🥉' :
                                             entry.rank}
                                        </div>

                                        {/* Avatar */}
                                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                            {entry.user?.name?.charAt(0).toUpperCase()}
                                        </div>

                                        {/* Name */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${
                                                entry.isCurrentUser ? 'text-primary' : 'text-white'
                                            }`}>
                                                {entry.user?.name}
                                                {entry.isCurrentUser && (
                                                    <span className="text-xs text-slate-500 ml-1">(you)</span>
                                                )}
                                            </p>
                                        </div>

                                        {/* Score */}
                                        <p className="text-white font-bold text-sm">
                                            {entry.score} pts
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChallengesPage;