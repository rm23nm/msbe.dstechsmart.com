import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { smartApi } from '@/api/apiClient';
import { useLocation, useParams, useNavigate, Link } from 'react-router-dom';
import { Landmark } from "lucide-react";

export default function MosqueLogin({ customMosque }) {
  const { id } = useParams();
  const mosqueId = customMosque?.id || id;
  const [mosque, setMosque] = useState(null);
  const [loadingMosque, setLoadingMosque] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectParams = searchParams.get('redirect');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadMosque() {
      if (customMosque) {
        setMosque(customMosque);
        setLoadingMosque(false);
        return;
      }
      try {
        let mosqueData = null;
        const bySlug = await smartApi.entities.Mosque.filter({ slug: mosqueId });
        if (bySlug?.length > 0) {
          mosqueData = bySlug[0];
        } else {
          try {
            const byId = await smartApi.entities.Mosque.filter({ id: mosqueId });
            if (byId?.length > 0) mosqueData = byId[0];
          } catch (_) {}
        }
        setMosque(mosqueData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingMosque(false);
      }
    }
    loadMosque();
  }, [mosqueId, customMosque]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const resp = await smartApi.auth.login(email, password);
      if (resp.requires_2fa) {
        setRequires2FA(true);
        setLoading(false);
        return;
      }
      
      const userRole = resp.user?.role;
      let targetUrl = "/dashboard";
      if (userRole === "admin") targetUrl = "/admin";
      if (userRole === "user" || userRole === "jamaah") targetUrl = "/jamaah-dashboard";

      window.location.href = redirectParams || targetUrl;
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Gagal login. Periksa email dan password Anda.");
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const resp = await smartApi.auth.verify2FA(email, twoFactorToken);
      const userRole = resp.user?.role;
      let targetUrl = "/dashboard";
      if (userRole === "admin") targetUrl = "/admin";
      if (userRole === "user" || userRole === "jamaah") targetUrl = "/jamaah-dashboard";

      window.location.href = redirectParams || targetUrl;
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Kode Authenticator tidak masuk atau tidak valid.");
      setLoading(false);
    }
  };

  if (loadingMosque) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!mosque) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Masjid tidak ditemukan</h1>
          <Link to="/" className="text-primary hover:underline">Kembali ke Beranda</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      {mosque.cover_image_url && (
        <img src={mosque.cover_image_url} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-10" />
      )}
      
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl z-10 border border-slate-100">
        <div className="mb-8 text-center flex flex-col items-center">
          {mosque.logo_url ? (
            <img src={mosque.logo_url} alt="Logo" className="w-16 h-16 rounded-xl object-cover shadow-sm mb-4" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <Landmark className="h-8 w-8" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-slate-800">Login Jamaah</h1>
          <p className="text-slate-500 text-sm mt-1">{mosque.name}</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {requires2FA ? (
          <form onSubmit={handleVerify2FA} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 text-center">Kode Authenticator</label>
              <Input 
                type="text" 
                value={twoFactorToken} 
                onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g,''))} 
                placeholder="123456"
                className="rounded-lg text-center tracking-widest text-2xl font-mono py-6"
                maxLength={6}
                required 
              />
              <p className="text-xs text-slate-500 mt-3 text-center">Masukkan 6 digit kode dari aplikasi Authenticator Anda untuk masuk.</p>
            </div>
            <Button type="submit" className="w-full rounded-lg py-5 mt-2 font-medium" disabled={loading || twoFactorToken.length !== 6}>
              {loading ? "Memverifikasi..." : "Verifikasi Kode"}
            </Button>
            <Button type="button" variant="ghost" className="w-full text-slate-500" onClick={() => setRequires2FA(false)}>
              Batal
            </Button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="email@anda.com"
                required 
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Lupa Password?</Link>
              </div>
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                required 
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-slate-500">
          Belum terdaftar sebagai jamaah?{' '}
          <Link to={`/masjid/${id}/register`} className="text-primary font-medium hover:underline">
            Daftar Sekarang
          </Link>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
          <Link to={`/masjid/${id}`} className="hover:text-primary">&larr; Kembali ke Profil Masjid</Link>
        </div>
      </div>
    </div>
  );
}
