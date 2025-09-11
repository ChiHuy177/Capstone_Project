import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
import ConfigurePage from '../pages/ConfigurePage';
import LoginForm from '../pages/Auth/LoginPage';
import PublicOnlyRoute from './PublicOnlyRoute';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../layout/Layout';
import NotFoundPage from '../pages/NotFound/NotFoundPage';
import RegisterForm from '../pages/Auth/RegisterPage';

const RoutesApp: React.FC = () => (
    <Routes>
        <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
        </Route>
        <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="configure" element={<ConfigurePage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
);

export default RoutesApp;
