import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { smartApi } from '@/api/apiClient';
import { useLocation, Link } from 'react-router-dom';
import { Users, Landmark, Search, ShieldCheck } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState('totp'); // 'totp' | 'whatsapp' | 'sms'
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [waUrl, setWaUrl] = useState(null);
  const [phoneHint, setPhoneHint] = useState('');
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
      const resp = await smartApi.auth.login(email, password);
      
      if (resp.requires_2fa) {
        setRequires2FA(true);
        setTwoFactorMethod(resp.method || 'totp');
        setWaUrl(resp.wa_url || null);
        setPhoneHint(resp.phone_hint || '');
        setLoading(false);
        return;
      }
      
      const userRole = resp.user?.role;
      let targetUrl = "/jamaah-dashboard"; // default
      if (userRole === "superadmin" || userRole === "admin") targetUrl = "/admin";
      else if (userRole === "mosque_admin" || userRole === "pengurus") targetUrl = "/dashboard";

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
      let resp;
      if (twoFactorMethod === 'totp') {
        resp = await smartApi.auth.verify2FA(email, twoFactorToken);
      } else {
        // WA / SMS OTP
        resp = await smartApi.auth.verifyOTP(email, twoFactorToken);
      }
      const userRole = resp.user?.role;
      let targetUrl = "/jamaah-dashboard";
      if (userRole === "superadmin" || userRole === "admin") targetUrl = "/admin";
      else if (userRole === "mosque_admin" || userRole === "pengurus") targetUrl = "/dashboard";

      window.location.href = redirectParams || targetUrl;
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Kode tidak valid atau sudah kedaluwarsa.");
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
            {twoFactorMethod === 'totp' ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 text-center">Kode Authenticator (TOTP)</label>
                <Input 
                  type="text" 
                  value={twoFactorToken} 
                  onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g,''))} 
                  placeholder="123456"
                  className="rounded-lg text-center tracking-widest text-2xl font-mono py-6"
                  maxLength={6}
                  required 
                />
                <p className="text-xs text-slate-500 mt-3 text-center">Masukkan 6 digit kode dari aplikasi Authenticator Anda (Google Authenticator, Authy, dll.).</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <p className="text-sm font-semibold text-emerald-800">
                    {twoFactorMethod === 'whatsapp' ? '📱 Kode OTP dikirim via WhatsApp' : '💬 Kode OTP dikirim via SMS'}
                  </p>
                  {phoneHint && <p className="text-xs text-emerald-600 mt-1">ke nomor: <strong>{phoneHint}</strong></p>}
                </div>
                {waUrl && (
                  <a href={waUrl} target="_blank" rel="noopener noreferrer" 
                     className="flex items-center justify-center gap-2 w-full py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-colors">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12.004 2C6.477 2 2 6.477 2 12c0 1.821.497 3.526 1.359 4.99L2.09 21.846a.5.5 0 00.64.64l4.952-1.29A9.952 9.952 0 0012.004 22C17.531 22 22 17.523 22 12S17.531 2 12.004 2z"/></svg>
                    Buka WhatsApp untuk lihat kode
                  </a>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5 text-center">Kode OTP (6 digit)</label>
                  <Input 
                    type="text" 
                    value={twoFactorToken} 
                    onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g,''))} 
                    placeholder="123456"
                    className="rounded-lg text-center tracking-widest text-2xl font-mono py-6"
                    maxLength={6}
                    required 
                  />
                  <p className="text-xs text-slate-500 mt-2 text-center">Kode berlaku selama 10 menit.</p>
                </div>
              </div>
            )}
            <Button type="submit" className="w-full rounded-lg py-5 mt-2 font-medium" disabled={loading || twoFactorToken.length !== 6}>
              {loading ? "Memverifikasi..." : "Verifikasi Kode"}
            </Button>
            <Button type="button" variant="ghost" className="w-full text-slate-500" onClick={() => { setRequires2FA(false); setTwoFactorToken(''); setError(null); }}>
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
                <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg flex-shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-indigo-900">Sebagai Jamaah</h4>
                  <p className="text-xs text-indigo-700/80 mt-1 leading-relaxed">
                    Temukan masjid Anda, lalu daftar atau login di halaman masjid tersebut.
                  </p>
                  <Link
                    to="/cari-masjid"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-100 hover:bg-indigo-200 px-3 py-1.5 rounded-lg"
                  >
                    <Search className="w-3.5 h-3.5" />
                    Cari & Pilih Masjid Anda
                  </Link>
                </div>
              </div>
            </div>

            {/* Mosque Registration */}
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 hover:bg-emerald-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg flex-shrink-0">
                  <Landmark className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-emerald-900">Daftarkan Masjid Baru</h4>
                  <p className="text-xs text-emerald-700/80 mt-1 leading-relaxed">
                    Ingin menggunakan layanan MasjidKu Smart untuk Masjid Anda?
                  </p>
                  <a
                    href="/#harga"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg"
                  >
                    Daftar Masjid Sekarang &rarr;
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Back to home */}
          <div className="mt-4 text-center">
            <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              ← Kembali ke Halaman Utama
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
