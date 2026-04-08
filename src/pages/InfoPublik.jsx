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
      smartApi.entities.Announcement.filter({ mosque_id: currentMosque.id, status: 'published' }, '-created_date', 20),
      smartApi.entities.PrayerTime.filter({ mosque_id: currentMosque.id }, '-created_date', 1),
      smartApi.entities.JumatOfficer.filter({ mosque_id: currentMosque.id }, '-jumat_date', 1),
    ]);
    setTransactions(txns);
    setActivities(acts.filter(a => a.status === 'upcoming'));
    setAnnouncements(anns);
    if (prayers.length > 0) { setPrayerTimes(prayers[0]); }
    if (jumat.length > 0) { setJumatOfficer(jumat[0]); }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); setFullscreen(true); }
    else { document.exitFullscreen(); setFullscreen(false); }
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
          <Button variant="outline" size="sm" onClick={() => {
            const url = `${window.location.origin}/masjid/${currentMosque.slug || currentMosque.id}`;
            window.open(url, "_blank");
          }} className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
            <ArrowUpRight className="h-4 w-4" /> Link Portofolio
          </Button>
          <Link to={`/tv/${currentMosque.slug || currentMosque.id}`} target="_blank">
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
            <h3 className="font-semibold text-sm mb-3 text-primary-foreground/80 flex items-center gap-2">
              <img src="/favicon.png" className="h-4 w-4 object-contain" />
              Jadwal Waktu Shalat
            </h3>
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

        {/* Core Public Information Section (Financial & Communications) - AVAILABLE FOR ALL */}
        <div className="space-y-4">
          {/* Financial Summary */}
          <div className="px-6 md:px-10 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-xs text-primary-foreground/70">Saldo Kas</p>
                <p className="text-xl font-bold mt-1">{formatCurrency(balance)}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-xs text-primary-foreground/70">Pemasukan</p>
                <p className="text-xl font-bold mt-1 flex items-center gap-1">
                  <ArrowUpRight className="h-4 w-4" /> {formatCurrency(totalIncome)}
                </p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-xs text-primary-foreground/70">Pengeluaran</p>
                <p className="text-xl font-bold mt-1 flex items-center gap-1">
                  <ArrowDownRight className="h-4 w-4" /> {formatCurrency(totalExpense)}
                </p>
              </div>
            </div>
          </div>

          {/* Activities & Announcements */}
          <div className="px-6 md:px-10 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" /> Kegiatan Mendatang
              </h3>
              {activities.length === 0 ? (
                <p className="text-sm text-primary-foreground/60">Tidak ada kegiatan terjadwal</p>
              ) : (
                <div className="space-y-3">
                  {activities.map((a) => (
                    <div key={a.id} className="flex items-center gap-3">
                      <div className="w-1 h-8 bg-accent rounded-full" />
                      <div>
                        <p className="font-medium text-sm">{a.title}</p>
                        <p className="text-xs text-primary-foreground/60">
                          {formatDate(a.date)} {a.time_start ? `• ${a.time_start}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm">
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
                <span>📢</span> Pengumuman Terbaru
              </h3>
              {announcements.length === 0 ? (
                <p className="text-sm text-primary-foreground/60">Tidak ada pengumuman</p>
              ) : (
                <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                  {announcements.map((a) => (
                    <div key={a.id} className="border-b border-white/5 pb-3 last:border-0 mb-2 group">
                      <p className="font-bold text-sm text-accent group-hover:text-white transition-colors">{a.title}</p>
                      <p className="text-[11px] text-primary-foreground/70 line-clamp-4 leading-relaxed mt-1">
                        {a.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Paid features only (Marketing/Secondary) */}
        {isPaid && (
          <>
            {/* Slideshow Foto Kegiatan */}
            {photoUrls.length > 0 && (
              <div className="px-6 md:px-10 pb-4">
                <div className="relative rounded-xl overflow-hidden aspect-video max-h-56 shadow-2xl border border-white/10">
                  <img src={photoUrls[slideIndex]} alt="" className="w-full h-full object-cover transition-opacity duration-700" />
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {photoUrls.map((_, i) => (
                      <button key={i} onClick={() => setSlideIndex(i)} className={`w-2 h-2 rounded-full transition-all ${i === slideIndex ? 'bg-white w-4' : 'bg-white/40'}`} />
                    ))}
                  </div>
                  <div className="absolute top-2 left-3 text-[10px] uppercase font-black tracking-widest bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-full">📸 Gallery Masjid</div>
                </div>
              </div>
            )}

            {/* Video YouTube */}
            {currentMosque.youtube && (
              <div className="px-6 md:px-10 pb-4">
                <div className="bg-white/10 rounded-xl p-4 flex items-center gap-4 hover:bg-white/20 transition-all cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shrink-0 shadow-lg">
                    <span className="text-white text-xs font-bold ml-0.5">▶</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">Streaming / Video Kajian</p>
                    <a href={currentMosque.youtube} target="_blank" rel="noreferrer" className="text-[10px] text-primary-foreground/60 truncate block hover:underline italic">{currentMosque.youtube}</a>
                  </div>
                </div>
              </div>
            )}

            {/* Donation QR Banner */}
            <div className="px-6 md:px-10 pb-6">
              <div className="bg-accent/20 border border-accent/40 rounded-2xl p-5 flex items-center gap-5 shadow-xl">
                <div className="bg-white p-2 rounded-xl shadow-lg">
                  <QrCode className="h-10 w-10 text-emerald-900 shrink-0" />
                </div>
                <div>
                  <p className="font-black uppercase tracking-tighter text-lg italic">Infaq via QRIS / QR Code</p>
                  <p className="text-xs text-primary-foreground/75 leading-relaxed">Pindai kode QR untuk berdonasi. Transaksi Anda akan tercatat secara transparan dan otomatis di sistem laporan keuangan.</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
