import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { smartApi } from "@/api/apiClient";
import { useMosqueContext } from "@/lib/useMosqueContext";
import { formatCurrency } from "@/lib/formatCurrency";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calculator, HeartHandshake, History, TrendingUp, 
  Coins, Wallet, Building2, Plus, ArrowRightLeft, UserCheck 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// --- CHILD COMPONENT: ZAKAT CALCULATOR ---
const ZakatCalculator = () => {
  const [wealth, setWealth] = useState(0);
  const [goldPrice, setGoldPrice] = useState(1250000); // Sample Gold Price
  const nisab = goldPrice * 85;
  const isObliged = wealth >= nisab;
  const zakatAmount = isObliged ? wealth * 0.025 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50/50 to-white">
        <CardHeader>
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white mb-2 shadow-lg shadow-emerald-200">
            <Calculator className="w-5 h-5" />
          </div>
          <CardTitle>Kalkulator Zakat Maal</CardTitle>
          <CardDescription>Hitung kewajiban zakat harta Bapak berdasarkan Nisab (85g Emas)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Harta (Tabungan+Aset)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
              <input 
                type="number" 
                className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 font-black text-xl focus:border-emerald-500 transition-all outline-none"
                placeholder="0"
                value={wealth || ''}
                onChange={(e) => setWealth(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="p-4 bg-white/50 border border-slate-100 rounded-2xl flex justify-between items-center">
            <p className="text-xs font-bold text-slate-500">Harga Emas Hari Ini (Asumsi)</p>
            <p className="font-black text-emerald-600">{formatCurrency(goldPrice)}/g</p>
          </div>
          <div className="space-y-2">
             <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                <span>Nisab (85g): {formatCurrency(nisab)}</span>
                <span className={isObliged ? "text-emerald-600" : "text-slate-400"}>
                  {isObliged ? "Wajib Zakat" : "Belum Wajib"}
                </span>
             </div>
             <Progress value={Math.min((wealth/nisab)*100, 100)} className="h-2 bg-slate-100" />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col justify-center items-center text-center p-8 bg-emerald-900 rounded-[2.5rem] text-white shadow-2xl shadow-emerald-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Coins className="w-48 h-48" /></div>
        <h3 className="text-lg font-bold opacity-70 mb-4 uppercase tracking-widest">Kewajiban Zakat Bapak</h3>
        <AnimatePresence mode="wait">
          <motion.div 
            key={zakatAmount}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl font-black mb-6 tracking-tighter"
          >
            {formatCurrency(zakatAmount)}
          </motion.div>
        </AnimatePresence>
        <p className="text-sm opacity-60 max-w-xs leading-relaxed font-medium">
          {isObliged 
            ? "Harta Bapak telah melampaui Nisab. Inilah jumlah zakat (2.5%) yang perlu Bapak tunaikan."
            : "Harta Bapak belum melampaui Nisab. Nominal di atas hanyalah ilustrasi jika Bapak ingin berinfaq."}
        </p>
        <Button className="mt-8 bg-white text-emerald-900 hover:bg-emerald-50 font-black rounded-2xl px-10 py-6 h-auto shadow-xl">
           Tunaikan Zakat Sekarang
        </Button>
      </div>
    </div>
  );
};

// --- MAIN PAGE ---
export default function ZakatCenter() {
  const { currentMosque, loading, isBendahara } = useMosqueContext();
  const [donations, setDonations] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (currentMosque) loadData();
  }, [currentMosque]);

  async function loadData() {
    setDataLoading(true);
    try {
      const [dns, txns] = await Promise.all([
        smartApi.entities.Donation.filter({ mosque_id: currentMosque.id, status: 'approved' }),
        smartApi.entities.Transaction.filter({ mosque_id: currentMosque.id, category: 'Saluran Zakat' })
      ]);
      setDonations(dns.filter(d => d.category?.toLowerCase().includes('zakat')));
      setDistributions(txns);
    } catch (e) { console.error(e); }
    setDataLoading(false);
  }

  const totalCollected = donations.reduce((s, d) => s + (d.amount || 0), 0);
  const totalDistributed = distributions.reduce((s, t) => s + (t.amount || 0), 0);
  const balance = totalCollected - totalDistributed;

  if (loading) return <div className="p-12 text-center animate-pulse">Memuat Zakat Center...</div>;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <PageHeader title="Zakat Center" description="Sentral pengelolaan & kalkulator zakat masjid">
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl border-emerald-600 text-emerald-600 font-bold">
            <Plus className="w-4 h-4 mr-2" /> Catat Penerimaan
          </Button>
          <Button className="rounded-xl bg-emerald-600 font-bold">
            <ArrowRightLeft className="w-4 h-4 mr-2" /> Salurkan Zakat
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard title="Saldo Zakat Tersedia" value={formatCurrency(balance)} icon={Building2} />
        <StatCard title="Total Penerimaan" value={formatCurrency(totalCollected)} icon={TrendingUp} trendUp />
        <StatCard title="Total Penyaluran" value={formatCurrency(totalDistributed)} icon={HeartHandshake} />
      </div>

      <Tabs defaultValue="calculator" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-2xl w-full sm:w-auto h-auto">
          <TabsTrigger value="calculator" className="rounded-xl py-3 px-6 font-bold flex gap-2">
            <Calculator className="w-4 h-4" /> Kalkulator
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl py-3 px-6 font-bold flex gap-2">
            <History className="w-4 h-4" /> Riwayat & Mutasi
          </TabsTrigger>
          <TabsTrigger value="mustahik" className="rounded-xl py-3 px-6 font-bold flex gap-2">
            <UserCheck className="w-4 h-4" /> Daftar Mustahik
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator">
          <ZakatCalculator />
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-none shadow-sm overflow-hidden rounded-[2rem]">
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Tanggal</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Muzakki / Keterangan</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Kategori</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {donations.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs tabular-nums text-slate-500">{new Date(d.created_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{d.donor_name || 'Hamba Allah'}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase">{d.payment_method}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">
                          {d.category || 'Zakat'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-emerald-600">{formatCurrency(d.amount)}</td>
                    </tr>
                  ))}
                  {donations.length === 0 && (
                    <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic">Belum ada mutasi zakat tercatat.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="mustahik">
          <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
             <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                <UserCheck className="w-8 h-8 text-slate-300" />
             </div>
             <h3 className="text-xl font-black text-slate-900">Database Mustahik</h3>
             <p className="text-sm text-slate-500 max-w-sm mt-2">Daftar penerima manfaat zakat agar penyaluran tepat sasaran. Fitur ini akan segera tersedia.</p>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="bg-emerald-50 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-6 border-2 border-emerald-100">
         <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-200">
            <Coins className="w-8 h-8" />
         </div>
         <div className="flex-1 text-center md:text-left">
            <h4 className="text-xl font-black text-emerald-900">Amanah & Transparan</h4>
            <p className="text-sm text-emerald-700/70 font-medium leading-relaxed">
              Zakat Center MasjidKu Smart dikembangkan untuk memudahkan pengurus mengelola dana titipan umat mulai dari pencatatan hingga penyaluran dengan standarisasi laporan keuangan masjid.
            </p>
         </div>
         <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold px-8 py-4 h-auto rounded-2xl shadow-lg shadow-emerald-200">
            Export Laporan Zakat
         </Button>
      </div>
    </div>
  );
}
