import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
    { path: '/dashboard',     label: 'Dashboard',      icon: '🏠' },
    { path: '/feed',          label: 'Activity Feed',  icon: '📰' },
    { path: '/workouts',      label: 'Workouts',       icon: '💪' },
    { path: '/nutrition',     label: 'Nutrition',      icon: '🥗' },
    { path: '/challenges',    label: 'Challenges',     icon: '🏆' },
    { path: '/notifications', label: 'Notifications',  icon: '🔔' },
];

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, logout }              = useAuth();
    const navigate                      = useNavigate();

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-dark flex">

            {/* ── Sidebar ──────────────────────────────────── */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border
                transform transition-transform duration-200
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:relative lg:translate-x-0 lg:flex lg:flex-col
            `}>
                {/* Logo */}
                <div className="p-6 border-b border-border">
                    <h1 className="text-2xl font-bold text-primary">FitApp</h1>
                    <p className="text-slate-500 text-xs mt-1">Track. Connect. Achieve.</p>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 p-4 space-y-1">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-3 rounded-xl
                                text-sm font-medium transition
                                ${isActive
                                    ? 'bg-primary text-white'
                                    : 'text-slate-400 hover:bg-dark hover:text-white'
                                }
                            `}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* User Profile at Bottom */}
                <div className="p-4 border-t border-border">
                    <div
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-dark cursor-pointer transition"
                        onClick={() => navigate(`/profile/${user?._id}`)}
                    >
                        {user?.profilePicture ? (
                            <img
                                src={user.profilePicture}
                                alt="avatar"
                                className="w-9 h-9 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                                {user?.name}
                            </p>
                            <p className="text-slate-500 text-xs truncate">{user?.email}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full mt-2 text-left px-4 py-2 text-slate-400 hover:text-red-400 text-sm rounded-xl hover:bg-dark transition"
                    >
                        🚪 Logout
                    </button>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── Main Content ─────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Top bar (mobile only) */}
                <header className="lg:hidden flex items-center justify-between p-4 bg-card border-b border-border">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-white text-2xl"
                    >
                        ☰
                    </button>
                    <h1 className="text-xl font-bold text-primary">FitApp</h1>
                    <div className="w-8" />
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;