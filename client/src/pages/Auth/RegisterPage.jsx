import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';

const FITNESS_GOALS = [
    'Strength', 'Endurance', 'Weight Loss',
    'Muscle Gain', 'Flexibility', 'Cardio', 'Muscle-Ups'
];

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', confirmPassword: '',
    });
    const [selectedGoals, setSelectedGoals] = useState([]);
    const [loading,        setLoading]       = useState(false);
    const { register }                       = useAuth();
    const navigate                           = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleGoal = (goal) => {
        setSelectedGoals((prev) =>
            prev.includes(goal)
                ? prev.filter((g) => g !== goal)
                : [...prev, goal]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            return toast.error('Passwords do not match');
        }
        if (formData.password.length < 6) {
            return toast.error('Password must be at least 6 characters');
        }

        setLoading(true);
        try {
            await register({
                name:         formData.name,
                email:        formData.email,
                password:     formData.password,
                fitnessGoals: selectedGoals,
            });
            toast.success('Account created! Welcome!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-primary">FitApp</h1>
                    <p className="text-slate-400 mt-2">Track. Connect. Achieve.</p>
                </div>

                {/* Card */}
                <div className="bg-card border border-border rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-white mb-6">Create Account</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">

                        <div>
                            <label className="block text-slate-400 text-sm mb-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Raj Kumar"
                                required
                                className="w-full bg-dark border border-border rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary transition"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-400 text-sm mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                required
                                className="w-full bg-dark border border-border rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary transition"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-400 text-sm mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Min 6 characters"
                                required
                                className="w-full bg-dark border border-border rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary transition"
                            />
                        </div>

                        <div>
                            <label className="block text-slate-400 text-sm mb-1">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                className="w-full bg-dark border border-border rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary transition"
                            />
                        </div>

                        {/* Fitness Goals */}
                        <div>
                            <label className="block text-slate-400 text-sm mb-2">
                                Fitness Goals (optional)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {FITNESS_GOALS.map((goal) => (
                                    <button
                                        key={goal}
                                        type="button"
                                        onClick={() => toggleGoal(goal)}
                                        className={`px-3 py-1 rounded-full text-sm font-medium border transition
                                            ${selectedGoals.includes(goal)
                                                ? 'bg-primary border-primary text-white'
                                                : 'bg-dark border-border text-slate-400 hover:border-primary'
                                            }`}
                                    >
                                        {goal}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Spinner size="sm" /> : 'Create Account'}
                        </button>
                    </form>

                    <p className="text-slate-400 text-center mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary hover:underline font-medium">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;