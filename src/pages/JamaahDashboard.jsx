import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import { useMosqueContext } from "@/lib/useMosqueContext";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { Heart, Calendar, Megaphone, DollarSign, ShieldCheck, Sparkles, UserCircle2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import DigitalMembershipCard from "@/components/jamaah/DigitalMembershipCard";

function formatRp(n) { return "Rp " + (n || 0).toLocaleString("id-ID"); }

export default function JamaahDashboard() {
  const { currentMosque: mosque, loading, isWhiteLabel } = useMosqueContext();
  const { user } = useAuth();
  const [member, setMember] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    if (!mosque?.id || !user?.email) return;
    smartApi.entities.MosqueMember.filter({ mosque_id: mosque.id, user_email: user.email }).then(data => {
      if (data.length > 0) setMember(data[0]);
    });
    smartApi.entities.Transaction.filter({ mosque_id: mosque.id }, '-date', 50).then(setTransactions);
    smartApi.entities.Activity.filter({ mosque_id: mosque.id }, '-date', 10).then(data => setActivities(data.filter(a => a.status === 'upcoming')));
    smartApi.entities.Announcement.filter({ mosque_id: mosque.id, status: "published" }, '-created_date', 5).then(setAnnouncements);
  }, [mosque?.id, user?.email]);

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!mosque) return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <h3 className="font-semibold text-lg">Belum Ada Masjid</h3>
      <p className="text-sm text-muted-foreground">Anda belum tergabung dalam jamaah masjid mana pun.</p>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Portal Jamaah" description={`Informasi terkini ${mosque?.name || "masjid"}`} />

      {/* MEMBER CARD SECTION - PREMIUM ADDITION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-emerald-50/50 p-8 rounded-[3rem] border-2 border-emerald-100/50 shadow-inner">
         <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
            <div className="space-y-2">
               <div className="flex items-center justify-center lg:justify-start gap-2 text-emerald-600 font-black text-xs uppercase tracking-[0.3em]">
                  <ShieldCheck className="w-4 h-4" /> Anggota Resmi
               </div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                  Kartu Identitas <span className="text-emerald-600">Digital</span> Bapak
               </h2>
               <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm">
                  Simpan kartu ini sebagai bukti keanggotaan resmi Bapak di {mosque.name}. Scan QR Code untuk absensi kegiatan.
               </p>
            </div>
            {isWhiteLabel && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                 <Sparkles className="w-3 h-3" /> Member Premium
              </div>
            )}
         </div>
         <div className="flex justify-center">
            <DigitalMembershipCard member={member} mosque={mosque} isElite={isWhiteLabel} />
         </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Pemasukan" value={formatRp(totalIncome)} icon={DollarSign} />
        <StatCard title="Total Pengeluaran" value={formatRp(totalExpense)} icon={DollarSign} />
        <StatCard title="Saldo Kas" value={formatRp(balance)} icon={Heart} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Megaphone className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Pengumuman</h3>
          </div>
          {announcements.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada pengumuman aktif.</p>
          ) : (
            <div className="space-y-3">
              {announcements.slice(0, 5).map(a => (
                <div key={a.id} className="border-b pb-2 last:border-0">
                  <p className="font-medium text-sm">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Kegiatan Mendatang</h3>
          </div>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada kegiatan mendatang.</p>
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 5).map(a => (
                <div key={a.id} className="border-b pb-2 last:border-0">
                  <p className="font-medium text-sm">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.date} {a.time_start && `• ${a.time_start}`} {a.location && `• ${a.location}`}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl border p-4">
        <h3 className="font-semibold mb-3">Transaksi Terakhir</h3>
        <div className="space-y-2">
          {transactions.slice(0, 10).map(t => (
            <div key={t.id} className="flex justify-between items-center text-sm border-b pb-1 last:border-0">
              <div>
                <span className="font-medium capitalize">{t.category}</span>
                {t.description && <span className="text-muted-foreground ml-2">— {t.description}</span>}
                <div className="text-xs text-muted-foreground">{t.date}</div>
              </div>
              <span className={t.type === "income" ? "text-emerald-600 font-medium" : "text-red-500 font-medium"}>
                {t.type === "income" ? "+" : "-"}{formatRp(t.amount)}
              </span>
            </div>
          ))}
          {transactions.length === 0 && <p className="text-sm text-muted-foreground">Belum ada transaksi.</p>}
        </div>
      </div>
    </div>
  );
}
