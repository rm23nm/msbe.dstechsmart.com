import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { smartApi } from "@/api/apiClient";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { LanguageProvider } from "@/lib/useLanguage";
import { ThemeProvider } from "@/lib/ThemeContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

// Pages
import Landing from "@/pages/LandingPage";
import Login from "@/pages/Login";
import MosqueRegister from "@/pages/MosqueRegister";
import Dashboard from "@/pages/Dashboard";
import MosquePortfolio from "@/pages/MosquePortfolio";
import MosqueLogin from "@/pages/MosqueLogin";
import MosqueRegisterPerson from "@/pages/MosqueRegister";
import PublicTV from "@/pages/PublicTV";
import Pengaturan from "@/pages/Pengaturan";
import Jamaah from "@/pages/Jamaah";
import Keuangan from "@/pages/Keuangan";
import ZakatCenter from "@/pages/ZakatCenter";
import LaporanKeuangan from "@/pages/LaporanKeuangan";
import Qurban from "@/pages/Qurban";
import Kegiatan from "@/pages/Kegiatan";
import Aset from "@/pages/Aset";
import Mustahik from "@/pages/Mustahik";
import Absensi from "@/pages/Absensi";
import AbsensiPublic from "@/pages/AbsensiPublic";
import LaporAset from "@/pages/LaporAset";
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
import QuranTafsir from "@/pages/QuranTafsir";
import SubscriptionPackage from "@/pages/SubscriptionPackage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AuditLogs from "@/pages/admin/AuditLogs";
import AdminMosques from "@/pages/admin/AdminMosques";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminBilling from "@/pages/admin/AdminBilling";
import AdminPackages from "@/pages/admin/AdminPackages";
import AdminReports from "@/pages/admin/AdminReports";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminRoles from "@/pages/admin/AdminRoles";
import AdminBroadcast from "@/pages/admin/AdminBroadcast";
import AdminLicenses from "@/pages/admin/AdminLicenses";
import MosqueRoles from "@/pages/MosqueRoles";
import BuyStandalone from "@/pages/BuyStandalone";
import Layout from "@/components/Layout";

const queryClientInstance = new QueryClient();

function isPublicPath(pathname) {
  const publicSegments = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/cari-masjid", "/quran", "/paket", "/beli-mandiri"];
  return (
    publicSegments.includes(pathname) ||
    pathname.startsWith("/masjid/") ||
    pathname.startsWith("/tv/") ||
    pathname.startsWith("/absensi/") ||
    pathname.startsWith("/scan/") ||
    pathname.startsWith("/lapor-aset/") ||
    pathname.startsWith("/reset-password/")
  );
}

