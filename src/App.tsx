/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { HashRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthScreen } from "./components/auth/AuthScreen";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { PWANotification } from "./components/common/PWANotification";
import { ToastProvider } from "./components/common/Toast";
import { useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { BayiProvider } from "./modules/bayi/context/BayiContext";
import { LauncherPage } from "./shell/pages/Launcher";
import { GlobalSettingsPage } from "./shell/pages/GlobalSettings";
import { KeuanganModule } from "./modules/keuangan/KeuanganModule";
import { BayiLayout } from "./modules/bayi/components/BayiLayout";
import { DashboardPage } from "./modules/bayi/pages/DashboardPage";
import { SchedulePage } from "./modules/bayi/pages/SchedulePage";
import { KeuanganPage } from "./modules/bayi/pages/KeuanganPage";
import { VaccineInfoPage } from "./modules/bayi/pages/VaccineInfoPage";
import { BabySettingsPage } from "./modules/bayi/pages/BabySettingsPage";

function AppRoutes() {
  const { user, loading: authLoading, isGuest } = useAuth();

  // Auth Loading Skeleton
  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[14px] text-text-2 font-medium">Menyiapkan aplikasi...</p>
        </div>
      </div>
    );
  }

  // Auth Gate: show AuthScreen if not signed in and not guest
  if (!user && !isGuest) {
    return <AuthScreen />;
  }

  return (
    <Routes>
      <Route path="/" element={<LauncherPage />} />
      <Route path="/pengaturan" element={<GlobalSettingsPage />} />
      <Route path="/keuangan-keluarga/*" element={<KeuanganModule />} />

      {/* Bayi Module Routes */}
      <Route path="/bayi" element={<BayiLayout />}>
        <Route index element={<Navigate to="/bayi/beranda" replace />} />
        <Route path="beranda" element={<DashboardPage />} />
        <Route path="jadwal" element={<SchedulePage />} />
        <Route path="biaya" element={<KeuanganPage />} />
        <Route path="keuangan" element={<Navigate to="/bayi/biaya" replace />} />
        <Route path="asuransi" element={<Navigate to="/bayi/biaya" replace />} />
        <Route path="info-vaksin" element={<VaccineInfoPage />} />
        <Route path="pengaturan" element={<BabySettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function BayiProviderWrapper() {
  const navigate = useNavigate();
  return (
    <BayiProvider onNavigateToBabyHome={() => navigate("/bayi/beranda")}>
      <AppRoutes />
    </BayiProvider>
  );
}

function MainApp() {
  return (
    <HashRouter>
      <BayiProviderWrapper />
    </HashRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <MainApp />
          <PWANotification />
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
