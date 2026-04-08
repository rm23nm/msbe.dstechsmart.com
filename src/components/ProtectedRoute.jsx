import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useMosqueContext } from "@/lib/useMosqueContext";

const ProtectedRoute = ({ children, permission, feature, isPublic = false, isAdminOnly = false }) => {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const { hasPermission, currentMosque, loading: isLoadingMosque, permissions } = useMosqueContext();
  const location = useLocation();

  const isPublicPath =
    location.pathname.startsWith("/tv/") ||
    location.pathname.startsWith("/mosque/") ||
    location.pathname.startsWith("/donasi/") ||
    location.pathname.startsWith("/quran");

  if (isLoadingAuth || isLoadingMosque) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-emerald-600 animate-pulse uppercase tracking-widest">Verifikasi Keamanan...</p>
        </div>
      </div>
    );
  }

  // 0. Expiration Check (Lock Public Info if Expired)
  const isExpired = () => {
    if (!currentMosque) return false;
    const status = currentMosque.subscription_status?.toLowerCase();
    
    // Trial can expire too
    if (status === 'expired' || status === 'cancelled') return true;
    
    if (currentMosque.subscription_end) {
      const today = new Date();
      const end = new Date(currentMosque.subscription_end);
      if (end < today) return true;
    }
    return false;
  };

  const isSystemAdmin = user?.role === 'superadmin' || user?.role === 'admin';

  if (isExpired() && !isSystemAdmin && !location.pathname.startsWith('/quran') && !location.pathname.startsWith('/dashboard')) {
     return (
       <div className="flex flex-col items-center justify-center min-h-screen text-center p-8 bg-[#1e293b] text-white">
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-8 text-red-500 animate-pulse">
             <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-2">Layanan Non-Aktif</h2>
          <p className="text-slate-400 max-w-sm mb-10 font-bold uppercase tracking-widest text-[11px]">
             Masa aktif paket layanan <span className="text-white">"{currentMosque?.name}"</span> telah berakhir. Silakan lakukan perpanjangan langganan untuk mengaktifkan kembali akses publik.
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button 
                onClick={() => window.location.href = "/login"}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black italic tracking-tighter uppercase shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all"
            >
                Login Admin & Perpanjang
            </button>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Administrator MasjidKu Smart</p>
          </div>
       </div>
     );
  }

  // 1. Feature Gate (Subscription Plan)
  const hasFeature = (featName) => {
    if (!featName) return true;
    if (isSystemAdmin) return true; 
    
    // For public paths (TV, Portfolio, etc.), we allow access regardless of individual feature toggles
    // during the active subscription period (managed by isExpired above).
    if (isPublic || isPublicPath) return true;

    return currentMosque?.plan_features?.some(f => 
      f.toLowerCase().includes(featName.toLowerCase())
    );
  };

  if (feature && !hasFeature(feature)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-8 bg-slate-50 rounded-3xl border-2 border-dashed m-4 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6 text-amber-600 shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-3 text-balance">Fitur Belum Aktif 🚀</h2>
        <p className="text-slate-500 max-w-sm mb-8 leading-relaxed font-medium">
          Maaf, fitur <span className="text-emerald-600 font-bold">"{feature}"</span> untuk masjid ini belum diaktifkan atau memerlukan peningkatan paket langganan.
        </p>
        {!isAuthenticated ? (
           <button 
             onClick={() => window.location.href = "/"}
             className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-lg hover:scale-105 transition-all"
           >
             Kembali ke Beranda
           </button>
        ) : (
          <div className="flex gap-4">
            <button 
              onClick={() => window.location.href = "/paket"}
              className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg hover:scale-105 transition-all"
            >
              Upgrade Sekarang
            </button>
          </div>
        )}
      </div>
    );
  }

  // 2. Check Login (Skip if public link is allowed and mosque feature exists)
  if (!isAuthenticated && !isPublic) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // 3. Admin Only Gate
  if (isAdminOnly && !isSystemAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // 4. Permission Gate (RBAC)
  if (permission && !hasPermission(permission)) {
    // If it's a superadmin and NO permission is explicitly set yet, allow them
    // (backward compatibility: older superadmin templates might be empty)
    if (user?.role === 'superadmin' && permissions?.[permission] === undefined) {
        return children;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-card rounded-3xl border m-4 shadow-sm animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-4 text-destructive">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Akses Terbatas</h2>
        <p className="text-muted-foreground max-w-sm mb-6">
          Mohon maaf, peran Bapak tidak memiliki izin untuk mengakses halaman ini. 
          Silakan hubungi Superadmin atau Admin Masjid Bapak.
        </p>
        <button 
          onClick={() => window.location.href = "/dashboard"}
          className="px-6 py-2 bg-primary text-white rounded-xl font-bold shadow-lg hover:shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
