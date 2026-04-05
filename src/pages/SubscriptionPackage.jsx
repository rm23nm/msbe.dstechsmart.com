import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import { useMosqueContext } from "@/lib/useMosqueContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, Package, Crown, Sparkles, Zap, ShieldCheck, Ticket, Tag } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/formatCurrency";

const PLAN_MAP = {
  monthly: { name: "Paket Bulanan", duration: "1 Bulan", icon: Zap, color: "blue" },
  triwulan: { name: "Paket Triwulan", duration: "3 Bulan", icon: Package, color: "emerald", recommended: true },
  semester: { name: "Paket Semester", duration: "6 Bulan", icon: ShieldCheck, color: "indigo" },
  yearly: { name: "Paket Tahunan", duration: "12 Bulan", icon: Crown, color: "amber" },
  enterprise: { name: "Enterprise (1 Thn)", duration: "12 Bulan", icon: Sparkles, color: "purple" }
};

export default function SubscriptionPackage() {
  const { currentMosque, loading: mosqueLoading } = useMosqueContext();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [fetchingPlans, setFetchingPlans] = useState(true);
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [checkingVoucher, setCheckingVoucher] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    setFetchingPlans(true);
    try {
      const data = await smartApi.entities.PlanFeatures.list();
      const filtered = data
        .filter(p => p.plan !== 'trial')
        .map(p => ({
          ...p,
          ...(PLAN_MAP[p.plan] || {})
        }))
        .sort((a,b) => (a.price || 0) - (b.price || 0));
      
      setPlans(filtered);
    } catch (err) {
      console.error("Failed to load plans:", err);
      toast.error("Gagal memuat daftar paket.");
    } finally {
      setFetchingPlans(false);
    }
  }

  async function checkVoucher() {
    if (!voucherCode.trim()) return;
    setCheckingVoucher(true);
    try {
      const result = await smartApi.entities.Voucher.filter({ code: voucherCode.trim().toUpperCase(), status: 'active' });
      if (result && result.length > 0) {
        const v = result[0];
        // Check expiry
        if (v.expiry_date && new Date(v.expiry_date) < new Date()) {
          toast.error("Voucher sudah kedaluwarsa.");
        } else {
          setAppliedVoucher(v);
          toast.success(`Voucher "${v.code}" berhasil diterapkan!`);
        }
      } else {
        toast.error("Kode voucher tidak valid.");
      }
    } catch (err) {
      toast.error("Gagal mengecek voucher.");
    } finally {
      setCheckingVoucher(false);
    }
  }

  async function handleUpgrade(planId, planName, finalPrice) {
    setLoading(true);
    const msg = `Halo Admin MasjidKu Smart, saya ingin upgrade masjid "${currentMosque?.name || '...'}" ke paket ${planName}.
${appliedVoucher ? `Menggunakan Voucher: ${appliedVoucher.code} (${appliedVoucher.type === 'percentage' ? appliedVoucher.discount*100+'%' : formatCurrency(appliedVoucher.discount)})` : ''}
Estimasi Biaya: ${formatCurrency(finalPrice)}
Mohon panduannya untuk pembayaran.`;

    window.open(`https://wa.me/628123456789?text=${encodeURIComponent(msg)}`, '_blank');
    setLoading(false);
  }

  if (mosqueLoading || fetchingPlans) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const isExpired = currentMosque?.subscription_end && new Date(currentMosque.subscription_end) < new Date();

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-12 pt-6 px-4">
      <div className="text-center space-y-4">
        <Badge variant={isExpired ? "destructive" : "secondary"} className={isExpired ? "animate-bounce" : ""}>
          {isExpired ? "🔴 Akses Dibatasi - Masa Aktif Berakhir" : "🟢 Status Paket: Aktif"}
        </Badge>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-slate-900 flex items-center justify-center gap-3">
          Level UP Manajemen Masjid <Sparkles className="h-8 w-8 text-amber-500" />
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Pilih paket langganan terbaik. Nikmati fitur premium dan dukung digitalisasi masjid di Indonesia.
        </p>
      </div>

      {/* Voucher Input Section */}
      <div className="max-w-md mx-auto bg-card border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
           <Ticket className="h-4 w-4 text-primary" />
           Punya Kode Voucher?
        </div>
        <div className="flex gap-2">
           <Input 
             placeholder="Masukkan kode promo..." 
             value={voucherCode} 
             onChange={e => setVoucherCode(e.target.value)}
             className="uppercase font-bold tracking-widest placeholder:tracking-normal placeholder:font-normal"
           />
           <Button onClick={checkVoucher} disabled={checkingVoucher || appliedVoucher}>
             {appliedVoucher ? "Terpasang" : "Cek"}
           </Button>
        </div>
        {appliedVoucher && (
          <div className="mt-3 bg-emerald-50 text-emerald-700 text-xs py-2 px-3 rounded-lg border border-emerald-100 flex items-center justify-between">
             <span className="flex items-center gap-2 italic">
               <Tag className="h-3 w-3" /> 
               Diskon {appliedVoucher.type === 'percentage' ? (appliedVoucher.discount * 100) + '%' : formatCurrency(appliedVoucher.discount)} aktif!
             </span>
             <button onClick={() => {setAppliedVoucher(null); setVoucherCode("");}} className="hover:underline font-bold">Hapus</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {plans.map((plan) => {
          const Icon = plan.icon || Package;
          const features = plan.features ? (typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features) : [];
          
          let finalPrice = plan.price || 0;
          if (appliedVoucher) {
            if (appliedVoucher.type === 'percentage') finalPrice = finalPrice * (1 - appliedVoucher.discount);
            else finalPrice = Math.max(0, finalPrice - appliedVoucher.discount);
          }

          return (
            <div 
              key={plan.id}
              className={`relative bg-card border flex flex-col rounded-2xl p-5 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 group ${plan.recommended ? 'ring-2 ring-primary border-primary bg-primary/5' : ''}`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                  Terpopuler
                </div>
              )}
              
              <div className={`w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <Icon className={`h-5 w-5 text-primary`} />
              </div>

              <h3 className="font-bold text-lg mb-1">{plan.name || plan.plan}</h3>
              <p className="text-[10px] text-muted-foreground mb-4 line-clamp-2 leading-relaxed">{plan.description}</p>
              
              <div className="mb-6">
                {plan.original_price > plan.price && (
                   <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-slate-400 line-through">
                        {formatCurrency(plan.original_price)}
                      </span>
                      <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-emerald-100 text-emerald-700 border-none font-bold">
                        Hemat {Math.round((1 - plan.price / plan.original_price) * 100)}%
                      </Badge>
                   </div>
                )}
                {appliedVoucher && (
                   <div className="flex flex-col mb-1 animate-in fade-in slide-in-from-left-2 transition-all">
                      <span className="text-xs text-slate-400 line-through">
                        {formatCurrency(plan.price)}
                      </span>
                      <Badge variant="secondary" className="w-fit text-[9px] py-0 px-1 bg-amber-100 text-amber-700 border-none font-bold">Voucher Aktif</Badge>
                   </div>
                )}
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-slate-900">{formatCurrency(finalPrice)}</span>
                  <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Per {plan.duration}</span>
                </div>
              </div>

              <div className="space-y-2 mb-8 flex-1">
                {plan.plan === 'enterprise' && (
                  <>
                    <div className="flex items-start gap-2 text-[11px] font-bold text-primary">
                      <Sparkles className="h-3 w-3 mt-1 flex-shrink-0" />
                      <span>✓ Update Kustom Domain Mandiri</span>
                    </div>
                    <div className="flex items-start gap-2 text-[11px] font-bold text-slate-800">
                      <ShieldCheck className="h-3 w-3 text-primary mt-1 flex-shrink-0" />
                      <span>✓ Team Support Khusus</span>
                    </div>
                  </>
                )}
                {plan.plan !== 'enterprise' && plan.plan !== 'trial' && (
                  <div className="flex items-start gap-2 text-[11px] font-bold text-slate-700">
                     <Check className="h-3 w-3 text-emerald-500 mt-1 flex-shrink-0" />
                     <span>✓ Team Support Cepat</span>
                  </div>
                )}
                {features.slice(0, plan.plan === 'enterprise' ? 12 : 8).map((f, i) => {
                  if (f === "Update Kustom Domain Mandiri" && plan.plan !== 'enterprise') return null;
                  if (f === "Team Support Cepat" || f === "Team Support Khusus") return null;
                  return (
                    <div key={i} className="flex items-start gap-2 text-[11px]">
                      <Check className="h-3 w-3 text-sky-500 mt-1 flex-shrink-0" />
                      <span className="text-slate-600 line-clamp-1">{f}</span>
                    </div>
                  );
                })}
              </div>

              <Button 
                onClick={() => handleUpgrade(plan.plan, plan.name, finalPrice)}
                disabled={loading}
                className={`w-full font-bold rounded-xl h-10 transition-all ${plan.recommended ? 'shadow-lg shadow-primary/30' : 'variant-outline'}`}
                variant={plan.recommended ? "default" : "outline"}
                size="sm"
              >
                Pilih Paket
              </Button>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-900 text-slate-100 rounded-3xl p-8 md:p-12 relative overflow-hidden text-center md:text-left shadow-2xl">
        <Sparkles className="absolute top-4 right-4 h-24 w-24 text-white/10 rotate-12" />
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">Butuh Penyesuaian Khusus?</h2>
          <p className="text-slate-400 text-lg mb-8">
            Hubungi tim layanan kami untuk penawaran kustom bagi yayasan masjid besar atau panti asuhan yang membutuhkan fitur khusus.
          </p>
          <Button variant="secondary" className="font-bold rounded-xl px-10 h-12" onClick={() => window.open('https://wa.me/628123456789', '_blank')}>
            Konsultasi Admin
          </Button>
        </div>
      </div>
    </div>
  );
}
