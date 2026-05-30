import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';

const LoginPage = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading,  setLoading]  = useState(false);
    const { login }               = useAuth();
    const navigate                = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(formData);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed');
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
                    <h2 className="text-2xl font-bold text-white mb-6">Sign In</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">

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
                                placeholder="••••••••"
                                required
                                className="w-full bg-dark border border-border rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary transition"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Spinner size="sm" /> : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-slate-400 text-center mt-6">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary hover:underline font-medium">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;