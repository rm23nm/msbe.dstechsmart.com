import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Heart, Megaphone, Calendar, TrendingUp, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const NOTIF_TYPES = [
  {
    key: "donation",
    label: "Konfirmasi Donasi",
    desc: "Notifikasi saat ada donasi baru masuk atau dikonfirmasi bendahara",
    icon: Heart,
    color: "text-emerald-500",
  },
  {
    key: "activity",
    label: "Kegiatan Masjid",
    desc: "Notifikasi saat kegiatan baru ditambahkan atau diperbarui",
    icon: Calendar,
    color: "text-purple-500",
  },
  {
    key: "announcement",
    label: "Pengumuman Penting",
    desc: "Notifikasi saat admin mempublikasikan pengumuman baru",
    icon: Megaphone,
    color: "text-blue-500",
  },
  {
    key: "finance",
    label: "Pengingat Laporan Bulanan",
    desc: "Pengingat di awal bulan untuk membuat laporan keuangan",
    icon: TrendingUp,
    color: "text-amber-500",
  },
];

export default function NotificationSettings() {
  const [prefs, setPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("notif_prefs") || "{}"); } catch { return {}; }
  });

  function toggle(key) {
    setPrefs(p => ({ ...p, [key]: p[key] === false ? true : false }));
  }

  function save() {
    localStorage.setItem("notif_prefs", JSON.stringify(prefs));
    toast.success("Pengaturan notifikasi disimpan");
  }

  return (
    <div className="bg-card rounded-xl border p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Bell className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Pengaturan Notifikasi</h3>
      </div>
      <p className="text-sm text-muted-foreground">Pilih jenis notifikasi yang ingin Anda terima secara real-time.</p>

      <div className="space-y-4">
        {NOTIF_TYPES.map(n => {
          const Icon = n.icon;
          const enabled = prefs[n.key] !== false;
          return (
            <div key={n.key} className="flex items-start justify-between gap-4 py-3 border-b last:border-0">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className={`h-4 w-4 ${n.color}`} />
                </div>
                <div>
                  <Label className="font-medium">{n.label}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                </div>
              </div>
              <Switch checked={enabled} onCheckedChange={() => toggle(n.key)} />
            </div>
          );
        })}
      </div>

      <Button size="sm" onClick={save} className="gap-2">
        <Save className="h-4 w-4" /> Simpan Pengaturan
      </Button>
    </div>
  );
}
