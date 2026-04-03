import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { smartApi } from '@/api/apiClient';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await smartApi.auth.forgotPassword(email);
      setSuccess(res.message || "Tautan reset kata sandi telah dikirim ke email & nomor telepon pemulihan Anda.");
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Gagal mengirim permintaan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md border border-slate-100 relative">
        <Link to="/login" className="absolute top-4 left-4 text-sm text-primary hover:underline">
          &larr; Kembali
        </Link>
        <div className="mb-8 mt-4 text-center">
          <h1 className="text-2xl font-bold text-slate-800">Lupa Kata Sandi</h1>
          <p className="text-slate-500 text-sm mt-2">
            Masukkan email Anda. Kami akan mengirimkan instruksi via Email dan integrasi SMS/WA ke nomor terdaftar Anda.
          </p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Email</label>
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="contoh@email.com"
              required 
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Mengirim permintaan..." : "Kirim Tautan Reset"}
          </Button>
        </form>
      </div>
    </div>
  );
}
