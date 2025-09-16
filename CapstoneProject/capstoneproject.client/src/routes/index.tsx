import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LoadingOutlined } from '@ant-design/icons';

// const DashboardLayout = React.lazy(() => import("@layout/Layout"));

const RegisterForm = React.lazy(() => import("@pages/Auth/RegisterPage"));
const NotFoundPage = React.lazy(() => import("@pages/NotFound/NotFoundPage"));

import PublicOnlyRoute from "./PublicOnlyRoute";
import ProtectedRoute from "./ProtectedRoute";
import { Spin } from "antd";
import LoginForm from "@pages/Auth/LoginPage";
import ConfigurePage from "@pages/Admin/ConfigurePage";
import DashboardPage from "@pages/Admin/DashboardPage";
import DashboardLayout from "@layout/Layout";



const RoutesApp: React.FC = () => (
  <Suspense fallback={<Spin indicator={<LoadingOutlined spin />}/>}>
    <Routes>
      {/* chưa đăng nhập */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
      </Route>

      {/* Đã đăng nhập */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="configure" element={<ConfigurePage />} />
        </Route>
        {/* 404 cho người đã đăng nhập */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Bất kỳ route lạ khi chưa đăng nhập -> đẩy về /login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </Suspense>
);

export default RoutesApp;
