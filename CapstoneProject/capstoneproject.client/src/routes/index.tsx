import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LoadingOutlined } from '@ant-design/icons';

// const DashboardLayout = React.lazy(() => import("@layout/Layout"));

const RegisterForm = React.lazy(() => import("@pages/Auth/RegisterPage"));
const NotFoundPage = React.lazy(() => import("@pages/NotFound/NotFoundPage"));
const LandingPage = React.lazy(() => import("@pages/Public/LandingPage"));

import PublicOnlyRoute from "./PublicOnlyRoute";
import ProtectedRoute from "./ProtectedRoute";
import { Spin } from "antd";
import LoginForm from "@pages/Auth/LoginPage";
import ConfigurePage from "@pages/Admin/ConfigurePage";
import DashboardPage from "@pages/Admin/DashboardPage";
import PdfUploadPage from "@pages/Admin/PdfUploadPage";
import DashboardLayout from "@layout/Layout";



const RoutesApp: React.FC = () => (
  <Suspense fallback={<Spin indicator={<LoadingOutlined spin />}/>}>
    <Routes>
      {/* Landing page - public */}
      <Route path="/landing" element={<LandingPage />} />

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
          <Route path="pdf-upload" element={<PdfUploadPage />} />
        </Route>
        {/* 404 cho người đã đăng nhập */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Bất kỳ route lạ khi chưa đăng nhập -> đẩy về /landing */}
      <Route path="*" element={<Navigate to="/landing" replace />} />
    </Routes>
  </Suspense>
);

export default RoutesApp;
