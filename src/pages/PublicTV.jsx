import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { smartApi } from "@/api/apiClient";
import { Clock, Navigation, Wallet, Calendar, Megaphone, CheckCircle2 } from "lucide-react";

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

function getActivePrayerOverlay(prayerTimes, currentTime, durationMinutes = 15) {
  if (!prayerTimes) return null;
  
  // Create Date objects for today
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

    // Jumat check - only show error if it's friday
    if (prayer.name === 'Jumat' && currentTime.getDay() !== 5) continue;
    // skip dzuhur if it's friday
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
  if (mosque.tv_slideshow_urls) {
    items = mosque.tv_slideshow_urls.split(',').map(s => s.trim()).filter(Boolean);
  } else if (mosque.cover_image_url) {
    items = [mosque.cover_image_url];
  }

  const ytUrl = mosque.tv_video_url || mosque.youtube;
  const showVideo = !!ytUrl && items.length === 0;
  
  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setIdx(i => (i + 1) % items.length), 8000);
    return () => clearInterval(t);
  }, [items.length]);

  if (showVideo) {
    const ytId = ytUrl.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)?.[1];
    if (ytId) {
      return (
        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <iframe 
            src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&rel=0&modestbranding=1&disablekb=1&iv_load_policy=3&cc_load_policy=0&playsinline=1`}
            className="w-full h-full pointer-events-none" 
            allow="autoplay" 
            title="Video" 
          />
        </div>
      );
    }
  }

  if (items.length > 0) {
    return (
      <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
        <img 
          key={items[idx]}
          src={items[idx]} 
          alt="Slide" 
          className="w-full h-full object-cover animate-in fade-in zoom-in-105 duration-1000 ease-in-out" 
        />
        {items.length > 1 && (
          <div className="absolute top-4 right-4 flex gap-2">
            <span className="bg-black/60 backdrop-blur text-white/90 text-xs px-2 py-1 rounded-full font-medium">
              {idx + 1} / {items.length}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-black/20 rounded-2xl border border-white/10">
      <div className="text-center text-white/50 space-y-3">
        <div className="p-4 bg-white/5 rounded-full inline-block">
          <Clock className="w-10 h-10 opacity-50" />
        </div>
        <p className="text-sm font-medium tracking-widest uppercase">Ruang Slide & Video</p>
      </div>
    </div>
  );
}

function SectionBox({ title, icon: Icon, children, flex = false }) {
  return (
    <div className={`flex flex-col bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl ${flex ? 'flex-1' : ''}`}>
      <div className="bg-gradient-to-r from-emerald-600/60 to-emerald-900/60 text-white font-bold px-5 py-3 text-sm tracking-wide flex items-center gap-2 border-b border-white/10 shadow-sm">
        {Icon && <Icon className="w-4 h-4 text-emerald-200" />}
        {title}
      </div>
      <div className={`text-white/90 p-5 overflow-hidden text-sm flex flex-col gap-3 ${flex ? 'flex-1' : ''}`}>
        {children}
      </div>
    </div>
  );
}

function RunningText({ text }) {
  return (
    <div className="overflow-hidden whitespace-nowrap flex-1">
      <div className="inline-block animate-marquee text-base font-semibold tracking-wide text-white/90">
        {text} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {text}
      </div>
    </div>
  );
}

export default function PublicTV() {
  const { id } = useParams();
  const [mosque, setMosque] = useState(null);
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [jumatOfficer, setJumatOfficer] = useState(null);
  const [activities, setActivities] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 60000);
    return () => clearInterval(interval);
  }, [id]);

  async function loadAll() {
    try {
      let m = null;
      if (id) {
        try {
          const bySlug = await smartApi.entities.Mosque.filter({ slug: id });
          if (bySlug?.length > 0) m = bySlug[0];
        } catch (_) {}

        if (!m) {
          try {
            const byId = await smartApi.entities.Mosque.filter({ id: id });
            if (byId?.length > 0) m = byId[0];
          } catch (_) {}
        }
      } else {
        const all = await smartApi.entities.Mosque.list();
        m = all.find(mos => mos.status === 'active') || all[0] || null;
      }

      if (!m) { setNotFound(true); setLoading(false); return; }
      setMosque(m);
      setLoading(false);

      const [prayers, jumat, acts, anns, txns] = await Promise.all([
        smartApi.entities.PrayerTime.filter({ mosque_id: m.id }, '-created_date', 1),
        smartApi.entities.JumatOfficer.filter({ mosque_id: m.id }, '-jumat_date', 1),
        smartApi.entities.Activity.filter({ mosque_id: m.id }, '-date', 10),
        smartApi.entities.Announcement.filter({ mosque_id: m.id, status: 'published' }, '-created_date', 5),
        smartApi.entities.Transaction.filter({ mosque_id: m.id }, '-date', 200),
      ]);

      if (prayers.length) setPrayerTimes(prayers[0]);
      if (jumat.length) setJumatOfficer(jumat[0]);
      setActivities(acts.filter(a => a.status === 'upcoming').slice(0, 5));
      setAnnouncements(anns.slice(0, 4));
      setTransactions(txns);
    } catch (e) {
      console.error('Error loading TV data:', e);
      setLoading(false);
    }
  }

  function toggleFS() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  if (notFound || !mosque) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
      <div className="text-center bg-black/30 p-10 rounded-3xl border border-white/5 backdrop-blur-md">
        <img src="/favicon.png" alt="Logo" className="h-24 w-24 mx-auto mb-6 object-contain" />
        <p className="text-2xl font-bold tracking-tight">Masjid Tidak Ditemukan</p>
      </div>
    </div>
  );

  const timezone = mosque.timezone || 'Asia/Jakarta';
  const tzLabel = { 'Asia/Jakarta': 'WIB', 'Asia/Makassar': 'WITA', 'Asia/Jayapura': 'WIT' }[timezone] || 'WIB';
  
  // Use formatting options directly for more beautiful display
  const timeHours = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: timezone });
  const timeSeconds = currentTime.toLocaleTimeString('id-ID', { second: '2-digit', timeZone: timezone });
  const dateStr = currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: timezone });

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  const donationUrl = `${window.location.origin}/donasi/${mosque.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=1&format=png&data=${encodeURIComponent(donationUrl)}`;

  const runningTexts = [
    announcements.map(a => `📢 ${a.title}`).join('   •   '),
    activities.map(a => `📅 ${a.title} (${formatDate(a.date)})`).join('   •   '),
    `💰 Saldo Kas Kasir: ${formatRp(balance)}`,
  ].filter(Boolean).join('   ⭐   ') || `Sambut Rahmat Allah di ${mosque.name}`;

  // Check Overlay Mode
  const activePrayer = getActivePrayerOverlay(prayerTimes, currentTime, mosque.tv_prayer_overlay_duration || 15);

  return (
    <div
      ref={containerRef}
      className="w-screen h-screen overflow-hidden flex flex-col text-white font-sans relative selection:bg-emerald-500/30"
      style={mosque.tv_background_url ? {} : {}}
    >
      {/* ── BACKGROUND LAYER ── */}
      {mosque.tv_background_url ? (
        // Foto masjid sebagai background
        <>
          <div
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${mosque.tv_background_url})` }}
          />
          {/* Overlay gelap agar teks tetap terbaca */}
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-black/75 via-black/60 to-black/80" />
          {/* Aksen warna hijau di sudut */}
          <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none z-0" />
          <div className="absolute -bottom-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none z-0" />
        </>
      ) : (
        // Default: gradient slate/emerald
        <>
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950" />
          <div className="absolute inset-0 z-0 opacity-[0.03] mix-blend-overlay" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M54.627 0l.83.83-54.627 54.627-.83-.83zM0 54.627l.83-.83 54.627-54.627.83.83z\' fill=\'%23ffffff\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")', backgroundSize: '100px'}} />
          <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none z-0" />
          <div className="absolute -bottom-[30%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none z-0" />
        </>
      )}

      {/* FULLSCREEN PRAYER OVERLAY */}
      {activePrayer && (
        <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
          <div className="absolute inset-0 bg-emerald-900/20 backdrop-blur flex flex-col items-center justify-center p-8">
            <div className="w-32 h-32 bg-emerald-500/20 rounded-full flex items-center justify-center mb-8 animate-pulse text-emerald-300">
              <Clock className="w-16 h-16" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-2">Telah Masuk Waktu Shalat</h1>
            <h2 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-emerald-200 drop-shadow-lg mb-12 uppercase tracking-widest">
              {activePrayer.prayer}
            </h2>
            
            <div className="max-w-4xl text-2xl md:text-4xl text-white/90 font-medium leading-relaxed bg-black/40 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl">
              {mosque.tv_prayer_overlay_text || "Mohon matikan handphone. Luruskan dan rapatkan shaf."}
            </div>
            
            <div className="mt-16 text-emerald-200/60 font-medium text-lg tracking-widest uppercase flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Layar akan normal dalam {activePrayer.remainingMins} menit
            </div>
          </div>
        </div>
      )}

      {/* Control Button (Hidden usually) */}
      <button onClick={toggleFS} className="absolute top-4 left-4 z-40 bg-black/40 backdrop-blur text-white/50 hover:text-white text-xs px-3 py-2 rounded-lg opacity-0 hover:opacity-100 transition-opacity border border-white/10">
        {fullscreen ? '⛶ Exit Fullscreen' : '⛶ Go Fullscreen'}
      </button>

      {/* TOP HEADER */}
      <div className="flex items-stretch justify-between px-6 pt-6 pb-4 shrink-0 gap-6 relative z-10">
        
        {/* Left: Logo & Info */}
        <div className="flex items-center gap-5 flex-1 bg-black/30 backdrop-blur-md rounded-3xl p-4 border border-white/10 shadow-xl max-w-3xl">
          <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/10 shadow-inner overflow-hidden">
            {mosque.logo_url ? (
              <img src={mosque.logo_url} alt="logo" className="w-full h-full object-contain p-1" />
            ) : (
              <img src="/favicon.png" alt="Logo" className="w-12 h-12 object-contain" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-white tracking-wide truncate drop-shadow-sm">{mosque.name}</h1>
            <p className="text-sm text-emerald-100/70 truncate flex items-center gap-1.5 mt-1">
              <Navigation className="w-3.5 h-3.5" /> 
              {mosque.address || 'Alamat belum diatur'} - {mosque.city}
            </p>
          </div>
        </div>

        {/* Right: Modern Clock */}
        <div className="bg-black/30 backdrop-blur-md rounded-3xl p-4 border border-white/10 shadow-xl flex items-center gap-6 pr-8">
          <div className="text-right">
            <div className="text-sm font-medium text-emerald-200/80 uppercase tracking-widest mb-1">{dateStr}</div>
            <div className="flex items-baseline justify-end gap-2 drop-shadow-md">
              <span className="text-5xl font-black tabular-nums tracking-tight">{timeHours}</span>
              <div className="flex flex-col text-left">
                <span className="text-lg font-bold text-white/60 tabular-nums leading-none">:{timeSeconds}</span>
                <span className="text-xs font-bold text-emerald-400 mt-0.5 leading-none">{tzLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULL WIDTH JADWAL SHALAT BANNER */}
      <div className="px-6 pb-6 shrink-0 relative z-10 w-full">
        <div className="bg-gradient-to-r from-emerald-900/60 via-emerald-800/40 to-emerald-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
          <div className="grid grid-cols-6 gap-3">
            {PRAYER_LABELS.map(p => {
              const isJumat = p.key === 'jumat';
              const time = prayerTimes?.[p.key] || '--:--';
              // Dim jumat on non-friday, or dim dzuhur on friday?
              const dim = (isJumat && currentTime.getDay() !== 5) || (p.key === 'dzuhur' && currentTime.getDay() === 5);
              
              return (
                <div key={p.key} className={`relative flex flex-col items-center justify-center p-3 rounded-xl transition-all ${dim ? 'opacity-40 grayscale' : 'bg-white/5 border border-white/10 shadow-inner'}`}>
                  <p className="text-xs font-semibold text-emerald-100/70 uppercase tracking-widest mb-1">{p.label}</p>
                  <p className="text-3xl font-bold tabular-nums text-white drop-shadow-sm">{time}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT GRID - Optimized for better data visibility */}
      <div className="flex-1 px-6 pb-6 overflow-hidden flex gap-6 relative z-10">
        
        {/* LEFT COLUMN (Information Sidebar) */}
        <div className="w-[42%] flex flex-col gap-4 h-full">
          
          {(mosque.tv_show_jumat ?? true) && (
            <SectionBox title="Petugas Shalat Jumat" icon={CheckCircle2}>
              {jumatOfficer ? (
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { label: 'Khatib', val: jumatOfficer.khatib },
                    { label: 'Imam', val: jumatOfficer.imam },
                    { label: 'Muadzin', val: jumatOfficer.muadzin }
                  ].map((p, i) => (
                    <div key={i} className="flex bg-black/25 rounded-xl p-3 border border-white/5 items-center justify-between">
                      <span className="text-emerald-300/80 text-xs font-bold tracking-widest uppercase">{p.label}</span>
                      <span className="font-bold text-lg text-white truncate ml-4">{p.val || '-'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center text-white/40 italic py-4">Belum ada jadwal</div>
              )}
            </SectionBox>
          )}

          {(mosque.tv_show_activities ?? true) && (
            <SectionBox title="Kegiatan Mendatang" icon={Calendar} flex>
              {activities.length === 0 ? (
                <div className="flex h-full items-center justify-center text-white/40 italic">Tidak ada kegiatan rutin</div>
              ) : (
                <div className="flex flex-col gap-2 overflow-hidden">
                  {activities.slice(0, 3).map(a => (
                    <div key={a.id} className="bg-black/25 p-3 rounded-xl border border-white/5">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-bold text-white text-sm line-clamp-1 flex-1">{a.title}</p>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                          {formatDate(a.date)}
                        </span>
                      </div>
                      {a.time_start && (
                        <p className="text-[11px] text-white/50 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {a.time_start} {a.time_end ? `- ${a.time_end}` : ''} 
                          {a.location && <span className="ml-2">📍 {a.location}</span>}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionBox>
          )}

          {(mosque.tv_show_announcements ?? true) && (
            <SectionBox title="Pengumuman" icon={Megaphone} flex>
              {announcements.length === 0 ? (
                <div className="flex h-full items-center justify-center text-white/40 italic">Belum ada pengumuman</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {announcements.slice(0, 2).map(a => (
                    <div key={a.id} className="relative pl-4 border-l-2 border-emerald-500/50">
                      <p className="font-bold text-sm text-white mb-1 line-clamp-1">{a.title}</p>
                      <p className="text-white/60 text-xs line-clamp-2 leading-relaxed">{a.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </SectionBox>
          )}
        </div>

        {/* RIGHT COLUMN (Visuals & Finance) */}
        <div className="flex-1 flex flex-col gap-4 h-full">
          
          {(mosque.tv_show_finance ?? true) && (
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-[10px] font-black text-emerald-400/70 tracking-widest uppercase mb-1">Pemasukan</p>
                <p className="text-xl font-bold text-white">{formatRp(totalIncome)}</p>
              </div>
              <div className="text-center border-x border-white/10">
                <p className="text-[10px] font-black text-rose-400/70 tracking-widest uppercase mb-1">Pengeluaran</p>
                <p className="text-xl font-bold text-white">{formatRp(totalExpense)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-blue-400/70 tracking-widest uppercase mb-1">Saldo Kas</p>
                <p className="text-xl font-black text-emerald-400">{formatRp(balance)}</p>
              </div>
            </div>
          )}

          {/* SLIDESHOW AREA - Filling remaining space */}
          <div className="flex-1 rounded-2xl overflow-hidden shadow-2xl relative">
             <Slideshow mosque={mosque} />
             {/* Gradient overlay for better look */}
             <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

      </div>

      {/* BOTTOM BAR - Barcode Donasi (Left) & Running Text (Right) */}
      <div className="flex items-stretch gap-4 px-6 pb-6 shrink-0 relative z-10 h-24">
        
        {(mosque.tv_show_qrcode ?? true) && (
          <div className="flex items-center gap-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2 flex-shrink-0 shadow-2xl">
            <div className="bg-white p-1.5 rounded-xl shadow-inner">
              <img src={qrUrl} alt="QRIS" className="w-14 h-14 object-contain" />
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-[10px] font-black text-emerald-400 tracking-widest uppercase">Donasi QRIS</p>
              <p className="text-xs font-semibold text-white/90 max-w-[120px] leading-tight mt-0.5">Scan untuk menyalurkan infaq</p>
            </div>
          </div>
        )}

        <div className="flex-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-2 overflow-hidden flex items-center shadow-2xl">
          <div className="flex items-center gap-3 pr-6 border-r border-white/10 mr-6 py-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]" />
            <p className="font-black text-xs text-emerald-100 tracking-widest uppercase whitespace-nowrap">Info Terkini</p>
          </div>
          <RunningText text={runningTexts} />
        </div>

      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 35s linear infinite;
        }
      `}</style>
    </div>
  );
}
