import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { smartApi } from "@/api/apiClient";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { LanguageProvider } from "@/lib/useLanguage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

// Pages
import Landing from "@/pages/LandingPage";
import Login from "@/pages/Login";
import MosqueRegister from "@/pages/MosqueRegister";
import Dashboard from "@/pages/Dashboard";
import MosquePortfolio from "@/pages/MosquePortfolio";
import PublicTV from "@/pages/PublicTV";
import Pengaturan from "@/pages/Pengaturan";
import Jamaah from "@/pages/Jamaah";
import Keuangan from "@/pages/Keuangan";
import LaporanKeuangan from "@/pages/LaporanKeuangan";
import Kegiatan from "@/pages/Kegiatan";
import Aset from "@/pages/Aset";
import Absensi from "@/pages/Absensi";
import AbsensiPublic from "@/pages/AbsensiPublic";
import Pengumuman from "@/pages/Pengumuman";
import Donasi from "@/pages/Donasi";
import InfoPublik from "@/pages/InfoPublik";
import CariMasjid from "@/pages/CariMasjid";
import JamaahDashboard from "@/pages/JamaahDashboard";
import AnalitikDashboard from "@/pages/AnalitikDashboard";
import AIAnalitik from "@/pages/AIAnalitik";
import KonfirmasiDonasi from "@/pages/KonfirmasiDonasi";
import TelegramIntegration from "@/pages/TelegramIntegration";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import PageNotFound from "@/lib/PageNotFound";
import InstallPWA from "@/components/InstallPWA";
import QuranTafsir from "./pages/QuranTafsir";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminMosques from "@/pages/admin/AdminMosques";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminBilling from "@/pages/admin/AdminBilling";
import AdminPackages from "@/pages/admin/AdminPackages";
import AdminReports from "@/pages/admin/AdminReports";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminRoles from "@/pages/admin/AdminRoles";
import Layout from "@/components/Layout";

const queryClientInstance = new QueryClient();

function isPublicPath(pathname) {
  const publicSegments = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/cari-masjid", "/quran"];
  return (
    publicSegments.includes(pathname) ||
    pathname.startsWith("/masjid/") ||
    pathname.startsWith("/tv/") ||
    pathname.startsWith("/absensi/") ||
    pathname.startsWith("/scan/") ||
    pathname.startsWith("/reset-password/")
  );
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();
  const [customMosque, setCustomMosque] = useState(null);
  const [resolvingDomain, setResolvingDomain] = useState(true);

  useEffect(() => {
    async function checkDomain() {
      const hostname = window.location.hostname;
      if (hostname === "ms.dstechsmart.com" || hostname === "localhost" || hostname.includes("127.0.0.1")) {
        setResolvingDomain(false);
        return;
      }
      try {
        const m = await smartApi.mosque.getByDomain(hostname);
        if (m) setCustomMosque(m);
      } catch (e) { }
      setResolvingDomain(false);
    }
    checkDomain();
  }, []);

  if (resolvingDomain) {
    return <div className="fixed inset-0 flex items-center justify-center bg-white"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (customMosque) {
    return (
      <Routes>
        <Route path="/" element={<MosquePortfolio mosque={customMosque} />} />
        <Route path="/tv" element={<PublicTV mosqueId={customMosque.id} />} />
        <Route path="/absensi/:activityId" element={<Absensi mosqueId={customMosque.id} />} />
        <Route path="*" element={<MosquePortfolio mosque={customMosque} />} />
      </Routes>
    );
  }

  if (isPublicPath(location.pathname)) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<MosqueRegister />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/cari-masjid" element={<CariMasjid />} />
        <Route path="/quran" element={<QuranTafsir />} />
        <Route path="/masjid/:id" element={<MosquePortfolio />} />
        <Route path="/donasi/:id" element={<Donasi />} />
        <Route path="/tv/:mosqueId" element={<PublicTV />} />
        <Route path="/absensi/:mosqueId/:activityId" element={<AbsensiPublic />} />
        <Route path="/absensi/:activityId" element={<AbsensiPublic />} />
        <Route path="/scan/:activityId" element={<AbsensiPublic />} />
      </Routes>
    );
  }

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <div className="fixed inset-0 flex items-center justify-center bg-white"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (authError && authError.type === 'auth_required' && !isPublicPath(location.pathname)) {
    navigateToLogin();
    return null;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/mosques" element={<AdminMosques />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/billing" element={<AdminBilling />} />
        <Route path="/admin/packages" element={<AdminPackages />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/roles" element={<AdminRoles />} />

        {/* Mosque Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pengaturan" element={<Pengaturan />} />
        <Route path="/jamaah" element={<Jamaah />} />
        <Route path="/keuangan" element={<Keuangan />} />
        <Route path="/kegiatan" element={<Kegiatan />} />
        <Route path="/pengumuman" element={<Pengumuman />} />
        <Route path="/pembayaran-donasi" element={<Donasi />} />
        <Route path="/info-publik" element={<InfoPublik />} />
        <Route path="/prayer-times" element={<InfoPublik />} />
        <Route path="/jamaah-dashboard" element={<JamaahDashboard />} />
        <Route path="/analitik" element={<AnalitikDashboard />} />
        <Route path="/ai-analitik" element={<AIAnalitik />} />
        <Route path="/donasi-masjid" element={<KonfirmasiDonasi />} />
        <Route path="/telegram" element={<TelegramIntegration />} />
        <Route path="/aset" element={<Aset />} />
        <Route path="/quran" element={<QuranTafsir />} />
        <Route path="/laporan-keuangan" element={<LaporanKeuangan />} />
        <Route path="/info-publik" element={<InfoPublik />} />
        <Route path="/absensi" element={<Absensi />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

const App = () => {
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

export default App;