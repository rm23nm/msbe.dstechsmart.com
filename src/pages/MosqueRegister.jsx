import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from '@/api/apiClient';
import { useLocation, useParams, useNavigate, Link } from 'react-router-dom';
import { Landmark } from "lucide-react";

export default function MosqueRegister() {
  const { id } = useParams();
  const [mosque, setMosque] = useState(null);
  const [loadingMosque, setLoadingMosque] = useState(true);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectParams = searchParams.get('redirect');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadMosque() {
      try {
        let mosqueData = null;
        const bySlug = await base44.entities.Mosque.filter({ slug: id });
        if (bySlug?.length > 0) {
          mosqueData = bySlug[0];
        } else {
          try {
            const byId = await base44.entities.Mosque.filter({ id: id });
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
  }, [id]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await base44.auth.register({
        full_name: fullName,
        email: email,
        phone: phone,
        password: password,
        mosque_id: mosque.id
      });
      // Success, navigate
      window.location.href = redirectParams || "/dashboard";
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Gagal mendaftar. Silakan coba lagi.");
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 relative overflow-hidden">
      {mosque.cover_image_url && (
        <img src={mosque.cover_image_url} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-10" />
      )}
      
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl z-10 border border-slate-100">
        <div className="mb-8 text-center flex flex-col items-center">
          {mosque.logo_url ? (
            <img src={mosque.logo_url} alt="Logo" className="w-14 h-14 rounded-xl object-cover shadow-sm mb-4" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <Landmark className="h-7 w-7" />
            </div>
          )}
          <h1 className="text-xl font-bold text-slate-800">Pendaftaran Jamaah Baru</h1>
          <p className="text-slate-500 text-sm mt-1">{mosque.name}</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
            <Input 
              type="text" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              placeholder="Fulan bin Fulan"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Email</label>
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="email@anda.com"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">No WhatsApp/HP</label>
            <Input 
              type="tel" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder="08xxxxxxxxxxx"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kata Sandi Baru</label>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              required 
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? "Memproses Pendaftaran..." : "Daftar Sekarang"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Sudah punya akun jamaah?{' '}
          <Link to={`/masjid/${id}/login`} className="text-primary font-medium hover:underline">
            Login di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
