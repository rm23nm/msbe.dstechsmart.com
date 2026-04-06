import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient, smartApi } from "@/api/apiClient";
import { 
  ShieldCheck, Globe, Zap, CheckCircle2, ArrowRight, 
  Building2, Mail, Lock, CreditCard, ChevronLeft, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function BuyStandalone() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    mosque_name: "",
    admin_name: "",
    email: "",
    password: "",
    domain: "",
  });
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [basePrice] = useState(5000000);

  const calculateTotal = () => {
    let final = basePrice;
    if (appliedVoucher) {
      const val = parseFloat(appliedVoucher.discount_value) || 0;
      if (appliedVoucher.discount_type === "percent") {
        final = basePrice - (basePrice * (val / 100));
      } else {
        final = basePrice - val;
      }
    }
    return final;
  };

  const currentTotal = calculateTotal();

  const handleValidateVoucher = async () => {
    if (!voucherCode) return;
    try {
      const res = await apiClient.post("/vouchers/validate", { code: voucherCode });
      if (res.data.valid) {
        setAppliedVoucher(res.data);
        toast.success(res.data.message);
      }
    } catch (e) {
      toast.error(e.response?.data?.error || "Gagal memvalidasi voucher");
      setAppliedVoucher(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.mosque_name || !formData.email || !formData.password) {
      return toast.error("Mohon lengkapi data pendaftaran");
    }

    setLoading(true);
    try {
      const totalPrice = currentTotal;
      // 1. DAFTARKAN MASJID & ADMIN
      const mosqueRes = await smartApi.entities.Mosque.create({
        name: formData.mosque_name,
        email: formData.email,
        city: "Standalone Client",
        address: "Standalone Installation",
        admin_password: formData.password
      });

      if (mosqueRes && mosqueRes.id) {
        // 2. TERBITKAN LISENSI OTOMATIS
        const licenseKey = `WHITELABEL-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        await smartApi.entities.License.create({
          key: licenseKey,
          mosque_id: mosqueRes.id,
          domain: formData.domain || null,
          status: "active"
        });

        // 3. CATAT PENDAPATAN KE LAPORAN KEUANGAN PUSAT (API Publik baru)
        const masterRes = await apiClient.get("/public/master");
        const masterId = masterRes.data.id;

        if (masterId) {
          await smartApi.entities.Transaction.create({
            mosque_id: masterId,
            description: `Pendaftaran Standalone: ${formData.mosque_name}`,
            type: "pemasukan",
            category: "Penjualan Software",
            amount: totalPrice,
            date: new Date().toISOString()
          });
        }

        toast.success("Pembelian Berhasil! Silakan cek email untuk detail lisensi.");
        setTimeout(() => navigate("/login"), 3000);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Gagal memproses pendaftaran");
    } finally {
      setLoading(false);
    }
  };

  const originalPrice = basePrice;
  const finalPrice = calculateTotal();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-6">
      <div className="max-w-4xl w-full grid md:grid-cols-2 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
        
        {/* Left Side: Marketing */}
        <div className="bg-[#0f172a] p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-20 opacity-10"><Globe className="w-64 h-64" /></div>
          
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center text-emerald-400 gap-2 text-sm font-bold mb-12 hover:gap-3 transition-all">
              <ChevronLeft className="w-4 h-4" /> Kembali ke Beranda
            </Link>
            <h1 className="text-4xl font-black mb-6 leading-tight">Miliki Platform Digital Masjid Anda Sendiri.</h1>
            <p className="text-slate-400 mb-8 font-medium">Beli paket produk mandiri White-Label.</p>
            
            <div className="space-y-6">
              {[
                { t: "Domain & Hosting Mandiri", i: Globe },
                { t: "Full Branding Nama Masjid", i: ShieldCheck },
                { t: "Update Fitur dari Pusat", i: Zap }
              ].map((f, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400"><f.i className="w-5 h-5"/></div>
                  <span className="font-bold text-sm tracking-tight">{f.t}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-12 border-t border-white/10 mt-12">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-widest font-bold mb-1">Total Pembayaran</p>
                  {appliedVoucher && (
                    <p className="text-sm text-white/40 line-through">Rp {basePrice.toLocaleString()}</p>
                  )}
                  <p className="text-3xl font-black text-emerald-400">Rp {currentTotal.toLocaleString()}</p>
                </div>
                {appliedVoucher && (
                  <Badge variant="success" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 py-1 px-3">
                    Diskon Aktif!
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                <Input 
                  placeholder="Kode Voucher" 
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  className="bg-white/10 border-white/10 text-white placeholder:text-white/30"
                />
                <Button 
                  type="button"
                  onClick={handleValidateVoucher}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white whitespace-nowrap"
                >
                  Terapkan
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-10 md:p-12">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-black text-slate-900">Registrasi Pemilik</h2>
            <p className="text-slate-500 text-sm mt-2 font-medium">Lengkapi data untuk menerbitkan lisensi mandiri.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-400">Nama Masjid Pembeli</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
                <Input 
                  className="pl-10 h-11 rounded-xl border-slate-200" 
                  placeholder="Masjid Al-Barkah"
                  value={formData.mosque_name}
                  onChange={(e) => setFormData({...formData, mosque_name: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-400">Email Admin Utama</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
                  <Input 
                    type="email"
                    className="pl-10 h-11 rounded-xl border-slate-200" 
                    placeholder="admin@masjid.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-400">Password Dashboard</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
                <Input 
                  type="password"
                  className="pl-10 h-11 rounded-xl border-slate-200" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-400">Target Domain (Opsional)</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
                <Input 
                  className="pl-10 h-11 rounded-xl border-slate-200" 
                  placeholder="masjid-raya.com"
                  value={formData.domain}
                  onChange={(e) => setFormData({...formData, domain: e.target.value})}
                />
              </div>
            </div>

            <Button 
              disabled={loading}
              className="w-full h-14 bg-[#0f172a] hover:bg-black rounded-2xl text-lg font-bold shadow-xl shadow-slate-200 gap-3"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CreditCard className="w-5 h-5" /> Beli Sekarang</>}
            </Button>

            <p className="text-[10px] text-center text-slate-400">
               *Dengan membeli, Anda menyetujui syarat & ketentuan DSTechSmart. 
               Pendapatan ini akan tercatat dalam laporan keuangan resmi kami secara transparan.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
