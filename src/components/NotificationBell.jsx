import { useState, useEffect, useRef } from "react";
import { smartApi } from "@/api/apiClient";
import { useMosqueContext } from "@/lib/useMosqueContext";
import { Bell, Check, X, Heart, Megaphone, Calendar, TrendingUp } from "lucide-react";

const typeConfig = {
  donation: { icon: Heart, color: "text-emerald-500", bg: "bg-emerald-50" },
  announcement: { icon: Megaphone, color: "text-blue-500", bg: "bg-blue-50" },
  activity: { icon: Calendar, color: "text-purple-500", bg: "bg-purple-50" },
  finance: { icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-50" },
};

export default function NotificationBell() {
  const { currentMosque } = useMosqueContext();
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const lastCheckRef = useRef(new Date());
  const seenIdsRef = useRef(new Set());

  // Poll for new data every 30 seconds (replaces .subscribe())
  useEffect(() => {
    if (!currentMosque?.id) return;

    async function poll() {
      try {
        const [donations, announcements, activities] = await Promise.all([
          smartApi.entities.Donation.filter({ mosque_id: currentMosque.id }),
          smartApi.entities.Announcement.filter({ mosque_id: currentMosque.id }),
          smartApi.entities.Activity.filter({ mosque_id: currentMosque.id }),
        ]);

        const newNotifs = [];

        // Check for new donations
        donations.slice(0, 5).forEach(d => {
          const key = `don-${d.id}`;
          if (!seenIdsRef.current.has(key) && seenIdsRef.current.size > 0) {
            newNotifs.push({
              id: `${key}-${Date.now()}`,
              type: "donation",
              title: "Donasi Baru Masuk",
              message: `${d.donor_name || "Anonim"} — Rp ${Number(d.amount || 0).toLocaleString("id-ID")} (${d.category || "Donasi"})`,
              time: new Date(),
            });
          }
          seenIdsRef.current.add(key);
        });

        // Check for new/published announcements
        announcements.slice(0, 5).forEach(a => {
          const key = `ann-${a.id}`;
          if (!seenIdsRef.current.has(key) && seenIdsRef.current.size > 0 && a.status === "published") {
            newNotifs.push({
              id: `${key}-${Date.now()}`,
              type: "announcement",
              title: "Pengumuman Baru",
              message: a.title,
              time: new Date(),
            });
          }
          seenIdsRef.current.add(key);
        });

        // Check for new activities
        activities.slice(0, 5).forEach(a => {
          const key = `act-${a.id}`;
          if (!seenIdsRef.current.has(key) && seenIdsRef.current.size > 0) {
            newNotifs.push({
              id: `${key}-${Date.now()}`,
              type: "activity",
              title: "Kegiatan Baru Ditambahkan",
              message: `${a.title} — ${a.date || ""}`,
              time: new Date(),
            });
          }
          seenIdsRef.current.add(key);
        });

        if (newNotifs.length > 0) {
          setNotifs(prev => [...newNotifs, ...prev].slice(0, 20));
        }
      } catch (err) {
        // Polling gagal — mungkin belum login / koneksi bermasalah, diam saja
      }
    }

    // Jalankan pertama kali untuk mengisi seenIds (tanpa generate notif)
    poll();

    // Polling setiap 30 detik
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [currentMosque?.id]);

  // Pengingat laporan keuangan bulanan (hari 1-3 setiap bulan)
  useEffect(() => {
    const key = `fin_remind_${new Date().toISOString().slice(0, 7)}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, "1");
      const day = new Date().getDate();
      if (day >= 1 && day <= 3) {
        setNotifs(prev => [{
          id: `fin-${Date.now()}`,
          type: "finance",
          title: "Pengingat Laporan Bulanan",
          message: "Waktunya membuat laporan keuangan bulan lalu. Klik untuk melihat laporan.",
          time: new Date(),
          link: "/laporan-keuangan",
        }, ...prev]);
      }
    }
  }, []);

  function clearAll() { setNotifs([]); }
  function dismiss(id) { setNotifs(prev => prev.filter(n => n.id !== id)); }

  // Tutup saat klik di luar
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifs.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
        title="Notifikasi"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-card border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="font-semibold text-sm">Notifikasi</span>
            {unread > 0 && (
              <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <Check className="h-3 w-3" /> Tandai semua dibaca
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-muted-foreground gap-2">
                <Bell className="h-8 w-8 opacity-30" />
                <p className="text-sm">Tidak ada notifikasi</p>
              </div>
            ) : (
              notifs.map(n => {
                const cfg = typeConfig[n.type] || typeConfig.announcement;
                const Icon = cfg.icon;
                return (
                  <div key={n.id} className="flex gap-3 px-4 py-3 hover:bg-muted/50 border-b last:border-0 transition-colors">
                    <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className={`h-4 w-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">{n.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {n.time?.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <button onClick={() => dismiss(n.id)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
