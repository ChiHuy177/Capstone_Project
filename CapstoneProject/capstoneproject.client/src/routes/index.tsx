import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AnalysisPage from '../pages/AnalysisPage';
import AnotherPage from '../pages/AnotherPage';
import DashboardPage from '../pages/DashboardPage';

const RoutesApp: React.FC = () => (
  <Routes>
    <Route path="/" element={<AnalysisPage />} />
    <Route path="/configure" element={<AnotherPage />} />
    <Route path="/dashboard" element={<DashboardPage />} />
  </Routes>
);

export default RoutesApp; 