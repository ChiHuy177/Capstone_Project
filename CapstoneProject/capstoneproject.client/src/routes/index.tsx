import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
import ConfigurePage from '../pages/ConfigurePage';

const RoutesApp: React.FC = () => (
    <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/configure" element={<ConfigurePage />} />
    </Routes>
);

export default RoutesApp;
