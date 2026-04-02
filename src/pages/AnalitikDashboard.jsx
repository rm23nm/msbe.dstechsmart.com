import { useState, useEffect } from "react";
import { base44 } from "@/api/apiClient";
import { useMosqueContext } from "@/lib/useMosqueContext";
import PageHeader from "@/components/PageHeader";
import { formatCurrency } from "@/lib/formatCurrency";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, TrendingDown, Users, Calendar, Package } from "lucide-react";

const COLORS = ["#2d6a4f", "#f0a500", "#e74c3c", "#3498db", "#9b59b6", "#1abc9c"];

export default function AnalitikDashboard() {
  const { currentMosque, loading } = useMosqueContext();
  const [transactions, setTransactions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [members, setMembers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    if (!currentMosque?.id) return;
    Promise.all([
      base44.entities.Transaction.filter({ mosque_id: currentMosque.id }, '-date', 200),
      base44.entities.Activity.filter({ mosque_id: currentMosque.id }, '-date', 100),
      base44.entities.MosqueMember.filter({ mosque_id: currentMosque.id }),
      base44.entities.Announcement.filter({ mosque_id: currentMosque.id }),
      base44.entities.Asset.filter({ mosque_id: currentMosque.id }),
    ]).then(([txns, acts, mems, anns, ast]) => {
      setTransactions(txns);
      setActivities(acts);
      setMembers(mems);
      setAnnouncements(anns);
      setAssets(ast);
    });
  }, [currentMosque?.id]);

  if (loading || !currentMosque) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  // Monthly cash flow (last 6 months)
  const monthlyData = (() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
      const income = transactions.filter(t => t.type === 'income' && t.date?.startsWith(key)).reduce((s, t) => s + (t.amount || 0), 0);
      const expense = transactions.filter(t => t.type === 'expense' && t.date?.startsWith(key)).reduce((s, t) => s + (t.amount || 0), 0);
      months.push({ label, income, expense });
    }
    return months;
  })();

  // Activity type distribution
  const activityTypes = activities.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {});
  const activityPieData = Object.entries(activityTypes).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));

  // Member role distribution
  const roleData = members.reduce((acc, m) => {
    const label = { admin_masjid: 'Admin', bendahara: 'Bendahara', pengurus: 'Pengurus', jamaah: 'Jamaah' }[m.role] || m.role;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
  const rolePieData = Object.entries(roleData).map(([name, value]) => ({ name, value }));

  // Income categories
  const incomeCategories = transactions.filter(t => t.type === 'income').reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});
  const incomeCatData = Object.entries(incomeCategories).slice(0, 5).map(([name, value]) => ({ name, value }));

  const stats = [
    { label: "Total Pemasukan", value: formatCurrency(totalIncome), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total Pengeluaran", value: formatCurrency(totalExpense), icon: TrendingDown, color: "text-red-500", bg: "bg-red-50" },
    { label: "Saldo Kas", value: formatCurrency(balance), icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
    { label: "Anggota", value: members.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Kegiatan", value: activities.length, icon: Calendar, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Aset", value: assets.length, icon: Package, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Analitik" description="Ringkasan statistik dan kinerja masjid" />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-card rounded-xl border p-4">
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                <Icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="font-bold text-sm mt-0.5">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Monthly Cash Flow Chart */}
      <div className="bg-card rounded-xl border p-6">
        <h3 className="font-semibold mb-4">Arus Kas 6 Bulan Terakhir</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000000).toFixed(0)}jt`} />
            <Tooltip formatter={v => formatCurrency(v)} />
            <Legend />
            <Bar dataKey="income" name="Pemasukan" fill="#2d6a4f" radius={[4,4,0,0]} />
            <Bar dataKey="expense" name="Pengeluaran" fill="#e74c3c" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {activityPieData.length > 0 && (
          <div className="bg-card rounded-xl border p-5">
            <h3 className="font-semibold mb-3 text-sm">Jenis Kegiatan</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={activityPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({ name, percent }) => `${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {activityPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {rolePieData.length > 0 && (
          <div className="bg-card rounded-xl border p-5">
            <h3 className="font-semibold mb-3 text-sm">Komposisi Anggota</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={rolePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({ name, percent }) => `${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {rolePieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {incomeCatData.length > 0 && (
          <div className="bg-card rounded-xl border p-5">
            <h3 className="font-semibold mb-3 text-sm">Sumber Pemasukan</h3>
            <div className="space-y-2 mt-2">
              {incomeCatData.map((d, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="capitalize">{d.name}</span>
                    <span className="font-medium">{formatCurrency(d.value)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(d.value / totalIncome * 100).toFixed(0)}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-card rounded-xl border p-6">
        <h3 className="font-semibold mb-4">10 Transaksi Terakhir</h3>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada transaksi</p>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 10).map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{t.description || t.category}</p>
                  <p className="text-xs text-muted-foreground">{t.date} • {t.category}</p>
                </div>
                <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}