import ProtectedRoute from "@/components/ProtectedRoute";

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();
  const [customMosque, setCustomMosque] = useState(null);
  const [resolvingDomain, setResolvingDomain] = useState(true);

  useEffect(() => {
    async function checkDomain() {
      const hostname = window.location.hostname;
      if (hostname === "ms.dstechsmart.com" || hostname === "msbe.dstechsmart.com" || hostname === "localhost" || hostname.includes("127.0.0.1")) {
        setResolvingDomain(false);
        return;
      }
      try {
        const m = await smartApi.mosque.getByDomain(hostname);
        if (m) {
          const hasDomainFeature = m.plan_features?.some(f => 
            f.toLowerCase().includes("domain kustom")
          );
          if (hasDomainFeature) {
            setCustomMosque(m);
          } else {
            console.warn("[SECURITY] Domain Kustom detected but feature not active for this mosque.");
          }
        }
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
        <Route path="/login" element={<MosqueLogin customMosque={customMosque} />} />
        <Route path="/register" element={<MosqueRegisterPerson customMosque={customMosque} />} />
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
        <Route path="/paket" element={<SubscriptionPackage />} />
        <Route path="/masjid/:id" element={<ProtectedRoute isPublic feature="Portofolio Digital"><MosquePortfolio /></ProtectedRoute>} />
        <Route path="/masjid/:id/login" element={<MosqueLogin />} />
        <Route path="/masjid/:id/register" element={<MosqueRegisterPerson />} />
        <Route path="/donasi/:id" element={<ProtectedRoute isPublic feature="Donasi Online"><Donasi /></ProtectedRoute>} />
        <Route path="/tv/:mosqueId" element={<ProtectedRoute isPublic feature="Tampilan TV Masjid"><PublicTV /></ProtectedRoute>} />
        <Route path="/absensi/:activityId" element={<ProtectedRoute isPublic feature="Absensi QR"><AbsensiPublic /></ProtectedRoute>} />
        <Route path="/scan/:activityId" element={<ProtectedRoute isPublic feature="Absensi QR"><AbsensiPublic /></ProtectedRoute>} />
        <Route path="/lapor-aset/:qrId" element={<LaporAset />} />
        <Route path="/beli-mandiri" element={<BuyStandalone />} />
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
        {/* Admin Routes - Lock for Superadmin Only */}
        <Route path="/admin" element={<ProtectedRoute isAdminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/mosques" element={<ProtectedRoute isAdminOnly><AdminMosques /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute isAdminOnly><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/billing" element={<ProtectedRoute isAdminOnly><AdminBilling /></ProtectedRoute>} />
        <Route path="/admin/packages" element={<ProtectedRoute isAdminOnly><AdminPackages /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute isAdminOnly><AdminReports /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute isAdminOnly><AdminSettings /></ProtectedRoute>} />
        <Route path="/admin/roles" element={<ProtectedRoute isAdminOnly><AdminRoles /></ProtectedRoute>} />
        <Route path="/admin/broadcast" element={<ProtectedRoute isAdminOnly><AdminBroadcast /></ProtectedRoute>} />
        <Route path="/admin/licenses" element={<ProtectedRoute isAdminOnly><AdminLicenses /></ProtectedRoute>} />
        <Route path="/admin/audit-logs" element={<ProtectedRoute isAdminOnly><AuditLogs /></ProtectedRoute>} />

        {/* Mosque Functional Routes - Protected by Permissions */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/audit-logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
        <Route path="/pengaturan" element={<ProtectedRoute><Pengaturan /></ProtectedRoute>} />
        <Route path="/hak-akses" element={<ProtectedRoute><AdminRoles /></ProtectedRoute>} />
        
        <Route path="/jamaah" element={<ProtectedRoute permission="jamaah"><Jamaah /></ProtectedRoute>} />
        <Route path="/keuangan" element={<ProtectedRoute permission="keuangan"><Keuangan /></ProtectedRoute>} />
        <Route path="/laporan-keuangan" element={<ProtectedRoute permission="keuangan"><LaporanKeuangan /></ProtectedRoute>} />
        <Route path="/zakat" element={<ProtectedRoute permission="keuangan" feature="Manajemen Zakat"><ZakatCenter /></ProtectedRoute>} />
        <Route path="/qurban" element={<ProtectedRoute permission="keuangan" feature="Manajemen Qurban"><Qurban /></ProtectedRoute>} />
        <Route path="/kegiatan" element={<ProtectedRoute permission="kegiatan"><Kegiatan /></ProtectedRoute>} />
        <Route path="/mustahik" element={<ProtectedRoute permission="mustahik" feature="Manajemen Zakat"><Mustahik /></ProtectedRoute>} />
        <Route path="/aset" element={<ProtectedRoute permission="aset" feature="Aset Masjid"><Aset /></ProtectedRoute>} />
        <Route path="/analitik" element={<ProtectedRoute permission="analitik" feature="Analitik Lanjutan"><AnalitikDashboard /></ProtectedRoute>} />
        <Route path="/ai-analitik" element={<ProtectedRoute permission="analitik" feature="AI OCR Struk"><AIAnalitik /></ProtectedRoute>} />
        
        <Route path="/pengumuman" element={<ProtectedRoute><Pengumuman /></ProtectedRoute>} />
        <Route path="/pembayaran-donasi" element={<ProtectedRoute feature="Donasi Online"><Donasi /></ProtectedRoute>} />
        <Route path="/info-publik" element={<ProtectedRoute permission="info-publik"><InfoPublik /></ProtectedRoute>} />
        <Route path="/prayer-times" element={<ProtectedRoute permission="info-publik"><InfoPublik /></ProtectedRoute>} />
        <Route path="/jamaah-dashboard" element={<ProtectedRoute permission="jamaah"><JamaahDashboard /></ProtectedRoute>} />
        <Route path="/donasi-masjid" element={<ProtectedRoute feature="Donasi Online" permission="donasi-masjid"><KonfirmasiDonasi /></ProtectedRoute>} />
        <Route path="/telegram" element={<ProtectedRoute feature="Telegram Bot"><TelegramIntegration /></ProtectedRoute>} />
        <Route path="/quran" element={<ProtectedRoute><QuranTafsir /></ProtectedRoute>} />
        <Route path="/paket" element={<ProtectedRoute><SubscriptionPackage /></ProtectedRoute>} />
        <Route path="/absensi" element={<ProtectedRoute feature="Absensi QR"><Absensi /></ProtectedRoute>} />
        <Route path="/hak-akses" element={<ProtectedRoute><MosqueRoles /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>
              <AuthenticatedApp />
              <InstallPWA />
            </Router>
            <Toaster />
          </QueryClientProvider>
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
