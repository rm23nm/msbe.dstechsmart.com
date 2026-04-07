import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { smartApi } from "@/api/apiClient";
import { Clock, Navigation, Calendar, Megaphone, CheckCircle2, QrCode, TrendingUp, UserCheck, Maximize, Minimize } from "lucide-react";
import FinancialChart from "@/components/dashboard/FinancialChart";
import QRCode from "react-qr-code";

const PRAYER_LABELS = [
  { key: 'subuh', label: 'Subuh' },
  { key: 'dzuhur', label: 'Dzuhur' },
  { key: 'ashar', label: 'Ashar' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isya', label: "Isya" },
  { key: 'jumat', label: "Jum'at" },
];

function formatRp(n) { return "Rp " + (n || 0).toLocaleString("id-ID"); }
function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function timerLabel(tz) {
  if (tz === 'Asia/Jakarta') return 'WIB';
  if (tz === 'Asia/Makassar') return 'WITA';
  if (tz === 'Asia/Jayapura') return 'WIT';
  return 'WIB';
}

function getActivePrayerOverlay(prayerTimes, currentTime, durationMinutes = 15) {
  if (!prayerTimes) return null;
  const year = currentTime.getFullYear();
  const month = currentTime.getMonth();
  const date = currentTime.getDate();

  const prayers = [
    { name: 'Subuh', time: prayerTimes.subuh },
    { name: 'Dzuhur', time: prayerTimes.dzuhur },
    { name: 'Ashar', time: prayerTimes.ashar },
    { name: 'Maghrib', time: prayerTimes.maghrib },
    { name: 'Isya', time: prayerTimes.isya },
    { name: 'Jumat', time: prayerTimes.jumat },
  ].filter(p => p.time && p.time.includes(':'));

  for (const prayer of prayers) {
    const [ph, pm] = prayer.time.split(':').map(Number);
    const pDate = new Date(year, month, date, ph, pm, 0);
    const diffMs = currentTime.getTime() - pDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (prayer.name === 'Jumat' && currentTime.getDay() !== 5) continue;
    if (prayer.name === 'Dzuhur' && currentTime.getDay() === 5) continue;
    if (diffMins >= 0 && diffMins < durationMinutes) {
      return { prayer: prayer.name, remainingMins: durationMinutes - diffMins };
    }
  }
  return null;
}

function Slideshow({ mosque }) {
  const [idx, setIdx] = useState(0);
  let items = [];
  if (mosque.tv_slideshow_urls) items = mosque.tv_slideshow_urls.split(',').map(s => s.trim()).filter(Boolean);
  else if (mosque.cover_image_url) items = [mosque.cover_image_url];
  
  const ytUrl = mosque.tv_video_url || mosque.youtube;
  const showVideo = mosque.tv_live_mode || (!!ytUrl && items.length === 0);
  
  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setIdx(i => (i + 1) % items.length), 8000);
    return () => clearInterval(t);
  }, [items.length]);

  if (showVideo && ytUrl) {
    const ytId = ytUrl.match(/(?:v=|youtu\.be\/|embed\/|live\/|v\/)([a-zA-Z0-9_-]{11})/)?.[1];
    
    // CASE A: YouTube
    if (ytId) {
      return (
        <div className="relative w-full h-full rounded-[3.5rem] overflow-hidden bg-black shadow-2xl border-4 border-white/5">
          <iframe 
            src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&rel=0&modestbranding=1&disablekb=1&iv_load_policy=3&cc_load_policy=0&playsinline=1`}
            className="w-full h-full pointer-events-none scale-105" 
            allow="autoplay; encrypted-media" 
            title="Live Stream" 
          />
          {mosque.tv_live_mode && (
            <div className="absolute top-10 left-10 flex items-center gap-2 bg-red-600 px-6 py-2 rounded-full animate-pulse shadow-lg z-20 border border-white/20">
              <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_10px_white]" />
              <span className="text-xs font-black text-white uppercase tracking-[0.2em]">🔴 LIVE CCTV ONLINE</span>
            </div>
          )}
        </div>
      );
    }

    // CASE B: CCTV Lokal / Web Stream Lain (Direct)
    return (
      <div className="relative w-full h-full rounded-[3.5rem] overflow-hidden bg-black shadow-2xl border-4 border-white/5">
        <iframe 
          src={ytUrl}
          className="w-full h-full" 
          allow="autoplay; encrypted-media" 
          title="Local CCTV Stream" 
        />
        {mosque.tv_live_mode && (
          <div className="absolute top-10 left-10 flex items-center gap-2 bg-emerald-600 px-6 py-2 rounded-full animate-pulse shadow-lg z-20 border border-white/20">
            <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_10px_white]" />
            <span className="text-xs font-black text-white uppercase tracking-[0.2em]">📡 LIVE JARINGAN LOKAL</span>
          </div>
        )}
      </div>
    );
  }

  if (items.length > 0) {
    return (
      <div className="relative w-full h-full rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 group">
        <img key={items[idx]} src={items[idx]} alt="Slide" className="w-full h-full object-cover animate-in fade-in zoom-in-105 duration-1000" />
      </div>
    );
  }

  return <div className="w-full h-full flex items-center justify-center bg-black/20 rounded-2xl border border-white/10"><Clock className="w-12 h-12 opacity-10" /></div>;
}

function SectionBox({ title, icon: Icon, children, flex = false }) {
  return (
    <div className={`flex flex-col bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-xl ${flex ? 'flex-1' : ''}`}>
      <div className="bg-gradient-to-r from-emerald-600/70 to-emerald-900/70 text-white font-black px-6 py-4 text-xs tracking-[0.1em] flex items-center gap-3 border-b border-white/10 uppercase italic">
        {Icon && <Icon className="w-4 h-4 text-emerald-200" />} {title}
      </div>
      <div className={`p-6 overflow-hidden flex flex-col gap-3 ${flex ? 'flex-1' : ''}`}>
        {children}
      </div>
    </div>
  );
}

function RunningText({ text }) {
  return (
    <div className="overflow-hidden whitespace-nowrap flex-1">
      <div className="inline-block animate-marquee text-lg font-black tracking-widest text-white/95 uppercase italic">
        {text} &nbsp; &nbsp; • &nbsp; &nbsp; {text} &nbsp; &nbsp; • &nbsp; &nbsp; {text}
      </div>
    </div>
  );
}

export default function PublicTV() {
  const { mosqueId } = useParams();
  const [mosque, setMosque] = useState(null);
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [jumatOfficer, setJumatOfficer] = useState(null);
  const [activities, setActivities] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleFS = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFS);
    return () => document.removeEventListener("fullscreenchange", handleFS);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!mosque) return;
    
    // DYNAMIC PWA MANIFEST INJECTION
    const manifest = {
      short_name: mosque.name?.substring(0, 12) || "MesjidKu",
      name: mosque.name || "Aplikasi TV MasjidKu",
      icons: [
        {
          src: mosque.logo_url || "/favicon.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: mosque.logo_url || "/favicon.png",
          sizes: "512x512",
          type: "image/png"
        }
      ],
      start_url: window.location.href,
      display: "standalone",
      theme_color: "#059669",
      background_color: "#020617"
    };

    const stringManifest = JSON.stringify(manifest);
    const blob = new Blob([stringManifest], {type: 'application/json'});
    const manifestURL = URL.createObjectURL(blob);
    
    let link = document.querySelector('link[rel="manifest"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = manifestURL;

    // UPDATE TAB TITLE & THEME
    document.title = `TV: ${mosque.name || "MasjidKu"}`;
    
    return () => {
      URL.revokeObjectURL(manifestURL);
    };
  }, [mosque]);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 60000);
    return () => clearInterval(interval);
  }, [mosqueId]);

  async function loadAll() {
    try {
      // 1. CARI DATA LANGSUNG (Pencarian Spesifik)
      let m = null;
      try {
        const bySlug = await smartApi.entities.Mosque.filter({ slug: mosqueId });
        if (bySlug?.length > 0) m = bySlug[0];
      } catch (_) {}
      
      if (!m) {
        try {
          const byId = await smartApi.entities.Mosque.filter({ id: mosqueId });
          if (byId?.length > 0) m = byId[0];
        } catch (_) {}
      }

      if (!m) return;
      setMosque({ ...m });
      setLoading(false);

      const [prayers, jumat, acts, anns, txns] = await Promise.all([
        smartApi.entities.PrayerTime.filter({ mosque_id: m.id }, '-created_date', 1),
        smartApi.entities.JumatOfficer.filter({ mosque_id: m.id }, '-jumat_date', 1),
        smartApi.entities.Activity.filter({ mosque_id: m.id }),
        smartApi.entities.Announcement.filter({ mosque_id: m.id, status: 'published' }),
        smartApi.entities.Transaction.filter({ mosque_id: m.id }),
      ]);

      if (prayers.length) setPrayerTimes(prayers[0]);
      if (jumat.length) setJumatOfficer(jumat[0]);
      setActivities(acts.filter(a => a.status === 'upcoming' || a.status === 'ongoing').slice(0, 5));
      setAnnouncements(anns.slice(0, 4));
      setTransactions(txns);
    } catch (e) { console.error(e); setLoading(false); }
  }

  if (loading || !mosque) return <div className="min-h-screen bg-black flex items-center justify-center text-emerald-500 font-bold uppercase"><span className="animate-pulse">Menghubungkan ke {mosqueId}...</span></div>;

  const timezone = mosque.timezone || 'Asia/Jakarta';
  const timeHours = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: timezone });
  const timeSeconds = currentTime.toLocaleTimeString('id-ID', { second: '2-digit', timeZone: timezone });
  const dateStr = currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: timezone });
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
  const balance = totalIncome - totalExpense;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=1&format=png&data=${encodeURIComponent(`${window.location.origin}/donasi/${mosque.id}`)}`;
  const activePrayer = getActivePrayerOverlay(prayerTimes, currentTime, mosque.tv_prayer_overlay_duration || 15);
  const runningTexts = announcements.map(a => a.title).join('   ⭐   ') || `Sambut Rahmat Allah di ${mosque.name}`;
  
  const ongoingActivity = activities.find(a => a.status === 'ongoing') || activities[0];
  const absensiUrl = ongoingActivity ? `${window.location.origin}/absensi/${mosque?.id}/${ongoingActivity.id}` : null;

  return (
    <div 
      ref={containerRef} 
      className="h-screen w-screen bg-slate-950 text-white flex flex-col relative overflow-hidden select-none transition-colors duration-1000"
      style={mosque.tv_background_url ? { 
        backgroundImage: `url(${mosque.tv_background_url})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      } : {}}
    >
      {/* DARK OVERLAY FOR READABILITY */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] transition-opacity duration-1000 z-0" 
        style={{ opacity: mosque.tv_background_url ? 1 : 0 }} 
      />
      
      {/* PRAYER OVERLAY */}
      {activePrayer && (
        <div className="absolute inset-0 z-[100] bg-slate-950/95 backdrop-blur-3xl flex flex-col items-center justify-center p-10 animate-in fade-in duration-1000">
          <Clock className="w-32 h-32 text-emerald-500 mb-8 animate-pulse" />
          <h1 className="text-7xl font-black uppercase mb-6 tracking-[0.2em]">{activePrayer.prayer}</h1>
          <div className="bg-black/60 p-12 rounded-[4rem] border-2 border-emerald-500/30 text-5xl text-center max-w-6xl shadow-2xl leading-tight">
            {mosque.tv_prayer_overlay_text || "MOHON MATIKAN HP & RAPATKAN SHAF"}
          </div>
        </div>
      )}

      {/* CONDITIONAL LAYOUT */}
      {!mosque.tv_live_mode ? (
        <>
          <div className="flex justify-between p-6 gap-6 relative z-10 shrink-0">
            <div className="flex-1 bg-black/40 backdrop-blur-md rounded-[2.5rem] p-6 border border-white/10 flex items-center gap-6 shadow-2xl ring-1 ring-white/5">
              <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 overflow-hidden shadow-inner">
                <img src={mosque.logo_url || "/favicon.png"} className="max-w-[85%] max-h-[85%] object-contain" alt="logo" />
              </div>
              <div className="min-w-0">
                <h1 className="text-4xl font-black drop-shadow-lg tracking-tight truncate">{mosque.name}</h1>
                <p className="text-emerald-300/60 font-bold uppercase text-xs tracking-widest mt-1 truncate">
                   <Navigation className="w-4 h-4 inline mr-2" /> {mosque.address}, {mosque.city}
                </p>
              </div>
            </div>
            <div className="bg-black/40 backdrop-blur-md rounded-[2.5rem] p-6 border border-white/10 text-right pr-12 shadow-2xl flex flex-col justify-center">
              <p className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-1 italic">{dateStr}</p>
              <div className="flex items-baseline justify-end gap-2">
                <span className="text-7xl font-black tabular-nums tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">{timeHours}</span>
                <span className="text-2xl font-bold opacity-30 tabular-nums">:{timeSeconds}</span>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 relative z-10 shrink-0">
            <div className="bg-gradient-to-r from-emerald-950/80 to-slate-900/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-5 grid grid-cols-6 gap-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              {PRAYER_LABELS.map(p => {
                const time = prayerTimes?.[p.key] || '--:--';
                const dim = (p.key === 'jumat' && currentTime.getDay() !== 5) || (p.key === 'dzuhur' && currentTime.getDay() === 5);
                return (
                  <div key={p.key} className={`flex flex-col items-center justify-center p-5 rounded-[1.5rem] shadow-inner transition-all duration-700 ${dim ? 'opacity-10 scale-90 grayscale' : 'bg-white/[0.03] border border-white/5 ring-1 ring-white/5'}`}>
                    <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-2">{p.label}</p>
                    <p className="text-5xl font-black tabular-nums tracking-tight">{time}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex-1 px-6 pb-6 flex gap-6 relative z-10 overflow-hidden">
            <div className="w-[38%] flex flex-col gap-6 overflow-hidden">
               {mosque.tv_show_jumat && (
                 <SectionBox title="Agenda & Petugas" icon={CheckCircle2}>
                    {jumatOfficer ? (
                      <div className="space-y-3">
                         <div className="flex justify-between items-center bg-emerald-500/10 p-5 rounded-3xl border border-emerald-500/20 shadow-inner">
                            <span className="font-black text-emerald-300 uppercase tracking-widest text-[11px]">Khatib</span>
                            <span className="font-black text-2xl truncate ml-4 tracking-tighter">{jumatOfficer.khatib || '-'}</span>
                         </div>
                         <div className="flex justify-between items-center bg-black/30 p-5 rounded-3xl border border-white/5">
                            <span className="font-black text-white/30 uppercase tracking-widest text-[11px]">Imam</span>
                            <span className="font-bold text-xl truncate ml-4">{jumatOfficer.imam || '-'}</span>
                         </div>
                      </div>
                    ) : <div className="text-center italic opacity-20 py-10 font-bold">INFO JUMAT BELUM TERBIT</div>}
                 </SectionBox>
               )}
               {mosque.tv_show_announcements && (
                 <SectionBox title="Pengumuman Penting" icon={Megaphone} flex>
                    <div className="space-y-6">
                      {announcements.length ? announcements.slice(0, 2).map(a => (
                        <div key={a.id} className="border-l-4 border-emerald-500 pl-6 py-1">
                          <p className="font-black text-lg tracking-tight line-clamp-1 mb-1">{a.title}</p>
                          <p className="text-sm opacity-50 line-clamp-2 leading-relaxed">{a.content}</p>
                        </div>
                      )) : <div className="h-full flex items-center justify-center opacity-10 font-black">TIADA PENGUMUMAN</div>}
                    </div>
                 </SectionBox>
               )}
            </div>
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
               {mosque.tv_show_finance && (
                 <div className="flex-1 bg-black/60 p-6 rounded-[2.5rem] border border-white/10 flex flex-col shadow-2xl backdrop-blur-xl overflow-hidden">
                    <div className="flex justify-around items-center mb-6 border-b border-white/5 pb-6">
                      <div className="text-center px-4"><p className="text-[11px] font-black text-white/30 uppercase mb-2 tracking-widest">Infaq Bulan Ini</p><p className="font-black text-2xl italic tracking-tight">{formatRp(totalIncome)}</p></div>
                      <div className="text-center px-12 border-x border-white/5"><p className="text-[11px] font-black text-white/30 uppercase mb-2 tracking-widest">Saldo Saat Ini</p><p className="font-black text-4xl text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">{formatRp(balance)}</p></div>
                      <div className="text-center px-4"><p className="text-[11px] font-black text-white/30 uppercase mb-2 tracking-widest">Pengeluaran</p><p className="font-black text-2xl italic tracking-tight">{formatRp(totalExpense)}</p></div>
                    </div>
                    <div className="flex-1 min-h-0">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Tren Kas 6 Bulan Terakhir</span>
                      </div>
                      <FinancialChart transactions={transactions} height={180} isDark={true} />
                    </div>
                 </div>
               )}
               <div className="flex-1 rounded-[3rem] overflow-hidden border-2 border-white/10 relative shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] group bg-emerald-950/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                  
                  {/* Smart Attendance Kiosk Toggle */}
                  <div className="absolute top-8 right-8 z-50 animate-bounce">
                    <div className="bg-emerald-600 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-xl border border-emerald-400/30">
                      <UserCheck className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Absensi ON</span>
                    </div>
                  </div>

                  {ongoingActivity && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-1000 z-40 bg-black/40 backdrop-blur-sm">
                      <div className="mb-6 space-y-2">
                        <h3 className="text-3xl font-black tracking-tight">{ongoingActivity.title}</h3>
                        <p className="text-emerald-400 font-bold uppercase tracking-[0.3em] text-xs">Silakan Scan Kartu / Aplikasi Untuk Absen</p>
                      </div>
                      
                      <div className="bg-white p-6 rounded-[2.5rem] shadow-[0_0_50px_rgba(16,185,129,0.3)] border-8 border-emerald-500/20 group-hover:scale-105 transition-transform duration-700">
                        <QRCode value={absensiUrl} size={220} fgColor="#064e3b" level="H" />
                      </div>
                      
                      <div className="mt-8 flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/10">
                        <QrCode className="w-5 h-5 text-emerald-500" />
                        <span className="text-sm font-medium opacity-60">Arahkan kamera HP Anda ke layar TV</span>
                      </div>
                    </div>
                  )}

                  {!ongoingActivity && <Slideshow mosque={mosque} />}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               </div>
            </div>
          </div>
        </>
      ) : (
        /* ================== LIVE MODE UI ================== */
        <div className="flex-1 p-8 relative z-10 flex flex-col h-full bg-black">
           <div className="flex-1 rounded-[4.5rem] overflow-hidden border-[16px] border-white/5 relative bg-black shadow-[0_0_100px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
              <Slideshow mosque={mosque} />
              <div className="absolute top-12 right-12 bg-black/60 backdrop-blur-2xl border border-white/20 p-6 rounded-[2.5rem] text-right shadow-3xl z-30 ring-1 ring-white/5">
                 <p className="text-2xl font-black opacity-20 uppercase tracking-[0.4em] mb-1">{timerLabel(timezone)}</p>
                 <p className="text-6xl font-black tabular-nums tracking-tighter drop-shadow-2xl">{timeHours}</p>
                 <div className="h-1.5 w-full bg-emerald-500/20 mt-4 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 animate-[progress_60s_linear_infinite]" style={{width: '60%'}} />
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* BOTTOM BAR (SELALU ADA) */}
      <div className="h-32 px-6 pb-6 shrink-0 relative z-10 flex gap-6 mt-auto">
         {mosque.tv_show_qrcode && (
           <div className="flex bg-black/70 backdrop-blur-3xl rounded-[3rem] px-10 py-3 items-center gap-8 border border-white/10 shadow-2xl ring-1 ring-white/5">
             <div className="bg-white p-3 rounded-3xl shadow-xl ring-4 ring-emerald-500/10"><img src={qrUrl} className="w-16 h-16" alt="QR" /></div>
             <div>
               <p className="text-[11px] font-black text-emerald-400 tracking-[0.3em] uppercase mb-1 italic">Scan QRIS Infaq</p>
               <p className="font-black text-xl uppercase tracking-tighter text-white/90">Infaq jariyah anda</p>
             </div>
           </div>
         )}
        <div className="flex-1 bg-black/70 backdrop-blur-3xl rounded-[3rem] flex items-center px-12 border border-white/10 shadow-2xl overflow-hidden ring-1 ring-white/5">
           <div className="flex items-center gap-5 pr-12 border-r border-white/10 mr-12 py-4 shrink-0">
              <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_25px_rgba(16,185,129,1)]" />
              <span className="text-xs font-black tracking-[0.3em] text-emerald-400 uppercase italic">Maklumat</span>
           </div>
           <RunningText text={runningTexts} />
        </div>
      </div>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(100vw); } 100% { transform: translateX(-100%); } }
        .animate-marquee { animation: marquee 50s linear infinite; }
        @keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }
      `}</style>

      {/* FULLSCREEN TOGGLE BUTTON (HIDDEN IN PWA/STANDALONE) */}
      {!window.matchMedia('(display-mode: standalone)').matches && (
        <button 
          onClick={() => {
            if (!document.fullscreenElement) {
              containerRef.current.requestFullscreen().catch(err => {
                toast.error(`Error attempting to enable fullscreen: ${err.message}`);
              });
            } else {
              document.exitFullscreen();
            }
          }}
          className="fixed bottom-10 right-10 z-[200] p-4 bg-black/40 hover:bg-emerald-600 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl transition-all duration-300 opacity-20 hover:opacity-100 group"
        >
          {isFullscreen ? (
            <Minimize className="w-6 h-6 text-white group-hover:scale-110" />
          ) : (
            <Maximize className="w-6 h-6 text-white group-hover:scale-110" />
          )}
        </button>
      )}
    </div>
  );
}
