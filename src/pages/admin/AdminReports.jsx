import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import { formatCurrency, formatDate } from "@/lib/formatCurrency";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Building2, Users, TrendingUp, Wallet, Download, LayoutDashboard } from "lucide-react";

const COLORS = ['hsl(152, 55%, 28%)', 'hsl(42, 85%, 55%)', 'hsl(200, 60%, 45%)', 'hsl(0, 84%, 60%)'];

export default function AdminReports() {
  const [mosques, setMosques] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [m, u, t, mem] = await Promise.all([
      smartApi.entities.Mosque.list(),
      smartApi.entities.User.list(),
      smartApi.entities.Transaction.list('-date', 1000),
      smartApi.entities.MosqueMember.list(),
    ]);
    setMosques(m); setUsers(u); setTransactions(t); setMembers(mem);
    setLoading(false);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);

  const activeMosques = mosques.filter(m => m.subscription_status === 'active').length;
  const paidMosques = mosques.filter(m => m.subscription_plan === 'monthly' || m.subscription_plan === 'yearly').length;
  const monthlyRevenue = mosques.reduce((sum, m) => {
    if (m.subscription_plan === 'yearly') return sum + (599000 / 12);
    return sum;
  }, 0);

  // Monthly revenue chart
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  const monthlyData = {};
  months.forEach((m, i) => { monthlyData[i + 1] = { name: m, pemasukan: 0, pengeluaran: 0 }; });
  transactions.filter(t => t.date?.startsWith(yearFilter)).forEach(t => {
    const month = new Date(t.date).getMonth() + 1;
    if (monthlyData[month]) {
      if (t.type === 'income') monthlyData[month].pemasukan += t.amount || 0;
      else monthlyData[month].pengeluaran += t.amount || 0;
    }
  });
  const chartData = Object.values(monthlyData);

  // City distribution
  const cityData = {};
  mosques.forEach(m => { const city = m.city || 'Lainnya'; cityData[city] = (cityData[city] || 0) + 1; });
  const cityChartData = Object.entries(cityData).map(([name, value]) => ({ name, jumlah: value })).slice(0, 10);

  const planData = [
    { name: 'Gratis/Trial', value: mosques.filter(m => !m.subscription_plan || m.subscription_plan === 'trial').length },
    { name: 'Berbayar', value: paidMosques },
  ].filter(d => d.value > 0);

  // Download mosque CSV
  function downloadMosques() {
    const rows = [['Nama Masjid', 'Alamat', 'Kota', 'Penanggung Jawab', 'Telepon', 'Email', 'Status', 'Paket', 'Berakhir']];
    mosques.forEach(m => rows.push([
      m.name, m.address || '', m.city || '', '', m.phone || '', m.email || '',
      m.subscription_status || 'trial', m.subscription_plan || 'trial',
      m.subscription_end ? formatDate(m.subscription_end) : '-'
    ]));
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `daftar-client-masjid.csv`; a.click();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Laporan Super Admin" description="Dashboard laporan pengelolaan aplikasi" />

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard"><LayoutDashboard className="h-4 w-4 mr-1" /> Dashboard</TabsTrigger>
          <TabsTrigger value="clients"><Building2 className="h-4 w-4 mr-1" /> Client</TabsTrigger>
          <TabsTrigger value="keuangan"><Wallet className="h-4 w-4 mr-1" /> Keuangan</TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Masjid" value={mosques.length} icon={Building2} subtitle={`${activeMosques} aktif`} />
            <StatCard title="Masjid Berbayar" value={paidMosques} icon={TrendingUp} trendUp />
            <StatCard title="Total Pengguna" value={users.length} icon={Users} />
            <StatCard title="Est. Pendapatan/Bln" value={formatCurrency(monthlyRevenue)} icon={Wallet} trendUp />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border p-5">
              <h3 className="font-semibold mb-4">Distribusi Paket</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={planData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {planData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-card rounded-xl border p-5">
              <h3 className="font-semibold mb-4">Masjid per Kota (Top 10)</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cityChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="jumlah" fill="hsl(42, 85%, 55%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Client Report */}
        <TabsContent value="clients" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={downloadMosques} className="gap-2">
              <Download className="h-4 w-4" /> Download Data Client
            </Button>
          </div>
          <div className="bg-card rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Nama Masjid</th>
                    <th className="text-left px-4 py-3 font-medium">Kota</th>
                    <th className="text-left px-4 py-3 font-medium">Email</th>
                    <th className="text-left px-4 py-3 font-medium">Paket</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Berakhir</th>
                  </tr>
                </thead>
                <tbody>
                  {mosques.map(m => (
                    <tr key={m.id} className="border-t hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{m.name}</td>
                      <td className="px-4 py-3">{m.city || '-'}</td>
                      <td className="px-4 py-3">{m.email || '-'}</td>
                      <td className="px-4 py-3 capitalize">{m.subscription_plan || 'trial'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${m.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                          {m.subscription_status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3">{m.subscription_end ? formatDate(m.subscription_end) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Financial Report */}
        <TabsContent value="keuangan" className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['2024', '2025', '2026'].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">Data transaksi seluruh masjid tahun {yearFilter}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard title="Total Pemasukan" value={formatCurrency(totalIncome)} icon={TrendingUp} trendUp />
            <StatCard title="Total Pengeluaran" value={formatCurrency(totalExpense)} icon={Wallet} />
          </div>
          <div className="bg-card rounded-xl border p-5">
            <h3 className="font-semibold mb-4">Transaksi Bulanan Semua Masjid - {yearFilter}</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={v => (v / 1000000).toFixed(0) + 'jt'} />
                  <Tooltip formatter={v => formatCurrency(v)} />
                  <Bar dataKey="pemasukan" name="Pemasukan" fill="hsl(152, 55%, 28%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pengeluaran" name="Pengeluaran" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
