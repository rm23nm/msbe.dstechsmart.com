import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import { useMosqueContext } from "@/lib/useMosqueContext";
import { formatCurrency, formatDate } from "@/lib/formatCurrency";
import { isPaidPlan } from "@/components/PlanGate";
import { Maximize, Calendar, ArrowUpRight, ArrowDownRight, QrCode, Settings, Tv } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import PageHeader from "../components/PageHeader";
import { toast } from "sonner";

const PRAYER_LABELS = [
  { key: 'subuh', label: 'Subuh' },
  { key: 'dzuhur', label: 'Dzuhur' },
  { key: 'ashar', label: 'Ashar' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isya', label: 'Isya' },
  { key: 'jumat', label: "Jum'at" },
];

function getNextFriday() {
  const d = new Date();
  const day = d.getDay();
  const diff = (5 - day + 7) % 7 || 7;
  const next = new Date(d);
  next.setDate(d.getDate() + diff);
  return next.toISOString().split('T')[0];
}

export default function InfoPublik() {
  const { currentMosque, loading, isPengurus } = useMosqueContext();
  const [fullscreen, setFullscreen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [jumatOfficer, setJumatOfficer] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [slideIndex, setSlideIndex] = useState(0);
  const [showPrayerForm, setShowPrayerForm] = useState(false);
  const [showJumatForm, setShowJumatForm] = useState(false);
  const [prayerForm, setPrayerForm] = useState({ subuh: '', dzuhur: '', ashar: '', maghrib: '', isya: '', jumat: '' });
  const [jumatForm, setJumatForm] = useState({ imam: '', khatib: '', muadzin: '', bilal: '', notes: '', jumat_date: getNextFriday() });
  const [prayerTimesId, setPrayerTimesId] = useState(null);
  const [jumatOfficerId, setJumatOfficerId] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-advance slideshow
  const photoUrls = activities.flatMap(a => a.photo_urls || []).slice(0, 8);
  useEffect(() => {
    if (photoUrls.length < 2) return;
    const t = setInterval(() => setSlideIndex(i => (i + 1) % photoUrls.length), 5000);
    return () => clearInterval(t);
  }, [photoUrls.length]);

  useEffect(() => {
    if (currentMosque) loadData();
    const interval = setInterval(() => { if (currentMosque) loadData(); }, 60000);
    return () => clearInterval(interval);
  }, [currentMosque]);

  async function loadData() {
    const [txns, acts, anns, prayers, jumat] = await Promise.all([
      smartApi.entities.Transaction.filter({ mosque_id: currentMosque.id }, '-date', 100),
      smartApi.entities.Activity.filter({ mosque_id: currentMosque.id }, '-date', 5),
      smartApi.entities.Announcement.filter({ mosque_id: currentMosque.id, status: 'published' }, '-created_date', 3),
      smartApi.entities.PrayerTime.filter({ mosque_id: currentMosque.id }, '-created_date', 1),
      smartApi.entities.JumatOfficer.filter({ mosque_id: currentMosque.id }, '-jumat_date', 1),
    ]);
    setTransactions(txns);
    setActivities(acts.filter(a => a.status === 'upcoming'));
    setAnnouncements(anns);
    if (prayers.length > 0) { setPrayerTimes(prayers[0]); setPrayerTimesId(prayers[0].id); setPrayerForm(prayers[0]); }
    if (jumat.length > 0) { setJumatOfficer(jumat[0]); setJumatOfficerId(jumat[0].id); setJumatForm(jumat[0]); }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); setFullscreen(true); }
    else { document.exitFullscreen(); setFullscreen(false); }
  }

  async function savePrayerTimes() {
    if (prayerTimesId) await smartApi.entities.PrayerTime.update(prayerTimesId, { ...prayerForm, mosque_id: currentMosque.id });
    else { const c = await smartApi.entities.PrayerTime.create({ ...prayerForm, mosque_id: currentMosque.id }); setPrayerTimesId(c.id); }
    setPrayerTimes(prayerForm);
    setShowPrayerForm(false);
    toast.success("Jadwal shalat disimpan!");
  }

  async function saveJumatOfficer() {
    if (jumatOfficerId) await smartApi.entities.JumatOfficer.update(jumatOfficerId, { ...jumatForm, mosque_id: currentMosque.id });
    else { const c = await smartApi.entities.JumatOfficer.create({ ...jumatForm, mosque_id: currentMosque.id }); setJumatOfficerId(c.id); }
    setJumatOfficer(jumatForm);
    setShowJumatForm(false);
    toast.success("Petugas Jumat disimpan!");
  }

  if (loading || !currentMosque) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const isPaid = isPaidPlan(currentMosque);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  const today = currentTime;
  const timezone = currentMosque.timezone || 'Asia/Jakarta';
  const timeStr = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: timezone });
  const dateStr = currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: timezone });
  const tzLabel = { 'Asia/Jakarta': 'WIB', 'Asia/Makassar': 'WITA', 'Asia/Jayapura': 'WIT' }[timezone] || 'WIB';

  return (
    <div className="space-y-4">
      <PageHeader title="Info Publik" description="Mode tampilan untuk layar TV masjid">
        <div className="flex gap-2">
          {isPengurus && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowPrayerForm(true)} className="gap-1">
                <Settings className="h-4 w-4" /> Jadwal Shalat
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowJumatForm(true)} className="gap-1">
                <Settings className="h-4 w-4" /> Petugas Jumat
              </Button>
            </>
          )}
          <Link to={`/tv/${currentMosque.id}`} target="_blank">
            <Button variant="default" className="gap-2">
              <Tv className="h-4 w-4" /> Buka Tampilan TV
            </Button>
          </Link>
          <Button onClick={toggleFullscreen} variant="outline" className="gap-2">
            <Maximize className="h-4 w-4" /> {fullscreen ? 'Keluar' : 'Fullscreen'}
          </Button>
        </div>
      </PageHeader>

      {/* TV Display - Full Width */}
      <div className="w-full bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground rounded-2xl overflow-hidden">
        {/* Header: Mosque Name + Clock */}
        <div className="relative">
          {currentMosque.cover_image_url && (
            <div className="absolute inset-0 opacity-20">
              <img src={currentMosque.cover_image_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="relative px-6 md:px-10 py-6 md:py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {currentMosque.logo_url && (
                <img src={currentMosque.logo_url} alt="" className="w-16 h-16 rounded-xl object-cover border-2 border-white/30" />
              )}
              <div>
                <h1 className="text-2xl md:text-4xl font-extrabold">{currentMosque.name}</h1>
                <p className="text-primary-foreground/70 text-sm mt-0.5">{currentMosque.address}</p>
              </div>
            </div>
            <div className="text-left md:text-right">
              <p className="text-4xl md:text-6xl font-bold font-arabic tabular-nums">{timeStr.slice(0, 5)}</p>
              <p className="text-xs text-primary-foreground/60 uppercase tracking-widest">{tzLabel}</p>
              <p className="text-sm text-primary-foreground/70 mt-1">{dateStr}</p>
            </div>
          </div>
        </div>

        {/* Prayer Times - always shown */}
        <div className="px-6 md:px-10 pb-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-3 text-primary-foreground/80">🕌 Jadwal Waktu Shalat</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {PRAYER_LABELS.map(p => (
                <div key={p.key} className="text-center bg-white/10 rounded-lg py-2 px-1">
                  <p className="text-xs text-primary-foreground/70">{p.label}</p>
                  <p className="font-bold text-base mt-1">{prayerTimes?.[p.key] || '--:--'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Jumat Officer - always shown */}
        {jumatOfficer && (
          <div className="px-6 md:px-10 pb-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <h3 className="font-semibold text-sm mb-3 text-primary-foreground/80">📿 Petugas Shalat Jum'at</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[['Imam', jumatOfficer.imam], ['Khatib', jumatOfficer.khatib], ['Muadzin', jumatOfficer.muadzin], ['Bilal', jumatOfficer.bilal]].map(([role, name]) => name ? (
                  <div key={role} className="bg-white/10 rounded-lg p-3 text-center">
                    <p className="text-xs text-primary-foreground/60">{role}</p>
                    <p className="font-semibold text-sm mt-1">{name}</p>
                  </div>
                ) : null)}
              </div>
              {jumatOfficer.jumat_date && <p className="text-xs text-primary-foreground/50 mt-2">Jum'at, {formatDate(jumatOfficer.jumat_date)}</p>}
            </div>
          </div>
        )}

        {/* Paid features only */}
        {isPaid && (
          <>
            {/* Financial Summary */}
            {currentMosque.show_financial && (
              <div className="px-6 md:px-10 pb-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-xs text-primary-foreground/70">Saldo Kas</p>
                    <p className="text-xl font-bold mt-1">{formatCurrency(balance)}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-xs text-primary-foreground/70">Total Pemasukan</p>
                    <p className="text-xl font-bold mt-1 flex items-center gap-1"><ArrowUpRight className="h-4 w-4" /> {formatCurrency(totalIncome)}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-xs text-primary-foreground/70">Total Pengeluaran</p>
                    <p className="text-xl font-bold mt-1 flex items-center gap-1"><ArrowDownRight className="h-4 w-4" /> {formatCurrency(totalExpense)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Activities & Announcements */}
            <div className="px-6 md:px-10 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm"><Calendar className="h-4 w-4" /> Kegiatan Mendatang</h3>
                {activities.length === 0 ? <p className="text-sm text-primary-foreground/60">Tidak ada kegiatan terjadwal</p> : (
                  <div className="space-y-3">
                    {activities.map(a => (
                      <div key={a.id} className="flex items-center gap-3">
                        <div className="w-1 h-8 bg-accent rounded-full" />
                        <div>
                          <p className="font-medium text-sm">{a.title}</p>
                          <p className="text-xs text-primary-foreground/60">{formatDate(a.date)} {a.time_start ? `• ${a.time_start}` : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm">
                <h3 className="font-semibold mb-3 text-sm">📢 Pengumuman</h3>
                {announcements.length === 0 ? <p className="text-sm text-primary-foreground/60">Tidak ada pengumuman</p> : (
                  <div className="space-y-3">
                    {announcements.map(a => (
                      <div key={a.id}>
                        <p className="font-medium text-sm">{a.title}</p>
                        <p className="text-xs text-primary-foreground/60 line-clamp-2">{a.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Slideshow Foto Kegiatan */}
            {photoUrls.length > 0 && (
              <div className="px-6 md:px-10 pb-4">
                <div className="relative rounded-xl overflow-hidden aspect-video max-h-56">
                  <img src={photoUrls[slideIndex]} alt="" className="w-full h-full object-cover transition-opacity duration-700" />
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {photoUrls.map((_, i) => (
                      <button key={i} onClick={() => setSlideIndex(i)} className={`w-2 h-2 rounded-full transition-all ${i === slideIndex ? 'bg-white' : 'bg-white/40'}`} />
                    ))}
                  </div>
                  <div className="absolute top-2 left-3 text-xs bg-black/40 text-white px-2 py-0.5 rounded-full">📸 Foto Kegiatan</div>
                </div>
              </div>
            )}

            {/* Video YouTube */}
            {currentMosque.youtube && (
              <div className="px-6 md:px-10 pb-4">
                <div className="bg-white/10 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">▶</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">Tonton Video Kajian</p>
                    <a href={currentMosque.youtube} target="_blank" rel="noreferrer" className="text-xs text-primary-foreground/60 truncate block hover:underline">{currentMosque.youtube}</a>
                  </div>
                </div>
              </div>
            )}

            {/* Donation QR Banner */}
            <div className="px-6 md:px-10 pb-6">
              <div className="bg-accent/20 border border-accent/40 rounded-xl p-4 flex items-center gap-4">
                <QrCode className="h-12 w-12 text-accent shrink-0" />
                <div>
                  <p className="font-bold">Donasi via QR Code</p>
                  <p className="text-sm text-primary-foreground/70">Scan QR untuk berdonasi langsung ke kas masjid. Donasi Anda langsung tercatat otomatis.</p>
                </div>
              </div>
            </div>
          </>
        )}

        {!isPaid && (
          <div className="px-6 md:px-10 pb-6">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <p className="text-sm text-primary-foreground/70">🔒 Upgrade ke paket berbayar untuk menampilkan kegiatan, pengumuman, keuangan, dan fitur donasi QR</p>
            </div>
          </div>
        )}
      </div>

      {/* Manage Forms */}
      <Dialog open={showPrayerForm} onOpenChange={setShowPrayerForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Atur Jadwal Waktu Shalat</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {PRAYER_LABELS.map(p => (
              <div key={p.key}>
                <label className="text-sm font-medium">{p.label}</label>
                <Input type="time" value={prayerForm[p.key] || ''} onChange={e => setPrayerForm(prev => ({ ...prev, [p.key]: e.target.value }))} className="mt-1" />
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" onClick={() => setShowPrayerForm(false)}>Batal</Button>
            <Button onClick={savePrayerTimes}>Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showJumatForm} onOpenChange={setShowJumatForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Petugas Shalat Jum'at</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-sm font-medium">Tanggal Jum'at</label>
              <Input type="date" value={jumatForm.jumat_date || ''} onChange={e => setJumatForm(p => ({ ...p, jumat_date: e.target.value }))} className="mt-1" />
            </div>
            {[['imam', 'Imam'], ['khatib', 'Khatib'], ['muadzin', 'Muadzin'], ['bilal', 'Bilal']].map(([k, l]) => (
              <div key={k}>
                <label className="text-sm font-medium">{l}</label>
                <Input value={jumatForm[k] || ''} onChange={e => setJumatForm(p => ({ ...p, [k]: e.target.value }))} className="mt-1" placeholder={`Nama ${l}`} />
              </div>
            ))}
            <div className="col-span-2">
              <label className="text-sm font-medium">Catatan</label>
              <Input value={jumatForm.notes || ''} onChange={e => setJumatForm(p => ({ ...p, notes: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" onClick={() => setShowJumatForm(false)}>Batal</Button>
            <Button onClick={saveJumatOfficer}>Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}