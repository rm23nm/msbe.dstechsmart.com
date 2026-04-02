import { useState, useEffect } from "react";
import { base44 } from "@/api/apiClient";
import { formatCurrency, formatDate } from "@/lib/formatCurrency";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import { toast } from "sonner";
import { handleSnapPayment } from "@/lib/midtransClient";
import { CreditCard, TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminBilling() {
  const [mosques, setMosques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewRegistration, setShowNewRegistration] = useState(false);
  const [newMosqueName, setNewMosqueName] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [processing, setProcessing] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const data = await base44.entities.Mosque.list('-created_date');
    setMosques(data);
    setLoading(false);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const monthlyPrice = 150000;
  const yearlyPrice = 1500000;

  const activeMonthly = mosques.filter(m => m.subscription_plan === 'monthly' && m.subscription_status === 'active');
  const activeYearly = mosques.filter(m => m.subscription_plan === 'yearly' && m.subscription_status === 'active');
  const expiring = mosques.filter(m => {
    if (!m.subscription_end) return false;
    const end = new Date(m.subscription_end);
    const diff = (end - new Date()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff < 30;
  });

  const totalMRR = (activeMonthly.length * monthlyPrice) + (activeYearly.length * (yearlyPrice / 12));

  async function handleNewRegistration() {
    if (!newMosqueName.trim()) {
      toast.error("Nama masjid harus diisi");
      return;
    }

    setProcessing(true);
    try {
      const price = selectedPlan === 'yearly' ? yearlyPrice : monthlyPrice;
      const mosque = await base44.entities.Mosque.create({
        name: newMosqueName,
        address: "-",
        city: "-",
        slug: newMosqueName.toLowerCase().replace(/\s+/g, '-'),
        subscription_plan: selectedPlan,
        subscription_status: "pending",
        status: "active"
      });

      // Panggil backend untuk generate Snap Token dari Midtrans
      const snapResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate Midtrans Snap token untuk pembayaran masjid. Gunakan hanya untuk testing/demo.`,
      });

      await handleSnapPayment({
        mosque_id: mosque.id,
        order_id: `SUB-${mosque.id}-${Date.now()}`,
        amount: price,
        customer_name: newMosqueName,
        customer_email: "admin@masjid.local",
        success: async (result) => {
          await base44.entities.Mosque.update(mosque.id, {
            subscription_status: "active",
            subscription_start: new Date().toISOString(),
            subscription_end: new Date(Date.now() + (selectedPlan === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()
          });
          await base44.entities.Payment.create({
            mosque_id: mosque.id,
            transaction_type: "subscription",
            reference_id: mosque.id,
            midtrans_order_id: result.order_id || `SUB-${mosque.id}-${Date.now()}`,
            amount: price,
            status: "settlement",
            payer_name: newMosqueName,
            midtrans_response: result
          });
          toast.success(`Masjid ${newMosqueName} berhasil didaftarkan dan aktif!`);
          setShowNewRegistration(false);
          setNewMosqueName("");
          await loadData();
        },
        error: async () => {
          // Jika pembayaran gagal, hapus mosque yang pending
          await base44.entities.Mosque.delete(mosque.id);
          toast.error("Pembayaran dibatalkan");
        },
        pending: () => toast.info("Pembayaran pending...")
      });
    } catch (err) {
      toast.error("Gagal membuat transaksi: " + err.message);
    } finally {
      setProcessing(false);
    }
  }

  async function handleRenewal(mosqueName, mosqueId) {
    setProcessing(true);
    try {
      const price = selectedPlan === 'yearly' ? yearlyPrice : monthlyPrice;

      await handleSnapPayment({
        mosque_id: mosqueId,
        order_id: `RNW-${mosqueId}-${Date.now()}`,
        amount: price,
        customer_name: mosqueName,
        customer_email: "admin@masjid.local",
        success: async (result) => {
          const newEnd = new Date(Date.now() + (selectedPlan === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString();
          await base44.entities.Mosque.update(mosqueId, {
            subscription_status: "active",
            subscription_end: newEnd
          });
          await base44.entities.Payment.create({
            mosque_id: mosqueId,
            transaction_type: "subscription",
            reference_id: mosqueId,
            midtrans_order_id: result.order_id || `RNW-${mosqueId}-${Date.now()}`,
            amount: price,
            status: "settlement",
            payer_name: mosqueName,
            midtrans_response: result
          });
          toast.success(`Langganan ${mosqueName} berhasil diperpanjang!`);
          await loadData();
        },
        error: () => toast.error("Pembayaran dibatalkan"),
        pending: () => toast.info("Pembayaran pending...")
      });
    } catch (err) {
      toast.error("Gagal membuat transaksi: " + err.message);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Billing" description="Kelola langganan dan pembayaran" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="MRR (Monthly)" value={formatCurrency(totalMRR)} icon={TrendingUp} trendUp />
        <StatCard title="Langganan Bulanan" value={activeMonthly.length} icon={CreditCard} subtitle={formatCurrency(monthlyPrice) + '/bln'} />
        <StatCard title="Langganan Tahunan" value={activeYearly.length} icon={CreditCard} subtitle={formatCurrency(yearlyPrice) + '/thn'} />
        <StatCard title="Segera Berakhir" value={expiring.length} icon={AlertCircle} subtitle="< 30 hari" />
      </div>

      {/* New Registration Dialog */}
      {showNewRegistration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full border">
            <h3 className="text-lg font-semibold mb-4">Registrasi Masjid Baru</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama Masjid</label>
                <input type="text" value={newMosqueName} onChange={e => setNewMosqueName(e.target.value)} placeholder="Masjid Al-Ikhlas" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Paket Langganan</label>
                <div className="flex gap-2">
                  {['yearly', 'monthly'].map(p => (
                    <button key={p} onClick={() => setSelectedPlan(p)} className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${selectedPlan === p ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-muted'}`}>
                      {p === 'yearly' ? 'Tahunan' : 'Bulanan'} ({formatCurrency(p === 'yearly' ? yearlyPrice : monthlyPrice)})
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => { setShowNewRegistration(false); setNewMosqueName(""); }} className="flex-1 px-4 py-2 rounded-lg border hover:bg-muted transition-colors text-sm font-medium">Batal</button>
                <button onClick={handleNewRegistration} disabled={processing} className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm font-medium">{processing ? "Memproses..." : "Lanjut Bayar"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Detail Langganan Masjid</h3>
          <button onClick={() => setShowNewRegistration(true)} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">+ Registrasi Baru</button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Masjid</TableHead>
                <TableHead>Paket</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mulai</TableHead>
                <TableHead>Berakhir</TableHead>
                <TableHead className="text-right">Harga</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
             {mosques.map(m => {
               const isExpired = m.subscription_end && new Date(m.subscription_end) < new Date();
               return (
                 <TableRow key={m.id}>
                   <TableCell className="font-medium">{m.name}</TableCell>
                   <TableCell><Badge variant="secondary" className="capitalize">{m.subscription_plan || 'trial'}</Badge></TableCell>
                   <TableCell>
                     <Badge variant={m.subscription_status === 'active' && !isExpired ? 'default' : isExpired ? 'destructive' : 'secondary'}>
                       {isExpired ? 'expired' : m.subscription_status || 'trial'}
                     </Badge>
                   </TableCell>
                   <TableCell className="text-sm">{formatDate(m.subscription_start)}</TableCell>
                   <TableCell className="text-sm">{formatDate(m.subscription_end)}</TableCell>
                   <TableCell className="text-right">
                     {isExpired ? (
                       <button onClick={() => handleRenewal(m.name, m.id)} disabled={processing} className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 disabled:opacity-50 transition-colors">{processing ? 'Memproses...' : 'Perpanjang'}</button>
                     ) : (
                       <span className="text-sm font-medium">{m.subscription_plan === 'monthly' ? formatCurrency(monthlyPrice) : m.subscription_plan === 'yearly' ? formatCurrency(yearlyPrice) : '-'}</span>
                     )}
                   </TableCell>
                 </TableRow>
               );
             })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}