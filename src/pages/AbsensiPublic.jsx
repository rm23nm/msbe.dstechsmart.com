import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, QrCode } from "lucide-react";

export default function AbsensiPublic() {
  const { mosqueId, activityId } = useParams();
  const [activity, setActivity] = useState(null);
  const [mosque, setMosque] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ member_name: "", member_email: "", member_phone: "" });

  useEffect(() => {
    loadData();
  }, [mosqueId, activityId]);

  async function loadData() {
    try {
      // Load mosque
      const mosques = await base44.entities.Mosque.filter({ id: mosqueId });
      if (mosques?.length > 0) setMosque(mosques[0]);

      // Load activities filtered by mosque_id, then find the specific one
      const acts = await base44.entities.Activity.filter({ mosque_id: mosqueId }, "-date", 100);
      const found = acts?.find(a => a.id === activityId);
      if (found) setActivity(found);
    } catch (e) {
      console.error("Error loading absensi data:", e);
    }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.member_name.trim()) return;
    setSubmitting(true);
    await base44.entities.Attendance.create({
      activity_id: activityId,
      mosque_id: mosqueId,
      member_name: form.member_name,
      member_email: form.member_email,
      member_phone: form.member_phone,
      checked_in_at: new Date().toISOString(),
    });
    setSubmitted(true);
    setSubmitting(false);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!activity) return (
    <div className="min-h-screen flex items-center justify-center text-center p-6">
      <div>
        <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Kegiatan Tidak Ditemukan</h2>
        <p className="text-muted-foreground mt-2 text-sm">QR code ini tidak valid atau kegiatan sudah dihapus.</p>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold">Absensi Berhasil!</h2>
        <p className="text-muted-foreground">Terima kasih, <strong>{form.member_name}</strong>.<br />Kehadiran Anda di <strong>{activity.title}</strong> telah tercatat.</p>
        {mosque && <p className="text-sm text-muted-foreground">{mosque.name}</p>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          {mosque?.logo_url && (
            <img src={mosque.logo_url} alt="logo" className="w-16 h-16 rounded-xl object-cover mx-auto border" />
          )}
          <h1 className="text-2xl font-bold">{activity.title}</h1>
          {mosque && <p className="text-muted-foreground text-sm">{mosque.name}</p>}
          {activity.date && (
            <p className="text-sm text-muted-foreground">
              {new Date(activity.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {activity.time_start ? ` • ${activity.time_start}` : ''}
            </p>
          )}
        </div>

        {/* Form */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" /> Daftar Hadir
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Lengkap <span className="text-destructive">*</span></Label>
              <Input
                value={form.member_name}
                onChange={e => setForm(f => ({ ...f, member_name: e.target.value }))}
                placeholder="Masukkan nama Anda"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email (opsional)</Label>
              <Input
                type="email"
                value={form.member_email}
                onChange={e => setForm(f => ({ ...f, member_email: e.target.value }))}
                placeholder="email@contoh.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>No. HP (opsional)</Label>
              <Input
                value={form.member_phone}
                onChange={e => setForm(f => ({ ...f, member_phone: e.target.value }))}
                placeholder="08xx-xxxx-xxxx"
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting || !form.member_name.trim()}>
              {submitting ? "Menyimpan..." : "Konfirmasi Hadir"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}