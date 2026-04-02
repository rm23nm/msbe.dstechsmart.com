import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/apiClient";
import { useMosqueContext } from "@/lib/useMosqueContext";
import { Bell, Check, X, Heart, Megaphone, Calendar, TrendingUp } from "lucide-react";

const typeConfig = {
  donation: { icon: Heart, color: "text-emerald-500", bg: "bg-emerald-50" },
  announcement: { icon: Megaphone, color: "text-blue-500", bg: "bg-blue-50" },
  activity: { icon: Calendar, color: "text-purple-500", bg: "bg-purple-50" },
  finance: { icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-50" },
};

function getNotifPrefs() {
  try { return JSON.parse(localStorage.getItem("notif_prefs") || "{}"); } catch { return {}; }
}

export default function NotificationBell() {
  const { currentMosque } = useMosqueContext();
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const prefs = getNotifPrefs();

  useEffect(() => {
    if (!currentMosque?.id) return;
    const unsubs = [];

    // Real-time donation notifications
    if (prefs.donation !== false) {
      const unsub = base44.entities.Donation.subscribe((event) => {
        if (event.data?.mosque_id !== currentMosque.id) return;
        if (event.type === "create") {
          addNotif({
            id: `don-${event.id}-${Date.now()}`,
            type: "donation",
            title: "Donasi Baru Masuk",
            message: `${event.data.donor_name || "Anonim"} — Rp ${Number(event.data.amount || 0).toLocaleString("id-ID")} (${event.data.category})`,
            time: new Date(),
          });
        } else if (event.type === "update" && event.data?.status === "confirmed") {
          addNotif({
            id: `don-conf-${event.id}-${Date.now()}`,
            type: "donation",
            title: "Donasi Dikonfirmasi",
            message: `Donasi dari ${event.data.donor_name || "Anonim"} telah dikonfirmasi`,
            time: new Date(),
          });
        }
      });
      unsubs.push(unsub);
    }

    // Real-time announcement notifications
    if (prefs.announcement !== false) {
      const unsub = base44.entities.Announcement.subscribe((event) => {
        if (event.data?.mosque_id !== currentMosque.id) return;
        if (event.type === "create" && event.data?.status === "published") {
          addNotif({
            id: `ann-${event.id}-${Date.now()}`,
            type: "announcement",
            title: "Pengumuman Baru",
            message: event.data.title,
            time: new Date(),
          });
        }
      });
      unsubs.push(unsub);
    }

    // Real-time activity notifications
    if (prefs.activity !== false) {
      const unsub = base44.entities.Activity.subscribe((event) => {
        if (event.data?.mosque_id !== currentMosque.id) return;
        if (event.type === "create") {
          addNotif({
            id: `act-${event.id}-${Date.now()}`,
            type: "activity",
            title: "Kegiatan Baru Ditambahkan",
            message: `${event.data.title} — ${event.data.date}`,
            time: new Date(),
          });
        }
      });
      unsubs.push(unsub);
    }

    return () => unsubs.forEach(u => u());
  }, [currentMosque?.id]);

  // Monthly finance reminder on first visit of the month
  useEffect(() => {
    if (prefs.finance === false) return;
    const key = `fin_remind_${new Date().toISOString().slice(0,7)}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, "1");
      const day = new Date().getDate();
      if (day >= 1 && day <= 3) {
        addNotif({
          id: `fin-${Date.now()}`,
          type: "finance",
          title: "Pengingat Laporan Bulanan",
          message: "Waktunya membuat laporan keuangan bulan lalu. Klik untuk melihat laporan.",
          time: new Date(),
          link: "/laporan-keuangan",
        });
      }
    }
  }, []);

  function addNotif(n) {
    setNotifs(prev => [n, ...prev].slice(0, 20));
  }

  function clearAll() { setNotifs([]); }
  function dismiss(id) { setNotifs(prev => prev.filter(n => n.id !== id)); }

  // Close on outside click
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
                <Check className="h-3 w-3" /> Tandai semua
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
                        {n.time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
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