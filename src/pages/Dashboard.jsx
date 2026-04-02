import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import { useMosqueContext } from "@/lib/useMosqueContext";
import { formatCurrency } from "@/lib/formatCurrency";
import StatCard from "../components/StatCard";
import MosqueSwitcher from "../components/MosqueSwitcher";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import UpcomingActivities from "../components/dashboard/UpcomingActivities";
import CashFlowChart from "../components/dashboard/CashFlowChart";
import AnnouncementsList from "../components/dashboard/AnnouncementsList";
import { TrendingUp, TrendingDown, PiggyBank, Calendar, Landmark } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { currentMosque, loading, mosques, switchMosque, isPengurus } = useMosqueContext();
  const [transactions, setTransactions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (currentMosque) loadData();
  }, [currentMosque]);

  async function loadData() {
    setDataLoading(true);
    const [txns, acts, anns] = await Promise.all([
      smartApi.entities.Transaction.filter({ mosque_id: currentMosque.id }, '-date', 50),
      smartApi.entities.Activity.filter({ mosque_id: currentMosque.id }, '-date', 10),
      smartApi.entities.Announcement.filter({ mosque_id: currentMosque.id, status: 'published' }, '-created_date', 5),
    ]);
    setTransactions(txns);
    setActivities(acts);
    setAnnouncements(anns);
    setDataLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentMosque) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center h-[50vh]">
        <div className="bg-primary/10 p-4 rounded-full mb-4 text-primary">
          <Landmark className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Belum Terdaftar di Masjid Manapun</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Silakan kembali ke halaman utama atau Portofolio Masjid untuk bergabung sebagai jamaah.
        </p>
        <Link to="/">
          <Button variant="default">Cari Masjid di Halaman Utama</Button>
        </Link>
      </div>
    );
  }

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  // This month
  const now = new Date();
  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthIncome = thisMonth.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const monthExpense = thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">{currentMosque.name}</p>
        </div>
        <MosqueSwitcher mosques={mosques} currentMosque={currentMosque} onSwitch={switchMosque} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Saldo Kas"
          value={formatCurrency(balance)}
          icon={PiggyBank}
          subtitle="Total keseluruhan"
        />
        <StatCard
          title="Pemasukan Bulan Ini"
          value={formatCurrency(monthIncome)}
          icon={TrendingUp}
          trend={`${transactions.filter(t => t.type === 'income').length} transaksi`}
          trendUp
        />
        <StatCard
          title="Pengeluaran Bulan Ini"
          value={formatCurrency(monthExpense)}
          icon={TrendingDown}
          trend={`${transactions.filter(t => t.type === 'expense').length} transaksi`}
        />
        <StatCard
          title="Kegiatan Mendatang"
          value={activities.filter(a => a.status === 'upcoming').length}
          icon={Calendar}
          subtitle="Kegiatan terjadwal"
        />
      </div>

      {/* Charts & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CashFlowChart transactions={transactions} />
        </div>
        <div>
          <AnnouncementsList announcements={announcements} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions transactions={transactions.slice(0, 5)} />
        <UpcomingActivities activities={activities.filter(a => a.status === 'upcoming').slice(0, 5)} />
      </div>
    </div>
  );
}