import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@contexts/Auth/AuthContext';

export default function ProtectedRoute() {
    const { isAuthenticated, loading } = useAuth();
    if (loading)
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background text-foreground">
                <div className="rounded-md border px-4 py-2 shadow">Đang xác thực phiên...</div>
            </div>
        );
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
