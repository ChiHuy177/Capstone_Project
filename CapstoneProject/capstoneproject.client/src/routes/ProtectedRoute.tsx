import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@contexts/Auth/AuthContext';

export default function ProtectedRoute() {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return null;
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
