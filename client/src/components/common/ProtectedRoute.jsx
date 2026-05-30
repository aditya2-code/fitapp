import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from './Spinner';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    // Wait while checking token on app load
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-dark">
                <Spinner size="lg" />
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;