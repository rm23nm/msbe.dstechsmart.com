import { useState, useEffect } from "react";
import axios from "axios";
import { smartApi } from "@/api/apiClient";
import { useMosqueContext } from "@/lib/useMosqueContext";
import PageHeader from "../components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QrCode, Users, Calendar, Download, Printer, ScanLine } from "lucide-react";
import { formatDate } from "@/lib/formatCurrency";
import AdminScanner from "../components/attendance/AdminScanner";
import { toast } from "react-hot-toast";

export default function Absensi() {
  const { currentMosque, loading } = useMosqueContext();
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [showQR, setShowQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  useEffect(() => {
    if (currentMosque) loadActivities();
  }, [currentMosque]);

  async function loadActivities() {
    const acts = await smartApi.entities.Activity.filter({ mosque_id: currentMosque.id }, "-date", 20);
    setActivities(acts);
  }

  async function openActivity(activity) {
    setSelectedActivity(activity);
    setLoadingAttendance(true);
    try {
      const data = await smartApi.entities.Attendance.filter({ activity_id: activity.id }, "-checked_in_at", 100);
      setAttendances(data || []);
    } catch (e) {
      console.error("Attendance Load Error:", e);
      toast.error("Gagal mengambil daftar hadir jamaah");
      setAttendances([]);
    } finally {
      setLoadingAttendance(false);
    }
  }

  function getQRUrl(activity) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      `${window.location.origin}/absensi/${currentMosque.id}/${activity.id}`
    )}`;
  }

  async function handleScanSuccess(membershipId) {
    if (!selectedActivity) return;
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || ""}/api/public/attendance/fast-checkin`, {
        membership_id: membershipId,
        activity_id: selectedActivity.id,
        mosque_id: currentMosque.id
      });
      
      if (res.data.success) {
        toast.success(`Jazakallah! ${res.data.member_name} tercatat hadir.`);
        if (res.data.message) toast.success(res.data.message, { icon: '👏' });
        
        // Refresh list
        openActivity(selectedActivity);
      }
    } catch (e) {
      console.error(e);
      const msg = e.response?.data?.error || "Gagal memproses absensi.";
      toast.error(msg);
    }
  }

  function downloadQR(activity) {
    const link = document.createElement("a");
    link.href = getQRUrl(activity);
    link.download = `qr-absensi-${activity.title}.png`;
    link.click();
  }

  function exportCSV() {
    if (!attendances.length) return;
    const header = "Nama,Email,Telepon,Waktu Check-in\n";
    const rows = attendances.map(a =>
      `"${a.member_name}","${a.member_email || ''}","${a.member_phone || ''}","${a.checked_in_at || ''}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `absensi-${selectedActivity?.title}.csv`;
    link.click();
  }

  function printAttendance() {
    if (!attendances.length) return;
    const printWindow = window.open('', '_blank', 'height=600,width=800');
    let html = `
      <html>
        <head>
          <title>Daftar Kehadiran - ${selectedActivity?.title}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #111; }
            h2 { text-align: center; margin-bottom: 5px; }
            .subtitle { text-align: center; color: #555; margin-top: 0; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th, td { border: 1px solid #000; padding: 8px 12px; text-align: left; }
            th { background-color: #f4f4f5; }
          </style>
        </head>
        <body>
          <h2>Laporan Kehadiran Jamaah</h2>
          <p class="subtitle">Kegiatan: <strong>${selectedActivity?.title}</strong><br>Tanggal: ${formatDate(selectedActivity?.date)}</p>
          <table>
            <thead>
              <tr>
                <th width="5%">No</th>
                <th width="35%">Nama Lengkap</th>
                <th width="35%">Kontak / Identitas</th>
                <th width="25%">Waktu Check-in</th>
              </tr>
            </thead>
            <tbody>
    `;

    attendances.forEach((a, i) => {
      const time = a.checked_in_at ? new Date(a.checked_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
      const contact = a.member_email || a.member_phone || '-';
      html += `
        <tr>
          <td>${i + 1}</td>
          <td>${a.member_name}</td>
          <td>${contact}</td>
          <td>${time}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
          <p style="margin-top: 30px; text-align: right; font-size: 12px;">Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  }

  if (loading || !currentMosque) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Absensi Kegiatan" description="Kelola absensi jamaah via QR code" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activities.map(activity => (
          <div key={activity.id} className="bg-card border rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{activity.title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{formatDate(activity.date)}{activity.time_start ? ` • ${activity.time_start}` : ''}</p>
              </div>
              <Badge variant={activity.status === 'upcoming' ? 'default' : 'secondary'} className="ml-2 shrink-0">
                {activity.status === 'upcoming' ? 'Mendatang' : activity.status === 'ongoing' ? 'Berlangsung' : 'Selesai'}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 gap-1 border-emerald-600 text-emerald-600 hover:bg-emerald-50" onClick={() => { setSelectedActivity(activity); setShowScanner(true); }}>
                <ScanLine className="h-3.5 w-3.5" /> Scan Kartu
              </Button>
              <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => { setSelectedActivity(activity); setShowQR(true); }}>
                <QrCode className="h-3.5 w-3.5" /> QR Code
              </Button>
              <Button size="sm" className="flex-1 gap-1" onClick={() => openActivity(activity)}>
                <Users className="h-3.5 w-3.5" /> Absensi
              </Button>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="col-span-3 text-center py-16 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Belum ada kegiatan. Tambah kegiatan di menu Kegiatan.</p>
          </div>
        )}
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>QR Code Absensi</DialogTitle>
          </DialogHeader>
          {selectedActivity && (
            <div className="space-y-4">
              <p className="text-sm font-medium">{selectedActivity.title}</p>
              <p className="text-xs text-muted-foreground">{formatDate(selectedActivity.date)}</p>
              <div className="flex justify-center">
                <img src={getQRUrl(selectedActivity)} alt="QR" className="w-56 h-56 border rounded-xl" />
              </div>
              <p className="text-xs text-muted-foreground">Tampilkan QR ini di layar agar jamaah bisa scan untuk absen</p>
              <Button className="w-full gap-2" onClick={() => downloadQR(selectedActivity)}>
                <Download className="h-4 w-4" /> Download QR
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Attendance List Dialog */}
      <Dialog open={!!selectedActivity && !showQR && !showScanner} onOpenChange={(o) => { if (!o) setSelectedActivity(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Absensi — {selectedActivity?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{attendances.length} jamaah hadir</p>
              {attendances.length > 0 && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1 border-primary text-primary hover:bg-primary/5" onClick={printAttendance}>
                    <Printer className="h-3.5 w-3.5" /> Cetak
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={exportCSV}>
                    <Download className="h-3.5 w-3.5" /> CSV
                  </Button>
                </div>
              )}
            </div>
            {loadingAttendance ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : attendances.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Belum ada yang absen</p>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2">
                {attendances.map((a, i) => (
                  <div key={a.id} className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{a.member_name}</p>
                      <p className="text-xs text-muted-foreground">{a.member_email || a.member_phone || ''}</p>
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {a.checked_in_at ? new Date(a.checked_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="max-w-md text-center rounded-[2.5rem] bg-white">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-black italic tracking-tighter">PEMINDAI KARTU Smart</DialogTitle>
          </DialogHeader>
          {selectedActivity && (
            <AdminScanner 
              onScanSuccess={handleScanSuccess} 
              onClose={() => setShowScanner(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
