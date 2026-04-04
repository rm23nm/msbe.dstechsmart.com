import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { LanguageProvider } from '@/lib/useLanguage';
import Layout from './components/Layout';
import InstallPWA from './components/InstallPWA';
import Dashboard from './pages/Dashboard';
import Keuangan from './pages/Keuangan';
import Kegiatan from './pages/Kegiatan';
import Jamaah from './pages/Jamaah';
import Pengumuman from './pages/Pengumuman';
import InfoPublik from './pages/InfoPublik';
import Pengaturan from './pages/Pengaturan';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMosques from './pages/admin/AdminMosques';
import AdminUsers from './pages/admin/AdminUsers';
import AdminBilling from './pages/admin/AdminBilling';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings.jsx';
import AdminPackages from './pages/admin/AdminPackages.jsx';
import AdminRoles from './pages/admin/AdminRoles.jsx';
import Aset from './pages/Aset.jsx';
import LaporanKeuangan from './pages/LaporanKeuangan.jsx';
import JamaahDashboard from './pages/JamaahDashboard.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import MosqueLogin from './pages/MosqueLogin.jsx';
import MosqueRegister from './pages/MosqueRegister.jsx';
import MosquePortfolio from './pages/MosquePortfolio';
import AnalitikDashboard from './pages/AnalitikDashboard';
import AIAnalitik from './pages/AIAnalitik';
import PublicTV from './pages/PublicTV';
import Donasi from './pages/Donasi';
import Absensi from './pages/Absensi';
import AbsensiPublic from './pages/AbsensiPublic';
import KonfirmasiDonasi from './pages/KonfirmasiDonasi';
import CariMasjid from './pages/CariMasjid';
import TelegramIntegration from './pages/TelegramIntegration';

function isPublicPath(pathname) {
  return (
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname.startsWith('/masjid/') ||
    pathname === '/tv' ||
    pathname.startsWith('/tv/') ||
    pathname === '/donasi' ||
    pathname.startsWith('/donasi/') ||
    pathname.startsWith('/absensi/') ||
    pathname === '/landing' ||
    pathname === '/cari-masjid' ||
    pathname === '/info-publik'
  );
}

import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();
  const [customMosque, setCustomMosque] = useState(null);
  const [resolvingDomain, setResolvingDomain] = useState(true);

  useEffect(() => {
    async function checkDomain() {
      const hostname = window.location.hostname;
      // Jangan cek jika ini domain utama atau localhost
      if (hostname === "ms.dstechsmart.com" || hostname === "localhost" || hostname.includes("127.0.0.1")) {
        setResolvingDomain(false);
        return;
      }

      try {
        const m = await smartApi.mosque.getByDomain(hostname);
        if (m) setCustomMosque(m);
      } catch (e) {
        console.log("Not a custom domain mosque");
      }
      setResolvingDomain(false);
    }
    checkDomain();
  }, []);

  if (resolvingDomain) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Jika diakses via custom domain dan sedang di root '/', tampilkan portfolio masjid tersebut
  if (customMosque && location.pathname === "/") {
    return (
      <Routes>
        <Route path="/" element={<MosquePortfolio id={customMosque.slug || customMosque.id} />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    );
  }

  // Public routes — render immediately without auth check
  if (isPublicPath(location.pathname)) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/masjid/:id" element={<MosquePortfolio />} />
        <Route path="/masjid/:id/login" element={<MosqueLogin />} />
        <Route path="/masjid/:id/register" element={<MosqueRegister />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/cari-masjid" element={<CariMasjid />} />
        <Route path="/tv" element={<PublicTV />} />
        <Route path="/tv/:id" element={<PublicTV />} />
        <Route path="/donasi" element={<Donasi />} />
        <Route path="/donasi/:id" element={<Donasi />} />
        <Route path="/absensi/:mosqueId/:activityId" element={<AbsensiPublic />} />
        <Route path="/info-publik" element={<InfoPublik />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    );
  }

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/keuangan" element={<Keuangan />} />
        <Route path="/kegiatan" element={<Kegiatan />} />
        <Route path="/jamaah" element={<Jamaah />} />
        <Route path="/pengumuman" element={<Pengumuman />} />
        <Route path="/info-publik" element={<InfoPublik />} />
        <Route path="/pengaturan" element={<Pengaturan />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/mosques" element={<AdminMosques />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/billing" element={<AdminBilling />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/packages" element={<AdminPackages />} />
        <Route path="/admin/roles" element={<AdminRoles />} />
        <Route path="/aset" element={<Aset />} />
        <Route path="/laporan-keuangan" element={<LaporanKeuangan />} />
        <Route path="/jamaah-dashboard" element={<JamaahDashboard />} />
        <Route path="/analitik" element={<AnalitikDashboard />} />
        <Route path="/ai-analitik" element={<AIAnalitik />} />
        <Route path="/donasi-masjid" element={<KonfirmasiDonasi />} />
        <Route path="/absensi" element={<Absensi />} />
        <Route path="/telegram" element={<TelegramIntegration />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
          <InstallPWA />
        </QueryClientProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App