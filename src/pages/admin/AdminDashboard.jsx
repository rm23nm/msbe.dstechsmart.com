import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { smartApi, apiClient } from "@/api/apiClient";
import { formatCurrency } from "@/lib/formatCurrency";
import StatCard from "../../components/StatCard";
import PageHeader from "../../components/PageHeader";
import RecentActivity from "../../components/dashboard/RecentActivity";
import { Button } from "@/components/ui/button";
import { Building2, Users, CreditCard, TrendingUp, Send, PieChart as PieIcon, LineChart as LineIcon } from "lucide-react";
import { 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];

// Simple Animated Number Component
const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const end = parseInt(value.toString().replace(/[^0-9]/g, "")) || 0;
    if (start === end) {
      setDisplayValue(value);
      return;
    }
    
    let duration = 1500;
    let startTime = null;

    function animate(currentTime) {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const current = Math.floor(progress * (end - start) + start);
      
      // format logic
      if (typeof value === 'string' && value.includes('Rp')) {
        setDisplayValue(formatCurrency(current));
      } else {
        setDisplayValue(current);
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }
    requestAnimationFrame(animate);
  }, [value]);

  return <span>{displayValue}</span>;
};

export default function AdminDashboard() {
  const [mosques, setMosques] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [m, u] = await Promise.all([
        smartApi.entities.Mosque.list(),
        smartApi.entities.User.list(),
      ]);
      setMosques(m || []);
      setUsers(u || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      <p className="text-muted-foreground animate-pulse">Menghubungkan ke Pusat...</p>
    </div>
  );

  const mosquesList = Array.isArray(mosques) ? mosques : [];
  const usersList = Array.isArray(users) ? users : [];

  const activeMosques = mosquesList.filter(m => m.status === 'active' || !m.status).length;
  const subscriptionData = [
    { name: 'Trial', value: mosquesList.filter(m => m.subscription_plan === 'trial' || !m.subscription_plan).length },
    { name: 'Bulanan', value: mosquesList.filter(m => m.subscription_plan === 'monthly').length },
    { name: 'Tahunan', value: mosquesList.filter(m => m.subscription_plan === 'yearly').length },
  ].filter(d => d.value > 0);

  const monthlyRevenue = mosquesList.reduce((sum, m) => {
    if (m.subscription_plan === 'monthly') return sum + 150000;
    if (m.subscription_plan === 'yearly') return sum + 125000;
    return sum;
  }, 0);

  // Growth Data Mocking based on actual data
  const growthData = [
    { name: 'Jan', count: Math.floor(mosquesList.length * 0.4) },
    { name: 'Feb', count: Math.floor(mosquesList.length * 0.6) },
    { name: 'Mar', count: Math.floor(mosquesList.length * 0.8) },
    { name: 'Apr', count: mosquesList.length },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={containerVariants}
      className="space-y-8 pb-10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase text-slate-800 font-heading">Pusat Kendali Utama</h1>
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-[0.3em] mt-1 pl-1">MasjidKu Smart Indonesia • Enterprise Tier</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50/50 p-1.5 rounded-2xl border border-emerald-100">
           <Button variant="ghost" size="sm" className="rounded-xl h-10 px-6 font-black italic tracking-tighter uppercase text-xs">Unduh Laporan</Button>
           <Button className="rounded-xl h-10 px-8 bg-slate-900 hover:bg-black text-white font-black italic tracking-tighter uppercase text-xs shadow-lg">Refresh Data</Button>
        </div>
      </div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Masjid" 
          value={<AnimatedNumber value={mosquesList.length} />} 
          icon={Building2} 
          subtitle={`${activeMosques} Terverifikasi`} 
        />
        <StatCard 
          title="Pengguna Sistem" 
          value={<AnimatedNumber value={usersList.length} />} 
          icon={Users} 
          subtitle="Admin & Pengelola"
        />
        <StatCard 
          title="Estimasi MRR" 
          value={<AnimatedNumber value={formatCurrency(monthlyRevenue)} />} 
          icon={TrendingUp} 
          trendUp 
          subtitle="Pendapatan Bulanan"
        />
        <StatCard 
          title="Lisensi Aktif" 
          value={<AnimatedNumber value={mosquesList.filter(m => m.subscription_status === 'active').length} />} 
          icon={CreditCard} 
          subtitle="Siap Operasional"
        />
      </motion.div>



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Trend */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/80 p-8 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000">
            <LineIcon className="w-32 h-32" />
          </div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black italic tracking-tighter text-xl uppercase text-slate-800">Pertumbuhan Ekosistem</h3>
              <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Tren akumulasi masjid terdaftar 2024</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
               <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Subscription Distribution */}
        <motion.div variants={itemVariants} className="bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/80 p-8 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100">
               <PieIcon className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="font-black italic tracking-tighter text-xl uppercase text-slate-800">Distribusi Paket</h3>
          </div>
          <div className="h-[250px] flex-1 relative">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <div className="text-center">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Total</p>
                  <p className="text-2xl font-black italic tracking-tighter text-slate-800">{mosquesList.length}</p>
               </div>
            </div>
            {subscriptionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={subscriptionData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60}
                    outerRadius={80} 
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {subscriptionData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground italic">Belum ada data aktif</div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {subscriptionData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: COLORS[idx % COLORS.length] }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Broadcast System Update Section */}
        <motion.div variants={itemVariants} className="bg-emerald-950 text-emerald-50 rounded-2xl p-6 shadow-lg border-none relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Send className="w-40 h-40" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Send className="h-5 w-5 text-emerald-400" />
              <h3 className="font-bold text-lg">Broadcast Update Sistem</h3>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-emerald-200/80">
                Hubungkan seluruh pengurus masjid melalui update otomatis ke grup Telegram. 
              </p>
              <div className="space-y-3">
                <input 
                  type="text" 
                  value={broadcastTitle} 
                  onChange={e => setBroadcastTitle(e.target.value)} 
                  placeholder="Judul Update (Versi 1.x)" 
                  className="w-full px-4 py-2 bg-emerald-900/50 border border-emerald-800 rounded-xl text-sm placeholder:text-emerald-700 outline-none focus:ring-2 ring-emerald-500"
                />
                <textarea 
                  rows={3}
                  value={broadcastMsg} 
                  onChange={e => setBroadcastMsg(e.target.value)} 
                  placeholder="Isi pesan perkenalan fitur baru..." 
                  className="w-full px-4 py-2 bg-emerald-900/50 border border-emerald-800 rounded-xl text-sm placeholder:text-emerald-700 outline-none focus:ring-2 ring-emerald-500 resize-none"
                />
              </div>
              <Button 
                onClick={async () => {
                  setSendingBroadcast(true);
                  try {
                    await apiClient.post("/integrations/telegram/broadcast", { title: broadcastTitle, message: broadcastMsg });
                    setBroadcastTitle(""); setBroadcastMsg("");
                  } catch (e) {} finally { setSendingBroadcast(false); }
                }} 
                disabled={sendingBroadcast || !broadcastTitle || !broadcastMsg} 
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold gap-2 rounded-xl transition-all active:scale-95"
              >
                {sendingBroadcast ? "Mengirim..." : "Kirim Update Sekarang"}
              </Button>
            </div>
          </div>
        </motion.div>

      </div>

        {/* Recent Mosques Portfolio Style */}
        <motion.div variants={itemVariants} className="bg-card rounded-3xl border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-extrabold text-lg tracking-tight uppercase tracking-widest text-slate-400 text-xs mb-1">Masjid Baru Join</h3>
              <h4 className="font-extrabold text-lg">Ekosistem Baru</h4>
            </div>
            <Button variant="ghost" size="sm" className="text-emerald-600 font-bold hover:text-emerald-700">Lihat Semua</Button>
          </div>
          <div className="space-y-3">
            {mosquesList.slice(0, 4).map((m, idx) => (
              <motion.div 
                key={m.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + (idx * 0.1) }}
                className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                    {m.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-sm line-clamp-1">{m.name}</p>
                    <p className="text-[10px] text-muted-foreground">{m.city || "Lokasi menyusul"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    m.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {m.subscription_plan || 'trial'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Recent Activity Log for Superadmin - Moved to Bottom */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
           <RecentActivity 
              showFilter={true} 
              mosques={mosquesList} 
              limit={10} 
           />
        </motion.div>
    </motion.div>
  );
}
