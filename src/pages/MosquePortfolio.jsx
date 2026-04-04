import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { smartApi } from "@/api/apiClient";
import { formatCurrency, formatDate } from "@/lib/formatCurrency";
import QRCode from "react-qr-code";
import {
  MapPin, Phone, Mail, Calendar, Clock, ArrowUpRight, ArrowDownRight,
  Wallet, Megaphone, Instagram, Youtube, Facebook, Globe, Landmark,
  UserPlus, Play, ChevronLeft, ChevronRight, Bot, X, Send, ChevronDown,
  MessageSquare, ExternalLink, Smartphone, Home, Info, Images, DollarSign, Users, BookOpen
} from "lucide-react";
import QuranReader from "@/components/QuranReader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const typeLabels = { shalat:"Shalat",kajian:"Kajian",pengajian:"Pengajian",ramadhan:"Ramadhan",idul_adha:"Idul Adha",idul_fitri:"Idul Fitri",sosial:"Sosial",rapat:"Rapat",lainnya:"Lainnya" };
const priorityColors = { high:"bg-red-100 text-red-700",medium:"bg-amber-100 text-amber-700",low:"bg-blue-100 text-blue-700" };

function getYouTubeId(url) {
  if (!url) return null;
  return url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)?.[1] || null;
}

function parseMediaSlides(slideUrls, videoUrl, coverUrl) {
  const slides = [];
  if (slideUrls) {
    slideUrls.split(',').map(u => u.trim()).filter(Boolean).forEach(url => {
      const ytId = getYouTubeId(url);
      if (ytId) slides.push({ type: 'video', ytId });
      else slides.push({ type: 'photo', url });
    });
  }
  if (videoUrl) {
    const ytId = getYouTubeId(videoUrl);
    if (ytId && !slides.some(s => s.ytId === ytId)) slides.push({ type: 'video', ytId });
  }
  if (slides.length === 0 && coverUrl) slides.push({ type: 'photo', url: coverUrl });
  return slides;
}

