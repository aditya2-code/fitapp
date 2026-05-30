import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth pages
import LoginPage    from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';

// Protected pages
import DashboardPage     from './pages/Dashboard/DashboardPage';
import ProfilePage       from './pages/Profile/ProfilePage';
import WorkoutPage       from './pages/Workout/WorkoutPage';
import NutritionPage     from './pages/Nutrition/NutritionPage';
import FeedPage          from './pages/Feed/FeedPage';
import ChallengesPage    from './pages/Challenges/ChallengesPage';
import NotificationsPage from './pages/Notifications/NotificationsPage';

function App() {
    return (
        <AuthProvider>
            <Router>
                {/* Global toast notifications */}
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: '#1e293b',
                            color:      '#f1f5f9',
                            border:     '1px solid #334155',
                        },
                    }}
                />

                <Routes>
                    {/* ── Public Routes ──────────────────── */}
                    <Route path="/login"    element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* ── Protected Routes ───────────────── */}
                    <Route path="/dashboard" element={
                        <ProtectedRoute><DashboardPage /></ProtectedRoute>
                    }/>
                    <Route path="/profile/:id" element={
                        <ProtectedRoute><ProfilePage /></ProtectedRoute>
                    }/>
                    <Route path="/workouts" element={
                        <ProtectedRoute><WorkoutPage /></ProtectedRoute>
                    }/>
                    <Route path="/nutrition" element={
                        <ProtectedRoute><NutritionPage /></ProtectedRoute>
                    }/>
                    <Route path="/feed" element={
                        <ProtectedRoute><FeedPage /></ProtectedRoute>
                    }/>
                    <Route path="/challenges" element={
                        <ProtectedRoute><ChallengesPage /></ProtectedRoute>
                    }/>
                    <Route path="/notifications" element={
                        <ProtectedRoute><NotificationsPage /></ProtectedRoute>
                    }/>

                    {/* ── Default redirect ───────────────── */}
                    <Route path="/"  element={<Navigate to="/dashboard" replace />} />
                    <Route path="*"  element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;