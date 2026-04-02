import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import { useMosqueContext } from "@/lib/useMosqueContext";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { Heart, Calendar, Megaphone, DollarSign } from "lucide-react";

function formatRp(n) { return "Rp " + (n || 0).toLocaleString("id-ID"); }

export default function JamaahDashboard() {
  const { currentMosque: mosque } = useMosqueContext();
  const [transactions, setTransactions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    if (!mosque?.id) return;
    smartApi.entities.Transaction.filter({ mosque_id: mosque.id }, '-date', 50).then(setTransactions);
    smartApi.entities.Activity.filter({ mosque_id: mosque.id }, '-date', 10).then(data => setActivities(data.filter(a => a.status === 'upcoming')));
    smartApi.entities.Announcement.filter({ mosque_id: mosque.id, status: "published" }, '-created_date', 5).then(setAnnouncements);
  }, [mosque?.id]);

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Portal Jamaah" description={`Informasi terkini ${mosque?.name || "masjid"}`} />

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