// ── HERO SLIDER ──────────────────────────────────────────────────────────────
function HeroSlider({ slides, mosque }) {
  const [cur, setCur] = useState(0);
  const timer = useRef(null);
  const next = useCallback(() => setCur(c => (c + 1) % Math.max(slides.length, 1)), [slides.length]);
  const prev = () => setCur(c => (c - 1 + Math.max(slides.length, 1)) % Math.max(slides.length, 1));

  useEffect(() => {
    if (slides.length <= 1 || slides[cur]?.type === 'video') return;
    timer.current = setInterval(next, 5000);
    return () => clearInterval(timer.current);
  }, [cur, slides, next]);

  const slide = slides[cur];

  return (
    <div className="relative h-72 md:h-[520px] overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 group">
      {/* Background */}
      {!slide && (
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <Landmark className="h-48 w-48 text-white" />
        </div>
      )}
      {slide?.type === 'photo' && (
        <img key={slide.url} src={slide.url} alt={mosque.name}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
          onError={e => { e.target.style.opacity = 0; }} />
      )}
      {slide?.type === 'video' && (
        <iframe key={slide.ytId}
          src={`https://www.youtube-nocookie.com/embed/${slide.ytId}?autoplay=1&mute=1&loop=1&playlist=${slide.ytId}&rel=0&controls=0&modestbranding=1&iv_load_policy=3&cc_load_policy=0&disablekb=1`}
          className="absolute inset-0 w-full h-full scale-[1.15] pointer-events-none"
          allow="autoplay; encrypted-media" allowFullScreen title={mosque.name} />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40 pointer-events-none" />

      {/* Nav arrows */}
      {slides.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/80 text-white rounded-full p-2.5 backdrop-blur-sm border border-white/20 opacity-0 group-hover:opacity-100 transition-all">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/80 text-white rounded-full p-2.5 backdrop-blur-sm border border-white/20 opacity-0 group-hover:opacity-100 transition-all">
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((s, i) => (
            <button key={i} onClick={() => setCur(i)}
              className={`rounded-full transition-all border border-white/40 ${i === cur ? 'w-7 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/40'}`} />
          ))}
        </div>
      )}

      {slide?.type === 'video' && (
        <div className="absolute top-4 right-4 z-20 bg-red-600/90 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
          <Play className="h-3 w-3 fill-white" /> VIDEO
        </div>
      )}
      {slides.length > 1 && (
        <div className="absolute top-4 left-4 z-20 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
          {cur + 1}/{slides.length}
        </div>
      )}

      {/* Hero info overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 md:p-10">
        <div className="max-w-5xl mx-auto flex items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            {mosque.logo_url
              ? <img src={mosque.logo_url} alt="Logo" className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-white/40 shadow-2xl bg-white flex-shrink-0" />
              : <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/20 flex items-center justify-center border-2 border-white/30 shadow-2xl flex-shrink-0"><Landmark className="h-8 w-8 text-white" /></div>
            }
            <div className="text-white">
              <h1 className="text-2xl md:text-4xl font-bold drop-shadow-lg leading-tight">{mosque.name}</h1>
              <div className="flex items-center gap-1.5 mt-1.5 text-white/80 text-sm">
                <MapPin className="h-3.5 w-3.5" />
                <span>{mosque.city}{mosque.province ? `, ${mosque.province}` : ''}</span>
                {mosque.established_year && <span className="ml-2 text-white/60">• Est. {mosque.established_year}</span>}
              </div>
              {slides.length === 0 && (
                <p className="text-emerald-300 text-xs mt-1 italic">Belum ada foto/video — tambahkan di Pengaturan → Layar TV</p>
              )}
            </div>
          </div>
          <div className="hidden sm:block flex-shrink-0">
            <Link to={`/masjid/${mosque.slug || mosque.id}/login`}>
              <Button className="bg-white text-emerald-700 hover:bg-white/90 shadow-xl gap-2 font-semibold" size="lg">
                <UserPlus className="h-4 w-4" /> Login Jamaah
              </Button>
            </Link>
          </div>
        </div>
        <div className="sm:hidden max-w-5xl mx-auto mt-3">
          <Link to={`/masjid/${mosque.slug || mosque.id}/login`}>
            <Button className="w-full bg-white text-emerald-700 hover:bg-white/90 shadow-lg gap-2 font-semibold">
              <UserPlus className="h-4 w-4" /> Login Jamaah
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── TAB NAVIGATION ────────────────────────────────────────────────────────────
const TABS = [
  { id: 'beranda', label: 'Beranda', icon: Home },
  { id: 'pengumuman', label: 'Pengumuman', icon: Megaphone },
  { id: 'kegiatan', label: 'Kegiatan', icon: Calendar },
  { id: 'organisasi', label: 'Organisasi', icon: Users },
  { id: 'galeri', label: 'Galeri & Video', icon: Images },
  { id: 'quran', label: 'Al-Quran', icon: BookOpen },
  { id: 'keuangan', label: 'Keuangan', icon: DollarSign },
  { id: 'tentang', label: 'Tentang', icon: Info },
];

function TabNav({ active, setActive, counts }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current?.querySelector(`[data-tab="${active}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [active]);

  return (
    <div ref={ref} className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b shadow-sm overflow-x-auto">
      <div className="flex max-w-5xl mx-auto px-4">
        {TABS.map(tab => {
          const count = counts[tab.id];
          return (
            <button key={tab.id} data-tab={tab.id} onClick={() => setActive(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${active === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-primary/30'}`}>
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {count > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${active === tab.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>{count}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── AI CHAT ───────────────────────────────────────────────────────────────────
function AIChatWidget({ mosque }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ from: 'bot', text: `Assalamu'alaikum! 👋 Saya asisten ${mosque?.name}. Ada yang bisa saya bantu?` }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [showPreset, setShowPreset] = useState(true);
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, typing]);

  const presets = [
    { q: `Di mana lokasi ${mosque?.name}?`, a: `${mosque?.name} di ${mosque?.address}, ${mosque?.city}.` },
    { q: 'Cara menghubungi masjid?', a: `${mosque?.phone ? '📞 ' + mosque.phone : ''}${mosque?.email ? '\n📧 ' + mosque.email : ''}` },
    { q: 'Apa kegiatan masjid?', a: `${mosque?.name} memiliki shalat berjamaah, kajian, dan kegiatan sosial rutin. Lihat tab Kegiatan!` },
    { q: 'Cara berdonasi?', a: `Donasi ke ${mosque?.name} bisa langsung ke pengurus. Jazakallah khairan! 🤲` },
  ];

  async function send(text) {
    if (!text.trim()) return;
    setMsgs(p => [...p, { from: 'user', text: text.trim() }]);
    setInput(''); setShowPreset(false); setTyping(true);
    await new Promise(r => setTimeout(r, 900));
    setTyping(false);
    const q = text.toLowerCase();
    const found = presets.find(p => p.q.toLowerCase().split(' ').filter(w => w.length > 3).some(kw => q.includes(kw)));
    setMsgs(p => [...p, { from: 'bot', text: found?.a || `Untuk info lebih lanjut, hubungi pengurus ${mosque?.name}${mosque?.phone ? ' di ' + mosque.phone : ''}. 🕌` }]);
  }

  return (
    <>
      <button onClick={() => setOpen(o => !o)} className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform">
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
        {!open && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />}
      </button>
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border overflow-hidden flex flex-col" style={{ maxHeight: '500px' }}>
          <div className="bg-gradient-to-r from-primary to-emerald-600 px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
              {mosque?.logo_url ? <img src={mosque.logo_url} alt="logo" className="w-full h-full object-cover" /> : <img src="/favicon.png" className="w-6 h-6 object-contain" />}
            </div>
            <div>
              <p className="text-white font-bold text-sm">{mosque?.name}</p>
              <p className="text-white/70 text-xs flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-300 rounded-full" />AI Asisten Online</p>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto text-white/70 hover:text-white"><ChevronDown className="h-5 w-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.from === 'bot' && <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1"><Bot className="h-4 w-4 text-primary" /></div>}
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${m.from === 'user' ? 'bg-primary text-white rounded-br-sm' : 'bg-white border text-gray-700 rounded-bl-sm shadow-sm'}`}>{m.text}</div>
              </div>
            ))}
            {typing && <div className="flex items-center gap-2"><div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center"><Bot className="h-4 w-4 text-primary" /></div><div className="bg-white border px-4 py-3 rounded-2xl flex gap-1">{[0,150,300].map(d => <span key={d} className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}} />)}</div></div>}
            {showPreset && msgs.length <= 1 && <div className="space-y-1.5">{presets.map((p,i) => <button key={i} onClick={() => send(p.q)} className="w-full text-left text-xs px-3 py-2 bg-primary/5 border border-primary/20 rounded-xl hover:bg-primary/10 text-gray-700">{p.q}</button>)}</div>}
            <div ref={bottomRef} />
          </div>
          <div className="p-3 border-t bg-white">
            <div className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(input)} placeholder="Tanya sesuatu..." className="flex-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <button onClick={() => send(input)} className="w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center"><Send className="h-4 w-4" /></button>
            </div>
            {mosque?.phone && <a href={`https://wa.me/${mosque.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1 mt-2 text-xs text-emerald-600 font-medium"><Phone className="h-3 w-3" />WhatsApp Pengurus</a>}
          </div>
        </div>
      )}
    </>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function MosquePortfolio() {
  const { id } = useParams();
  const [mosque, setMosque] = useState(null);
  const [activities, setActivities] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('beranda');

  useEffect(() => { loadData(); }, [id]);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (mosque && p.get('join') === 'true') processJoin(mosque.id);
  }, [mosque]);

  async function processJoin(mosqueId) {
    try {
      const me = await smartApi.auth.me();
      const ex = await smartApi.entities.MosqueMember.filter({ user_email: me.email, mosque_id: mosqueId });
      if (ex.length === 0) await smartApi.entities.MosqueMember.create({ mosque_id: mosqueId, user_email: me.email, role: 'jamaah', status: 'active' });
      toast.success("Berhasil bergabung!"); window.location.href = '/dashboard';
    } catch { smartApi.auth.redirectToLogin(window.location.pathname + '?join=true'); }
  }

  async function loadData() {
    setLoading(true);
    let m = null;
    try {
      const s = await smartApi.entities.Mosque.filter({ slug: id });
      m = s?.[0] || null;
      if (!m) { const r = await smartApi.entities.Mosque.filter({ id }); m = r?.[0] || null; }
    } catch {}
    if (!m) { setNotFound(true); setLoading(false); return; }
    setMosque(m);
    const [acts, anns, txns] = await Promise.all([
      smartApi.entities.Activity.filter({ mosque_id: m.id, status: "upcoming" }, "date", 20),
      smartApi.entities.Announcement.filter({ mosque_id: m.id, status: "published" }, "-created_date", 20),
      m.show_financial ? smartApi.entities.Transaction.filter({ mosque_id: m.id }, "-date", 100) : Promise.resolve([]),
    ]);
    setActivities(acts); setAnnouncements(anns); setTransactions(txns);
    setLoading(false);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" /><p className="text-muted-foreground text-sm">Memuat halaman masjid...</p></div></div>;
  if (notFound) return <div className="min-h-screen flex items-center justify-center"><div className="text-center space-y-3"><Landmark className="h-16 w-16 text-muted-foreground mx-auto" /><h1 className="text-2xl font-bold">Masjid Tidak Ditemukan</h1><Link to="/" className="text-primary hover:underline text-sm">Kembali ke Beranda</Link></div></div>;

  const totalIn = transactions.filter(t => t.type === 'income').reduce((s,t) => s+(t.amount||0), 0);
  const totalOut = transactions.filter(t => t.type === 'expense').reduce((s,t) => s+(t.amount||0), 0);
  const thisMonth = new Date().toISOString().slice(0,7);
  const mTxn = transactions.filter(t => t.date?.startsWith(thisMonth));
  const mIn = mTxn.filter(t => t.type==='income').reduce((s,t) => s+(t.amount||0), 0);
  const mOut = mTxn.filter(t => t.type==='expense').reduce((s,t) => s+(t.amount||0), 0);

  const slides = parseMediaSlides(mosque.tv_slideshow_urls, mosque.tv_video_url, mosque.cover_image_url);
  const photoSlides = slides.filter(s => s.type === 'photo');
  const videoSlides = slides.filter(s => s.type === 'video');
  const mosqueUrl = `${window.location.origin}/masjid/${mosque.slug || mosque.id}`;

  const tabCounts = {
    beranda: 0,
    pengumuman: announcements.length,
    kegiatan: activities.length,
    galeri: slides.length,
    keuangan: transactions.length,
    tentang: 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── HERO SLIDER ── */}
      <HeroSlider slides={slides} mosque={mosque} />

      {/* ── TAB NAVIGATION ── */}
      <TabNav active={activeTab} setActive={setActiveTab} counts={tabCounts} />

      {/* ── TAB CONTENT ── */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">

        {/* BERANDA */}
        {activeTab === 'beranda' && (
          <div className="space-y-8">
            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: '📢', label: 'Pengumuman', val: announcements.length, tab: 'pengumuman' },
                { icon: '🗓️', label: 'Kegiatan', val: activities.length, tab: 'kegiatan' },
                { icon: '🎞️', label: 'Media', val: slides.length, tab: 'galeri' },
                { icon: '💰', label: 'Saldo Kas', val: mosque.show_financial ? formatCurrency(totalIn-totalOut) : '-', tab: 'keuangan', small: true },
              ].map((item, i) => (
                <button key={i} onClick={() => setActiveTab(item.tab)}
                  className="bg-card border rounded-2xl p-4 text-center hover:shadow-md hover:border-primary/30 transition-all group">
                  <p className="text-2xl mb-1">{item.icon}</p>
                  <p className={`font-bold text-primary group-hover:scale-105 transition-transform ${item.small ? 'text-sm' : 'text-2xl'}`}>{item.val}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
                </button>
              ))}
            </div>

            {/* About summary */}
            <div className="bg-card rounded-2xl border p-6">
              <h2 className="font-semibold text-lg mb-3 flex items-center gap-2"><Landmark className="h-5 w-5 text-primary" />Tentang {mosque.name}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{mosque.about || `${mosque.name} berlokasi di ${mosque.address}, ${mosque.city}. Melayani jamaah dengan berbagai kegiatan ibadah dan sosial kemasyarakatan.`}</p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 text-primary flex-shrink-0" />{mosque.address}, {mosque.city}</div>
                {mosque.phone && <a href={`tel:${mosque.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary"><Phone className="h-4 w-4 text-primary flex-shrink-0" />{mosque.phone}</a>}
                {mosque.email && <a href={`mailto:${mosque.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary"><Mail className="h-4 w-4 text-primary flex-shrink-0" />{mosque.email}</a>}
                {mosque.established_year && <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4 text-primary flex-shrink-0" />Berdiri sejak {mosque.established_year}</div>}
              </div>
              {(mosque.instagram||mosque.facebook||mosque.youtube) && (
                <div className="flex gap-3 mt-4">
                  {mosque.instagram && <a href={mosque.instagram} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100"><Instagram className="h-5 w-5" /></a>}
                  {mosque.facebook && <a href={mosque.facebook} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"><Facebook className="h-5 w-5" /></a>}
                  {mosque.youtube && <a href={mosque.youtube} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"><Youtube className="h-5 w-5" /></a>}
                </div>
              )}
            </div>

            {/* Latest announcements */}
            {announcements.slice(0, 3).length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-xl flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" />Pengumuman Terbaru</h2>
                  <button onClick={() => setActiveTab('pengumuman')} className="text-sm text-primary hover:underline">Lihat semua →</button>
                </div>
                <div className="space-y-3">
                  {announcements.slice(0, 3).map(a => (
                    <div key={a.id} className="bg-card rounded-xl border p-4 flex gap-3 hover:shadow-md transition-shadow">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-medium h-fit mt-0.5 ${priorityColors[a.priority]||priorityColors.low}`}>{a.priority==='high'?'🔴 Penting':a.priority==='medium'?'🟡 Sedang':'ℹ️ Info'}</span>
                      <div><h3 className="font-medium">{a.title}</h3><p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{a.content}</p><p className="text-xs text-muted-foreground mt-1">{formatDate(a.created_date)}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming activities */}
            {activities.slice(0, 4).length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-xl flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />Kegiatan Mendatang</h2>
                  <button onClick={() => setActiveTab('kegiatan')} className="text-sm text-primary hover:underline">Lihat semua →</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activities.slice(0, 4).map(a => (
                    <div key={a.id} className="bg-card rounded-xl border p-4 hover:shadow-md transition-shadow">
                      <Badge variant="secondary" className="text-xs mb-2">{typeLabels[a.type]||a.type}</Badge>
                      <h3 className="font-semibold">{a.title}</h3>
                      {a.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.description}</p>}
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3"/>{formatDate(a.date)}</span>
                        {a.time_start && <span className="flex items-center gap-1"><Clock className="h-3 w-3"/>{a.time_start}{a.time_end?` - ${a.time_end}`:''}</span>}
                        {a.location && <span>📍 {a.location}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Gallery */}
            {photoSlides.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-xl flex items-center gap-2"><Images className="h-5 w-5 text-primary"/>Galeri Foto</h2>
                  <button onClick={() => setActiveTab('galeri')} className="text-sm text-primary hover:underline">Lihat semua →</button>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {photoSlides.slice(0,8).map((s,i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden border bg-muted">
                      <img src={s.url} alt={`foto-${i+1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" onError={e => e.target.parentElement.style.display='none'} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PENGUMUMAN */}
        {activeTab === 'pengumuman' && (
          <div>
            <h2 className="font-semibold text-2xl mb-6 flex items-center gap-2"><Megaphone className="h-6 w-6 text-primary"/>Semua Pengumuman</h2>
            {announcements.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground"><Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30"/><p>Belum ada pengumuman</p></div>
            ) : (
              <div className="space-y-4">
                {announcements.map(a => (
                  <div key={a.id} className="bg-card rounded-xl border p-5 flex gap-3 hover:shadow-md transition-shadow">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-medium h-fit mt-0.5 ${priorityColors[a.priority]||priorityColors.low}`}>{a.priority==='high'?'🔴 Penting':a.priority==='medium'?'🟡 Sedang':'ℹ️ Info'}</span>
                    <div className="flex-1"><h3 className="font-semibold text-base">{a.title}</h3><p className="text-sm text-muted-foreground mt-2 leading-relaxed">{a.content}</p><p className="text-xs text-muted-foreground mt-3">{formatDate(a.created_date)}</p></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* KEGIATAN */}
        {activeTab === 'kegiatan' && (
          <div>
            <h2 className="font-semibold text-2xl mb-6 flex items-center gap-2"><Calendar className="h-6 w-6 text-primary"/>Semua Kegiatan</h2>
            {activities.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground"><Calendar className="h-12 w-12 mx-auto mb-3 opacity-30"/><p>Belum ada kegiatan mendatang</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activities.map(a => (
                  <div key={a.id} className="bg-card rounded-xl border p-5 hover:shadow-md transition-shadow">
                    <Badge variant="secondary" className="text-xs mb-3">{typeLabels[a.type]||a.type}</Badge>
                    <h3 className="font-semibold text-base">{a.title}</h3>
                    {a.description && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{a.description}</p>}
                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2"><Calendar className="h-3 w-3"/>{formatDate(a.date)}</div>
                      {a.time_start && <div className="flex items-center gap-2"><Clock className="h-3 w-3"/>{a.time_start}{a.time_end?` - ${a.time_end}`:''}</div>}
                      {a.imam && <div>🎤 {a.imam}</div>}
                      {a.location && <div>📍 {a.location}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STRUKTUR ORGANISASI */}
        {activeTab === 'organisasi' && (
          <div className="space-y-8">
            <div className="text-center md:text-left">
              <h2 className="font-semibold text-2xl flex items-center justify-center md:justify-start gap-2">
                <Users className="h-6 w-6 text-primary" />
                Struktur Organisasi {mosque.name}
              </h2>
              <p className="text-muted-foreground mt-2">Daftar pengurus dan struktur manajemen DKM (Dewan Kemakmuran Masjid).</p>
            </div>

            {mosque.organization_structure_url ? (
              <div className="bg-card border rounded-2xl p-4 md:p-8 shadow-sm overflow-hidden group">
                <div className="relative rounded-xl overflow-hidden bg-muted border">
                  <img 
                    src={mosque.organization_structure_url} 
                    alt="Struktur Organisasi" 
                    className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&q=80'; }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                </div>
                <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-center gap-3">
                  <Info className="h-5 w-5 text-primary flex-shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Struktur di atas adalah susunan pengurus resmi {mosque.name} yang berlaku saat ini. Hubungi sekretariat masjid untuk informasi lebih lanjut mengenai kepengurusan.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-card border rounded-2xl p-12 text-center text-muted-foreground">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <h3 className="font-semibold text-lg text-foreground">Gambar Struktur Belum Tersedia</h3>
                <p className="text-sm max-w-sm mx-auto mt-2 italic">Pengurus belum mengunggah gambar struktur organisasi masjid ini.</p>
                {/* Petunjuk buat admin (hanya info teks) */}
                <p className="text-[10px] mt-6 opacity-60">Admin bisa mengunggah gambar ini di menu Pengaturan Masjid.</p>
              </div>
            )}
          </div>
        )}

        {/* GALERI & VIDEO */}
        {activeTab === 'galeri' && (
          <div className="space-y-10">
            {photoSlides.length > 0 && (
              <div>
                <h2 className="font-semibold text-2xl mb-4 flex items-center gap-2"><Images className="h-6 w-6 text-primary"/>Galeri Foto <span className="text-base text-muted-foreground font-normal">({photoSlides.length} foto)</span></h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {photoSlides.map((s,i) => (
                    <div key={i} className="aspect-video rounded-xl overflow-hidden border bg-muted group">
                      <img src={s.url} alt={`foto-${i+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={e => e.target.parentElement.style.display='none'} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {videoSlides.length > 0 && (
              <div>
                <h2 className="font-semibold text-2xl mb-4 flex items-center gap-2"><Play className="h-6 w-6 text-primary"/>Video Masjid <span className="text-base text-muted-foreground font-normal">({videoSlides.length} video)</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {videoSlides.map((s,i) => (
                    <div key={i} className="rounded-2xl overflow-hidden border shadow-md aspect-video bg-black">
                      <iframe src={`https://www.youtube-nocookie.com/embed/${s.ytId}?rel=0&modestbranding=1&iv_load_policy=3&cc_load_policy=0&disablekb=1`} className="w-full h-full" allow="encrypted-media; picture-in-picture" allowFullScreen title={`Video ${i+1}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {slides.length === 0 && (
              <div className="text-center py-16 text-muted-foreground"><Images className="h-12 w-12 mx-auto mb-3 opacity-30"/><p>Belum ada foto atau video</p><p className="text-xs mt-1">Tambahkan di Pengaturan → Layar TV</p></div>
            )}
          </div>
        )}

        {/* AL-QURAN */}
        {activeTab === 'quran' && (
          <div className="space-y-6">
            <h2 className="font-semibold text-2xl flex items-center gap-2"><BookOpen className="h-6 w-6 text-primary"/>Al-Quran & Tafsir</h2>
            <QuranReader isPublic={true} />
          </div>
        )}

        {/* KEUANGAN */}
        {activeTab === 'keuangan' && (
          <div>
            <h2 className="font-semibold text-2xl mb-6 flex items-center gap-2"><Wallet className="h-6 w-6 text-primary"/>Laporan Keuangan</h2>
            {!mosque.show_financial ? (
              <div className="text-center py-16 text-muted-foreground"><Wallet className="h-12 w-12 mx-auto mb-3 opacity-30"/><p>Laporan keuangan tidak dipublikasikan</p></div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label:'Total Pemasukan', val: formatCurrency(totalIn), icon:'📈', color:'bg-emerald-50 border-emerald-200 text-emerald-700' },
                    { label:'Total Pengeluaran', val: formatCurrency(totalOut), icon:'📉', color:'bg-red-50 border-red-200 text-red-700' },
                    { label:'Saldo Kas', val: formatCurrency(totalIn-totalOut), icon:'💰', color:'bg-blue-50 border-blue-200 text-blue-700' },
                  ].map((item, i) => (
                    <div key={i} className={`rounded-2xl border p-5 ${item.color}`}>
                      <p className="text-2xl mb-1">{item.icon}</p>
                      <p className="text-xs font-medium opacity-70">{item.label}</p>
                      <p className="text-xl font-bold mt-1">{item.val}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                    <p className="text-xs text-emerald-700 font-medium">Masuk Bulan Ini</p>
                    <p className="text-lg font-bold text-emerald-700 flex items-center gap-1 mt-1"><ArrowUpRight className="h-4 w-4"/>{formatCurrency(mIn)}</p>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                    <p className="text-xs text-red-700 font-medium">Keluar Bulan Ini</p>
                    <p className="text-lg font-bold text-red-700 flex items-center gap-1 mt-1"><ArrowDownRight className="h-4 w-4"/>{formatCurrency(mOut)}</p>
                  </div>
                </div>
                {transactions.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Riwayat Transaksi Terbaru</h3>
                    <div className="space-y-2">
                      {transactions.slice(0, 20).map(t => (
                        <div key={t.id} className="flex items-center justify-between bg-card rounded-xl border p-3">
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${t.type==='income'?'bg-emerald-100':'bg-red-100'}`}>{t.type==='income'?'📈':'📉'}</span>
                            <div><p className="text-sm font-medium">{t.description||t.category}</p><p className="text-xs text-muted-foreground">{formatDate(t.date)}</p></div>
                          </div>
                          <p className={`font-semibold text-sm ${t.type==='income'?'text-emerald-600':'text-red-600'}`}>{t.type==='income'?'+':'-'}{formatCurrency(t.amount)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TENTANG */}
        {activeTab === 'tentang' && (
          <div className="space-y-6">
            <h2 className="font-semibold text-2xl flex items-center gap-2"><Info className="h-6 w-6 text-primary"/>Tentang {mosque.name}</h2>
            <div className="bg-card rounded-2xl border p-6">
              <p className="text-muted-foreground leading-relaxed">{mosque.about || `${mosque.name} berlokasi di ${mosque.address}, ${mosque.city}. Masjid ini melayani jamaah dengan berbagai kegiatan ibadah dan sosial kemasyarakatan.`}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                mosque.address && { icon: <MapPin className="h-5 w-5 text-primary"/>, label:'Alamat', val: `${mosque.address}, ${mosque.city}${mosque.province?', '+mosque.province:''}` },
                mosque.phone && { icon: <Phone className="h-5 w-5 text-primary"/>, label:'Telepon', val: mosque.phone, link: `tel:${mosque.phone}` },
                mosque.email && { icon: <Mail className="h-5 w-5 text-primary"/>, label:'Email', val: mosque.email, link: `mailto:${mosque.email}` },
                mosque.established_year && { icon: <Calendar className="h-5 w-5 text-primary"/>, label:'Tahun Berdiri', val: mosque.established_year },
                mosque.custom_domain && { icon: <Globe className="h-5 w-5 text-primary"/>, label:'Website', val: mosque.custom_domain, link: `https://${mosque.custom_domain}` },
              ].filter(Boolean).map((item, i) => (
                <div key={i} className="bg-card rounded-xl border p-4 flex items-start gap-3">
                  {item.icon}
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    {item.link
                      ? <a href={item.link} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">{item.val}</a>
                      : <p className="text-sm font-medium">{item.val}</p>}
                  </div>
                </div>
              ))}
            </div>
            {/* Social Media */}
            {(mosque.instagram||mosque.facebook||mosque.youtube) && (
              <div className="bg-card rounded-2xl border p-5">
                <p className="font-semibold mb-3">Media Sosial</p>
                <div className="flex gap-3">
                  {mosque.instagram && <a href={mosque.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-600 rounded-xl text-sm font-medium hover:bg-pink-100"><Instagram className="h-4 w-4"/>Instagram</a>}
                  {mosque.facebook && <a href={mosque.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100"><Facebook className="h-4 w-4"/>Facebook</a>}
                  {mosque.youtube && <a href={mosque.youtube} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100"><Youtube className="h-4 w-4"/>YouTube</a>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── FOOTER ── */}
        <footer className="mt-16 pt-8 border-t">
          <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-2xl p-8 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Mosque Info */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  {mosque.logo_url ? <img src={mosque.logo_url} alt="Logo" className="w-12 h-12 rounded-xl object-cover border-2 border-white/20"/> : <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center"><Landmark className="h-6 w-6 text-white"/></div>}
                  <div><h3 className="font-bold text-lg">{mosque.name}</h3><p className="text-white/60 text-sm">{mosque.city}{mosque.province?`, ${mosque.province}`:''}</p></div>
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-5">{mosque.about||`${mosque.name} berkomitmen melayani jamaah dengan sepenuh hati.`}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                  <img src="/favicon.png" className="h-4 w-4 object-contain mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-white/80">{mosque.address}, {mosque.city}</span>
                </div>  {mosque.phone && <a href={`tel:${mosque.phone}`} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-xl p-3 text-sm text-white/80"><Phone className="h-4 w-4 text-emerald-400"/>{mosque.phone}</a>}
                  {mosque.email && <a href={`mailto:${mosque.email}`} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 rounded-xl p-3 text-sm text-white/80 truncate"><Mail className="h-4 w-4 text-emerald-400 flex-shrink-0"/>{mosque.email}</a>}
                </div>
                {(mosque.instagram||mosque.facebook||mosque.youtube) && (
                  <div className="flex gap-3 mt-4">
                    {mosque.instagram && <a href={mosque.instagram} target="_blank" rel="noreferrer" className="p-2 bg-pink-500/20 hover:bg-pink-500/30 rounded-lg"><Instagram className="h-5 w-5 text-pink-400"/></a>}
                    {mosque.facebook && <a href={mosque.facebook} target="_blank" rel="noreferrer" className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg"><Facebook className="h-5 w-5 text-blue-400"/></a>}
                    {mosque.youtube && <a href={mosque.youtube} target="_blank" rel="noreferrer" className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg"><Youtube className="h-5 w-5 text-red-400"/></a>}
                  </div>
                )}
              </div>

              {/* QR + Join */}
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Smartphone className="h-4 w-4 text-emerald-400"/>
                    <p className="text-sm font-semibold text-emerald-300">Aplikasi Mobile</p>
                    <span className="bg-emerald-500 text-white px-1.5 py-0.5 rounded text-[9px] font-bold">BARU</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl inline-block mb-3 shadow-lg relative">
                    <QRCode value={mosqueUrl} size={110} level="H" />
                  </div>
                  <p className="text-xs text-white/50 leading-snug">Scan untuk membuka halaman <b className="text-white/70">{mosque.name}</b> di HP Anda</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-sm font-bold mb-2">🤝 Bergabung Sebagai Jamaah</p>
                  <Link to={`/masjid/${mosque.slug||mosque.id}/login`}>
                    <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white" size="sm"><UserPlus className="h-4 w-4 mr-2"/>Login / Daftar Jamaah</Button>
                  </Link>
                </div>
                {mosque.phone && (
                  <a href={`https://wa.me/${mosque.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-2xl p-4 transition-colors">
                    <MessageSquare className="h-5 w-5 text-green-400 flex-shrink-0"/>
                    <div><p className="text-sm font-semibold">WhatsApp Pengurus</p><p className="text-xs text-white/60">{mosque.phone}</p></div>
                  </a>
                )}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                  <p className="text-xs text-white/50 mb-1">Dikelola menggunakan</p>
                  <Link to="/" className="flex items-center justify-center gap-2 text-emerald-400 hover:text-emerald-300 font-bold">
                    <img src="/favicon.png" alt="MasjidKu Smart" className="h-6 w-6 rounded-md object-contain" />
                    MasjidKu Smart
                  </Link>
                  <p className="text-xs text-white/40 mt-1">Platform Digital Masjid #1 Indonesia</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground pb-6">
            <p>© {new Date().getFullYear()} {mosque.name}. Hak cipta dilindungi.</p>
            <Link to="/" className="hover:text-primary hover:underline">Daftarkan masjid Anda ke MasjidKu Smart →</Link>
          </div>
        </footer>
      </div>

      <AIChatWidget mosque={mosque}/>
    </div>
  );
}