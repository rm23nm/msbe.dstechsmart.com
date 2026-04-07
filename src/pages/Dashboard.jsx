import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { smartApi } from "@/api/apiClient";
import { useMosqueContext } from "@/lib/useMosqueContext";
import { formatCurrency } from "@/lib/formatCurrency";
import StatCard from "../components/StatCard";
import MosqueSwitcher from "../components/MosqueSwitcher";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import UpcomingActivities from "../components/dashboard/UpcomingActivities";
import FinancialChart from "../components/dashboard/FinancialChart";
import AnnouncementsList from "../components/dashboard/AnnouncementsList";
import RecentActivity from "../components/dashboard/RecentActivity";
import { TrendingUp, TrendingDown, PiggyBank, Calendar, Landmark, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Simple Animated Number Component for a Premium Feel
const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const end = parseInt(value.toString().replace(/[^0-9]/g, "")) || 0;
    if (start === end) {
      setDisplayValue(value);
      return;
    }
    
    let duration = 1200;
    let startTime = null;

    function animate(currentTime) {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const current = Math.floor(progress * (end - start) + start);
      
      if (typeof value === 'string' && (value.includes('Rp') || value.includes('IDR'))) {
        setDisplayValue(formatCurrency(current));
      } else {
        setDisplayValue(current);
      }
      
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [value]);

  return <span>{displayValue}</span>;
};

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
    try {
      const [txns, acts, anns] = await Promise.all([
        smartApi.entities.Transaction.filter({ mosque_id: currentMosque.id }, '-date', 50),
        smartApi.entities.Activity.filter({ mosque_id: currentMosque.id }, '-date', 10),
        smartApi.entities.Announcement.filter({ mosque_id: currentMosque.id, status: 'published' }, '-created_date', 5),
      ]);
      setTransactions(txns || []);
      setActivities(acts || []);
      setAnnouncements(anns || []);
    } catch (e) {
      console.error(e);
    } finally {
      setDataLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse text-sm">Memuat Dashboard Masjid...</p>
      </div>
    );
  }

  if (!currentMosque) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 text-center h-[60vh]"
      >
        <div className="bg-primary/10 p-5 rounded-3xl mb-4 text-primary animate-bounce shadow-xl shadow-primary/10">
          <Landmark className="w-12 h-12" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Belum Memilih Masjid</h3>
        <p className="text-muted-foreground mb-8 max-w-sm">
          Silakan cari masjid atau gunakan daftar yang tersedia untuk mulai mengelola.
        </p>
        <Link to="/cari-masjid">
          <Button variant="default" className="rounded-2xl px-8 h-12 font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all">
            Cari Masjid Sekarang
          </Button>
        </Link>
      </motion.div>
    );
  }

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  const now = new Date();
  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthIncome = thisMonth.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const monthExpense = thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: idx => ({
      opacity: 1, 
      y: 0,
      transition: { delay: idx * 0.1, duration: 0.5, ease: "easeOut" }
    })
  };

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      className="space-y-6 pb-12"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-extrabold tracking-tight">Assalamu'alaikum!</h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Pengelola {currentMosque.name}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <MosqueSwitcher mosques={mosques} currentMosque={currentMosque} onSwitch={switchMosque} />
        </motion.div>
      </div>

      {currentMosque?.subscription_end && new Date(currentMosque.subscription_end) < new Date() && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-destructive/10 border-2 border-destructive/20 rounded-2xl p-5 flex items-center gap-4 text-destructive shadow-lg overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Sparkles className="w-24 h-24 rotate-12" />
          </div>
          <Landmark className="h-8 w-8 shrink-0" />
          <div className="flex-1 text-sm font-bold">
            Masa aktif paket <span className="underline">{currentMosque?.subscription_plan}</span> telah habis. 
            <p className="font-normal opacity-80">Akses fitur manajemen dibatasi sementara.</p>
          </div>
          <Link to="/paket" className="shrink-0">
            <Button variant="default" className="bg-destructive hover:bg-destructive/90 text-white font-bold rounded-xl shadow-xl shadow-destructive/20 hover:scale-105 transition-all">
              Beli Lisensi
            </Button>
          </Link>
        </motion.div>
      )}

      {/* Stats with Animation Group */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Kas Utama", value: formatCurrency(balance), icon: PiggyBank, sub: "Saldo Keseluruhan" },
          { title: "Infaq/Masuk", value: formatCurrency(monthIncome), icon: TrendingUp, up: true, trend: `${thisMonth.filter(t=>t.type==='income').length} Transaksi` },
          { title: "Biaya/Keluar", value: formatCurrency(monthExpense), icon: TrendingDown, trend: `${thisMonth.filter(t=>t.type==='expense').length} Transaksi` },
          { title: "Agenda", value: activities.filter(a => a.status === 'upcoming').length, icon: Calendar, sub: "Kegiatan Mendatang" },
        ].map((s, i) => (
          <motion.div key={i} custom={i} variants={cardVariants}>
            <StatCard
              title={s.title}
              value={<AnimatedNumber value={s.value} />}
              icon={s.icon}
              subtitle={s.sub || s.trend}
              trendUp={s.up}
              className="border-none shadow-sm hover:shadow-md transition-shadow bg-card/60 backdrop-blur-sm"
            />
          </motion.div>
        ))}
      </div>

      {/* Charts & Recent Activities - Smooth entries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2">
          <div className="bg-card/60 backdrop-blur-sm rounded-3xl border p-6 h-full shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-extrabold text-lg tracking-tight">Tren Arus Kas</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-tight">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Data
                </div>
              </div>
            </div>
            <FinancialChart transactions={transactions} height={320} />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <AnnouncementsList announcements={announcements} />
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <RecentTransactions transactions={transactions.slice(0, 5)} />
        <UpcomingActivities activities={activities.filter(a => a.status === 'upcoming').slice(0, 5)} />
      </motion.div>

      {/* Audit Log / Recent Activity - LOCKED to mosque */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-1 gap-6"
      >
         <RecentActivity mosqueId={currentMosque.id} limit={5} showFilter={false} />
      </motion.div>
    </motion.div>
  );
}
