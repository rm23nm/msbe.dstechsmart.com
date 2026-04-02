import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { smartApi } from "@/api/apiClient";
import { formatCurrency, formatDate } from "@/lib/formatCurrency";
import {
  MapPin, Phone, Mail, Calendar, Clock, ArrowUpRight,
  ArrowDownRight, Wallet, Megaphone, Instagram, Youtube,
  Facebook, Globe, Landmark, UserPlus, Play, ChevronLeft, ChevronRight, Images,
  Bot, X, Send, ChevronDown, MessageSquare, ExternalLink
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const typeLabels = {
  shalat: "Shalat", kajian: "Kajian", pengajian: "Pengajian", ramadhan: "Ramadhan",
  idul_adha: "Idul Adha", idul_fitri: "Idul Fitri", sosial: "Sosial", rapat: "Rapat", lainnya: "Lainnya",
};

const priorityColors = {
  high: "bg-red-100 text-red-700", medium: "bg-amber-100 text-amber-700", low: "bg-blue-100 text-blue-700"
};

function GaleriMasjid({ photos, mosqueName }) {
  const [idx, setIdx] = useState(0);
  const prev = () => setIdx(i => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx(i => (i + 1) % photos.length);

  return (
    <div>
      <h2 className="font-semibold text-xl mb-4 flex items-center gap-2">
        <Images className="h-5 w-5 text-primary" /> Galeri Foto
      </h2>
      <div className="relative rounded-2xl overflow-hidden border shadow-md bg-muted group">
        <img
          key={idx}
          src={photos[idx]}
          alt={`Galeri ${mosqueName} ${idx + 1}`}
          className="w-full h-64 md:h-80 object-cover transition-opacity duration-500"
          onError={e => { e.target.style.display='none'; }}
        />
        {/* Overlay bawah */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <p className="text-sm font-semibold">{mosqueName}</p>
          <p className="text-xs text-white/70">Foto {idx + 1} dari {photos.length}</p>
        </div>
        {/* Counter dot */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 right-4 flex gap-1.5">
            {photos.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === idx ? 'bg-white w-5' : 'bg-white/50'}`} />
            ))}
          </div>
        )}
        {/* Nav arrows */}
        {photos.length > 1 && (
          <>
            <button onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {photos.map((url, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === idx ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}>
              <img src={url} alt={`thumb-${i}`} className="w-full h-full object-cover"
                onError={e => { e.target.style.display='none'; }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AI CHAT WIDGET untuk Halaman Masjid ────────────────────────────────────
function AIMosqueChatWidget({ mosque }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: `Assalamu'alaikum! 👋 Saya asisten ${mosque?.name || 'Masjid'}. Ada yang bisa saya bantu?` }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [showPreset, setShowPreset] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const presetQA = [
    { q: `Di mana lokasi ${mosque?.name}?`, a: `${mosque?.name} berlokasi di ${mosque?.address || '-'}, ${mosque?.city || ''}${mosque?.province ? ', ' + mosque.province : ''}. Silakan hubungi kami untuk petunjuk arah lebih lanjut.` },
    { q: 'Bagaimana cara menghubungi masjid?', a: `Anda bisa menghubungi ${mosque?.name} melalui:${mosque?.phone ? '\n📞 Telepon: ' + mosque.phone : ''}${mosque?.email ? '\n📧 Email: ' + mosque.email : ''}${mosque?.instagram ? '\n📸 Instagram: ' + mosque.instagram : ''}. Kami siap melayani Anda!` },
    { q: 'Apa saja kegiatan masjid?', a: `${mosque?.name} memiliki berbagai kegiatan rutin seperti shalat berjamaah 5 waktu, kajian mingguan, dan program sosial kemasyarakatan. Lihat jadwal kegiatan di halaman ini atau hubungi pengurus untuk info terbaru.` },
    { q: 'Bagaimana cara berdonasi?', a: `Terima kasih atas niat baik Anda untuk berdonasi ke ${mosque?.name}. Anda dapat berdonasi melalui platform online kami atau langsung menghubungi pengurus masjid. Setiap donasi Anda sangat berarti untuk kemajuan masjid.` },
    { q: 'Kapan waktu shalat?', a: `Jadwal shalat di ${mosque?.name} mengikuti jadwal shalat resmi berdasarkan lokasi masjid di ${mosque?.city || 'kota kami'}. Silakan cek pengumuman terkini di halaman ini atau hubungi pengurus masjid.` },
  ];

  function findAnswer(q) {
    const query = q.toLowerCase();
    for (const item of presetQA) {
      const keywords = item.q.toLowerCase().split(' ').filter(w => w.length > 3);
      if (keywords.some(kw => query.includes(kw))) return item.a;
    }
    return null;
  }

  async function sendMessage(text) {
    if (!text.trim()) return;
    const userMsg = text.trim();
    setMessages(prev => [...prev, { from: 'user', text: userMsg }]);
    setInput('');
    setShowPreset(false);
    setTyping(true);
    await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
    setTyping(false);
    const answer = findAnswer(userMsg);
    setMessages(prev => [...prev, {
      from: 'bot',
      text: answer || `Terima kasih atas pertanyaan Anda. Untuk informasi lebih lanjut tentang ${mosque?.name}, silakan hubungi langsung pengurus masjid${mosque?.phone ? ' di nomor ' + mosque.phone : ''}. Jazakallah khairan! 🕌`
    }]);
  }

  const waLink = mosque?.phone ? `https://wa.me/${mosque.phone.replace(/[^0-9]/g, '')}` : null;

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform"
        aria-label="Tanya AI Asisten Masjid"
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
        {!open && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border overflow-hidden flex flex-col" style={{ maxHeight: '520px' }}>
          <div className="bg-gradient-to-r from-primary to-emerald-600 px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              {mosque?.logo_url
                ? <img src={mosque.logo_url} alt="logo" className="w-full h-full rounded-full object-cover" />
                : <span className="text-xl">🕌</span>}
            </div>
            <div>
              <p className="text-white font-bold text-sm truncate max-w-[160px]">{mosque?.name || 'Asisten Masjid'}</p>
              <p className="text-white/70 text-xs flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-300 rounded-full" />AI Asisten Online</p>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto text-white/70 hover:text-white">
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.from === 'bot' && (
                  <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                  m.from === 'user'
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-white border text-gray-700 rounded-bl-sm shadow-sm'
                }`}>{m.text}</div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-white border px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex gap-1">
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            {showPreset && messages.length <= 1 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 text-center">Pilih pertanyaan</p>
                {presetQA.map((item, i) => (
                  <button key={i} onClick={() => sendMessage(item.q)}
                    className="w-full text-left text-xs px-3 py-2 bg-primary/5 border border-primary/20 rounded-xl hover:bg-primary/10 text-gray-700 transition-colors">
                    {item.q}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                placeholder="Tanya sesuatu..."
                className="flex-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button onClick={() => sendMessage(input)}
                className="w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary/90 flex-shrink-0">
                <Send className="h-4 w-4" />
              </button>
            </div>
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                <Phone className="h-3 w-3" /> WhatsApp Pengurus Masjid
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function MosquePortfolio() {
  const { id } = useParams();
  const [mosque, setMosque] = useState(null);
  const [activities, setActivities] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  // Handle auto-join from URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (mosque && urlParams.get('join') === 'true') {
      processJoin(mosque.id);
    }
  }, [mosque]);

  async function processJoin(mosqueId) {
    try {
      const me = await smartApi.auth.me();
      // Check if already a member
      const existing = await smartApi.entities.MosqueMember.filter({ user_email: me.email, mosque_id: mosqueId });
      if (existing.length === 0) {
        await smartApi.entities.MosqueMember.create({
          mosque_id: mosqueId,
          user_email: me.email,
          role: 'jamaah',
          status: 'active'
        });
        toast.success("Berhasil bergabung dengan masjid!");
      }
      window.location.href = '/dashboard';
    } catch (e) {
      // User is not logged in, redirect to login with join parameter
      smartApi.auth.redirectToLogin(window.location.pathname + '?join=true');
    }
  }

  const handleJoinClick = () => {
    processJoin(mosque?.id);
  };

  async function loadData() {
    setLoading(true);
    let mosqueData = null;
    try {
      const bySlug = await smartApi.entities.Mosque.filter({ slug: id });
      if (bySlug?.length > 0) {
        mosqueData = bySlug[0];
      } else {
        try {
          const byId = await smartApi.entities.Mosque.filter({ id: id });
          if (byId?.length > 0) mosqueData = byId[0];
        } catch (_) {}
      }
    } catch (e) {
      console.error('Error loading mosque:', e);
    }

    if (!mosqueData) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setMosque(mosqueData);

    const [acts, anns, txns] = await Promise.all([
      smartApi.entities.Activity.filter({ mosque_id: mosqueData.id, status: "upcoming" }, "date", 6),
      smartApi.entities.Announcement.filter({ mosque_id: mosqueData.id, status: "published" }, "-created_date", 5),
      mosqueData.show_financial ? smartApi.entities.Transaction.filter({ mosque_id: mosqueData.id }, "-date", 100) : Promise.resolve([]),
    ]);
    setActivities(acts);
    setAnnouncements(anns);
    setTransactions(txns);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Memuat halaman masjid...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Landmark className="h-16 w-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold">Masjid Tidak Ditemukan</h1>
          <p className="text-muted-foreground">Halaman masjid yang Anda cari tidak tersedia.</p>
          <Link to="/" className="text-primary hover:underline text-sm">Kembali ke Dashboard</Link>
        </div>
      </div>
    );
  }

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);

  // Month stats
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthTxns = transactions.filter(t => t.date?.startsWith(thisMonth));
  const monthIncome = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const monthExpense = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero / Cover */}
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-primary to-primary/70 overflow-hidden">
        {mosque.cover_image_url && (
          <img src={mosque.cover_image_url} alt={mosque.name} className="w-full h-full object-cover opacity-40 absolute inset-0" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="relative h-full flex flex-col justify-end p-6 md:p-10 max-w-5xl mx-auto">
          <div className="flex items-end justify-between gap-4 w-full">
            <div className="flex items-end gap-4">
              {mosque.logo_url ? (
                <img src={mosque.logo_url} alt="Logo" className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-white/30 shadow-lg bg-white" />
              ) : (
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center border-2 border-white/30 shadow-lg">
                  <Landmark className="h-8 w-8 text-white" />
                </div>
              )}
              <div className="text-white">
                <h1 className="text-2xl md:text-4xl font-bold drop-shadow">{mosque.name}</h1>
                <div className="flex items-center gap-1 mt-1 text-white/90 text-sm drop-shadow-sm">
                  <MapPin className="h-3.5 w-3.5" /> {mosque.city}{mosque.province ? `, ${mosque.province}` : ''}
                  {mosque.established_year && <span className="ml-2">• Est. {mosque.established_year}</span>}
                </div>
              </div>
            </div>
            
            <div className="hidden sm:block">
              <Link to={`/masjid/${mosque.slug || mosque.id}/login`}>
                <Button className="bg-white text-primary hover:bg-white/90 shadow-xl drop-shadow-md gap-2" size="lg">
                  <UserPlus className="h-4 w-4" /> Login Jamaah
                </Button>
              </Link>
            </div>
          </div>
          <div className="sm:hidden mt-4 w-full">
            <Link to={`/masjid/${mosque.slug || mosque.id}/login`}>
              <Button className="w-full bg-white text-primary hover:bg-white/90 shadow-lg gap-2">
                <UserPlus className="h-4 w-4" /> Login Jamaah
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-10">
        {/* About + Contact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-card rounded-2xl border p-6">
            <h2 className="font-semibold text-lg mb-3">Tentang Masjid</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {mosque.about || `${mosque.name} berlokasi di ${mosque.address}, ${mosque.city}. Masjid ini melayani jamaah dengan berbagai kegiatan ibadah dan sosial kemasyarakatan.`}
            </p>
            <div className="mt-4 pt-4 border-t space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" /> {mosque.address}, {mosque.city}
              </div>
              {mosque.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 text-primary" /> {mosque.phone}
                </div>
              )}
              {mosque.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 text-primary" /> {mosque.email}
                </div>
              )}
              {mosque.custom_domain && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="h-4 w-4 text-primary" />
                  <a href={`https://${mosque.custom_domain}`} target="_blank" rel="noreferrer" className="hover:text-primary hover:underline">
                    {mosque.custom_domain}
                  </a>
                </div>
              )}
            </div>
            {(mosque.instagram || mosque.facebook || mosque.youtube) && (
              <div className="flex gap-3 mt-4">
                {mosque.instagram && (
                  <a href={mosque.instagram} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors">
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {mosque.facebook && (
                  <a href={mosque.facebook} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {mosque.youtube && (
                  <a href={mosque.youtube} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                    <Youtube className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Sidebar info */}
          <div className="space-y-4">
            {mosque.show_financial && (
              <div className="bg-primary text-primary-foreground rounded-2xl p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Wallet className="h-4 w-4" /> Transparansi Keuangan
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-primary-foreground/70 text-xs">Saldo Kas</p>
                    <p className="text-xl font-bold">{formatCurrency(totalIncome - totalExpense)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white/10 rounded-xl p-3">
                      <p className="text-primary-foreground/70">Masuk Bulan Ini</p>
                      <p className="font-semibold mt-0.5 flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3" />{formatCurrency(monthIncome)}
                      </p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3">
                      <p className="text-primary-foreground/70">Keluar Bulan Ini</p>
                      <p className="font-semibold mt-0.5 flex items-center gap-1">
                        <ArrowDownRight className="h-3 w-3" />{formatCurrency(monthExpense)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-card rounded-2xl border p-5 text-sm text-muted-foreground space-y-2">
              <p className="font-semibold text-foreground mb-1">Info</p>
              {mosque.established_year && <p>📅 Berdiri sejak {mosque.established_year}</p>}
              <p>🏙️ {mosque.city}{mosque.province ? `, ${mosque.province}` : ''}</p>
              <p>📢 {announcements.length} pengumuman aktif</p>
              <p>🗓️ {activities.length} kegiatan mendatang</p>
            </div>
          </div>
        </div>

        {/* Announcements */}
        {announcements.length > 0 && (
          <div>
            <h2 className="font-semibold text-xl mb-4 flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" /> Pengumuman
            </h2>
            <div className="space-y-3">
              {announcements.map(a => (
                <div key={a.id} className="bg-card rounded-xl border p-4 flex items-start gap-3">
                  <div className="mt-0.5">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${priorityColors[a.priority] || priorityColors.low}`}>
                      {a.priority === 'high' ? 'Penting' : a.priority === 'medium' ? 'Sedang' : 'Info'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{a.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{a.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">{formatDate(a.created_date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── GALERI FOTO MASJID ── */}
        {(() => {
          const photos = mosque.tv_slideshow_urls
            ? mosque.tv_slideshow_urls.split(',').map(u => u.trim()).filter(Boolean)
            : mosque.cover_image_url ? [mosque.cover_image_url] : [];
          if (photos.length === 0) return null;

          return (
            <GaleriMasjid photos={photos} mosqueName={mosque.name} />
          );
        })()}

        {/* ── VIDEO MASJID ── */}
        {(() => {
          const ytUrl = mosque.tv_video_url || mosque.youtube;
          if (!ytUrl) return null;
          const ytId = ytUrl.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)?.[1];
          if (!ytId) return null;
          return (
            <div>
              <h2 className="font-semibold text-xl mb-4 flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" /> Video Masjid
              </h2>
              <div className="rounded-2xl overflow-hidden border shadow-md aspect-video bg-black">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1&disablekb=1&iv_load_policy=3&cc_load_policy=0`}
                  className="w-full h-full"
                  allow="encrypted-media; picture-in-picture"
                  allowFullScreen
                  title={`Video ${mosque.name}`}
                />
              </div>
            </div>
          );
        })()}

        {/* Activities */}
        {activities.length > 0 && (
          <div>
            <h2 className="font-semibold text-xl mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Kegiatan Mendatang
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activities.map(a => (
                <div key={a.id} className="bg-card rounded-xl border p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">{typeLabels[a.type] || a.type}</Badge>
                  </div>
                  <h3 className="font-semibold">{a.title}</h3>
                  {a.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.description}</p>}
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />{formatDate(a.date)}</div>
                    {a.time_start && <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{a.time_start}{a.time_end ? ` - ${a.time_end}` : ''}</div>}
                    {a.imam && <div className="flex items-center gap-1.5">🎤 {a.imam}</div>}
                    {a.location && <div className="flex items-center gap-1.5">📍 {a.location}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Masjid dengan Kontak Lengkap */}
        <footer className="border-t mt-4">
          {/* Kontak Info */}
          <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white py-10 px-6 rounded-2xl mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Info Masjid */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  {mosque.logo_url
                    ? <img src={mosque.logo_url} alt="Logo" className="w-12 h-12 rounded-xl object-cover border-2 border-white/20" />
                    : <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center"><Landmark className="h-6 w-6 text-white" /></div>
                  }
                  <div>
                    <h3 className="font-bold text-lg">{mosque.name}</h3>
                    <p className="text-white/60 text-sm">{mosque.city}{mosque.province ? `, ${mosque.province}` : ''}</p>
                  </div>
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-5">
                  {mosque.about || `${mosque.name} berkomitmen melayani jamaah dengan sepenuh hati. Bergabunglah dengan kami dalam setiap kegiatan ibadah dan kemasyarakatan.`}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                    <MapPin className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-white/80">{mosque.address}, {mosque.city}</span>
                  </div>
                  {mosque.phone && (
                    <a href={`tel:${mosque.phone}`} className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-xl p-3 transition-colors">
                      <Phone className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-sm text-white/80">{mosque.phone}</span>
                    </a>
                  )}
                  {mosque.email && (
                    <a href={`mailto:${mosque.email}`} className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-xl p-3 transition-colors">
                      <Mail className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-sm text-white/80 truncate">{mosque.email}</span>
                    </a>
                  )}
                  {mosque.custom_domain && (
                    <a href={`https://${mosque.custom_domain}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-xl p-3 transition-colors">
                      <Globe className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-sm text-white/80">{mosque.custom_domain}</span>
                      <ExternalLink className="h-3 w-3 text-white/40 ml-auto" />
                    </a>
                  )}
                </div>
                {/* Social media */}
                {(mosque.instagram || mosque.facebook || mosque.youtube) && (
                  <div className="flex gap-3 mt-4">
                    {mosque.instagram && (
                      <a href={mosque.instagram} target="_blank" rel="noreferrer" className="p-2 bg-pink-500/20 hover:bg-pink-500/30 rounded-lg transition-colors">
                        <Instagram className="h-5 w-5 text-pink-400" />
                      </a>
                    )}
                    {mosque.facebook && (
                      <a href={mosque.facebook} target="_blank" rel="noreferrer" className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors">
                        <Facebook className="h-5 w-5 text-blue-400" />
                      </a>
                    )}
                    {mosque.youtube && (
                      <a href={mosque.youtube} target="_blank" rel="noreferrer" className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors">
                        <Youtube className="h-5 w-5 text-red-400" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* CTA Bergabung */}
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <h4 className="font-bold mb-2 text-sm">🤝 Bergabung Sebagai Jamaah</h4>
                  <p className="text-white/60 text-xs mb-4 leading-relaxed">Daftar dan ikuti kegiatan {mosque.name} secara digital. Dapatkan notifikasi pengumuman dan jadwal terbaru.</p>
                  <Link to={`/masjid/${mosque.slug || mosque.id}/login`}>
                    <Button className="w-full bg-white text-primary hover:bg-white/90 text-sm" size="sm">
                      <UserPlus className="h-4 w-4 mr-2" /> Login / Daftar Jamaah
                    </Button>
                  </Link>
                </div>
                {mosque.phone && (
                  <a href={`https://wa.me/${mosque.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-2xl p-4 transition-colors">
                    <MessageSquare className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">WhatsApp Pengurus</p>
                      <p className="text-xs text-white/60">{mosque.phone}</p>
                    </div>
                  </a>
                )}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                  <p className="text-xs text-white/50 mb-1">Dikelola menggunakan</p>
                  <Link to="/" className="text-emerald-400 hover:text-emerald-300 text-sm font-bold">🕌 MasjidKu Smart</Link>
                  <p className="text-xs text-white/40 mt-1">Platform Digital Masjid #1 Indonesia</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground py-4 px-2">
            <p>© {new Date().getFullYear()} {mosque.name}. Hak cipta dilindungi.</p>
            <Link to="/" className="hover:text-primary transition-colors hover:underline">Daftarkan masjid Anda ke MasjidKu Smart →</Link>
          </div>
        </footer>
      </div>

      {/* AI Chat Widget Masjid */}
      <AIMosqueChatWidget mosque={mosque} />
    </div>
  );
}