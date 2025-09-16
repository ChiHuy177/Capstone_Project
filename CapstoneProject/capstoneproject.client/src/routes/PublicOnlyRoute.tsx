import { useAuth } from '@contexts/Auth/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';


export default function PublicOnlyRoute() {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return null;
    return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
}
