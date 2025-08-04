import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';

const RoutesApp: React.FC = () => (
  <Routes>
    {/* <Route path="/configure" element={<AnotherPage />} /> */}
    <Route path="/" element={<DashboardPage />}/>
  </Routes>
);

export default RoutesApp; 