import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AnalysisPage from '../pages/AnalysisPage';
import AnotherPage from '../pages/AnotherPage';

const RoutesApp: React.FC = () => (
  <Routes>
    <Route path="/" element={<AnalysisPage />} />
    <Route path="/configure" element={<AnotherPage />} />
  </Routes>
);

export default RoutesApp; 