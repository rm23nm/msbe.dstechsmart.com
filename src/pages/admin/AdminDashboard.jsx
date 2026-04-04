import { useState, useEffect } from "react";
import { smartApi, apiClient } from "@/api/apiClient";
import { formatCurrency } from "@/lib/formatCurrency";
import StatCard from "../../components/StatCard";
import PageHeader from "../../components/PageHeader";
import { Button } from "@/components/ui/button";
import { Building2, Users, CreditCard, TrendingUp, Send } from "lucide-react";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(152, 55%, 28%)', 'hsl(42, 85%, 55%)', 'hsl(200, 60%, 45%)', 'hsl(280, 50%, 55%)'];

export default function AdminDashboard() {
  const [mosques, setMosques] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States for Telegram Broadcast
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [m, u] = await Promise.all([
      smartApi.entities.Mosque.list(),
      smartApi.entities.User.list(),
    ]);
    setMosques(m);
    setUsers(u);
    setLoading(false);
  }

  async function sendBroadcast() {
    if (!broadcastTitle || !broadcastMsg) return;
    setSendingBroadcast(true);
    try {
      const res = await apiClient.post("/integrations/telegram/broadcast", {
        title: broadcastTitle,
        message: broadcastMsg
      });
      alert(res.data.message || "Pesan broadcast berhasil dikirim!");
      setBroadcastTitle("");
      setBroadcastMsg("");
    } catch (error) {
      alert("Gagal mengirim broadcast: " + (error.response?.data?.error || error.message));
    }
    setSendingBroadcast(false);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const activeMosques = mosques.filter(m => m.status === 'active' || !m.status).length;
  const subscriptionData = [
    { name: 'Trial', value: mosques.filter(m => m.subscription_plan === 'trial' || !m.subscription_plan).length },
    { name: 'Bulanan', value: mosques.filter(m => m.subscription_plan === 'monthly').length },
    { name: 'Tahunan', value: mosques.filter(m => m.subscription_plan === 'yearly').length },
  ].filter(d => d.value > 0);

  const monthlyRevenue = mosques.reduce((sum, m) => {
    if (m.subscription_plan === 'monthly') return sum + 150000;
    if (m.subscription_plan === 'yearly') return sum + 125000;
    return sum;
  }, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard Admin" description="Ringkasan pengelolaan aplikasi" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Masjid" value={mosques.length} icon={Building2} subtitle={`${activeMosques} aktif`} />
        <StatCard title="Total Pengguna" value={users.length} icon={Users} />
        <StatCard title="Pendapatan Bulanan" value={formatCurrency(monthlyRevenue)} icon={TrendingUp} trendUp />
        <StatCard title="Langganan Aktif" value={mosques.filter(m => m.subscription_status === 'active').length} icon={CreditCard} />
      </div>

      {/* Broadcast System Update Section */}
      <div className="bg-card rounded-xl border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Send className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Broadcast Update Sistem (Telegram)</h3>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            Kirim pesan pembaruan otomatis ke seluruh grup Telegram masjid yang sudah mengaktifkan bot.
          </p>
          <div>
            <label className="text-xs font-semibold mb-1 block">Judul Update / Versi</label>
            <input 
              type="text" 
              value={broadcastTitle} 
              onChange={e => setBroadcastTitle(e.target.value)} 
              placeholder="Contoh: Update Versi 1.5 - Fitur Absensi & Analitik" 
              className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
            />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block">Isi Pesan (Bisa pakai emoji)</label>
            <textarea 
              rows={4}
              value={broadcastMsg} 
              onChange={e => setBroadcastMsg(e.target.value)} 
              placeholder="Contoh: Halo Jamaah! Kami baru saja menambahkan fitur cetak absensi dan..." 
              className="w-full px-3 py-2 border rounded-lg text-sm bg-background resize-none"
            />
          </div>
          <Button onClick={sendBroadcast} disabled={sendingBroadcast || !broadcastTitle || !broadcastMsg} className="w-full sm:w-auto gap-2">
            {sendingBroadcast ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="h-4 w-4" />}
            {sendingBroadcast ? "Mengirim..." : "Kirim Broadcast Sekarang"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Distribution */}
        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-semibold mb-4">Distribusi Langganan</h3>
          <div className="h-[250px]">
            {subscriptionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={subscriptionData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {subscriptionData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">Belum ada data</div>
            )}
          </div>
        </div>

        {/* Recent Mosques */}
        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-semibold mb-4">Masjid Terbaru</h3>
          <div className="space-y-3">
            {mosques.slice(0, 5).map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.city || m.address}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  m.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {m.subscription_plan || 'trial'}
                </span>
              </div>
            ))}
            {mosques.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Belum ada masjid terdaftar</p>}
          </div>
        </div>
      </div>
    </div>
  );
}