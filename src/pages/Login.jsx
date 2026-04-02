import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from '@/api/apiClient';
import { useLocation, Link } from 'react-router-dom';
import { Users, Landmark, Search, ShieldCheck } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectParams = searchParams.get('redirect');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const resp = await base44.auth.login(email, password);
      
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
      const resp = await base44.auth.verify2FA(email, twoFactorToken);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Login MasjidKu</h1>
          <p className="text-slate-500 text-sm mt-2">Masuk ke akun Super Admin, Pengurus, atau Jamaah Anda</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-start gap-3">
            <div className="mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <span>{error}</span>
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Alamat Email</label>
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="email@contoh.com"
                className="rounded-lg"
                required 
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-slate-700">Kata Sandi</label>
                <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">Lupa Sandi?</Link>
              </div>
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                className="rounded-lg"
                required 
              />
            </div>
            <Button type="submit" className="w-full rounded-lg py-5 mt-2 font-medium" disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 text-center">Belum Memiliki Akun?</h3>
          
          <div className="space-y-3">
            {/* Jamaah Registration */}
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50 hover:bg-indigo-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-indigo-900">Sebagai Jamaah</h4>
                  <p className="text-xs text-indigo-700/80 mt-1 leading-relaxed">
                    Registrasi Jamaah dilakukan pada halaman masing-masing masjid.
                  </p>
                  <Link to="/landing" className="mt-2 inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                    <Search className="w-3.5 h-3.5 mr-1" />
                    Cari Masjid Anda
                  </Link>
                </div>
              </div>
            </div>

            {/* Mosque Registration */}
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 hover:bg-emerald-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-emerald-900">Daftarkan Masjid Baru</h4>
                  <p className="text-xs text-emerald-700/80 mt-1 leading-relaxed">
                    Ingin menggunakan layanan MasjidKu Smart untuk Masjid Anda?
                  </p>
                  <a href="#" className="mt-2 inline-flex items-center text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors">
                    Hubungi Tim Kami &rarr;
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
