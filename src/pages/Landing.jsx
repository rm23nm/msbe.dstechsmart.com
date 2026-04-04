import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import QRCode from "react-qr-code";
import { smartApi } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  CheckCircle, Star, Users, Calendar, DollarSign, Package, Globe, Sparkles, Monitor, ChevronLeft, ChevronRight,
  Play, Pause, MessageSquare, TrendingUp, Shield, Wifi, Megaphone,
  BarChart3, Gift, FileText, CheckCircle2, Phone, Mail, MapPin, Send, Bot, X, ChevronDown
} from "lucide-react";

const FEATURES = [
  { icon: Calendar, title: "Jadwal Shalat & Jumat", desc: "Atur jadwal shalat 5 waktu, petugas Jumat, dan tampilkan otomatis di layar TV masjid", color: "bg-emerald-50 text-emerald-600" },
  { icon: DollarSign, title: "Manajemen Keuangan", desc: "Catat pemasukan & pengeluaran, laporan otomatis per periode dengan grafik interaktif", color: "bg-blue-50 text-blue-600" },
  { icon: Users, title: "Kelola Data Jamaah", desc: "Database jamaah terstruktur, kategori member, status, dan kirim pengingat langsung via email", color: "bg-purple-50 text-purple-600" },
  { icon: Package, title: "Inventory Aset Masjid", desc: "Catat, pantau, dan kelola semua aset masjid lengkap dengan kondisi dan pemeliharaan", color: "bg-amber-50 text-amber-600" },
  { icon: Globe, title: "Halaman Publik Masjid", desc: "Website masjid profesional yang bisa dibagikan ke seluruh jamaah dengan custom domain", color: "bg-rose-50 text-rose-600" },
  { icon: Monitor, title: "Digital Signage (Public TV)", desc: "Tampilan otomatis layar TV untuk jadwal shalat, pengumuman, donasi, dan keuangan masjid", color: "bg-cyan-50 text-cyan-600" },
  { icon: Megaphone, title: "Pengumuman & Notifikasi", desc: "Broadcast pengumuman penting dan kirim notifikasi real-time ke seluruh jamaah", color: "bg-indigo-50 text-indigo-600" },
  { icon: Sparkles, title: "AI Analytics & Insights", desc: "Analisis otomatis data keuangan dan kegiatan dengan rekomendasi cerdas dari AI", color: "bg-pink-50 text-pink-600" },
  { icon: Gift, title: "Manajemen Donasi & Zakat", desc: "Terima donasi online via Midtrans, tracking transparansi, dan QR code donasi", color: "bg-green-50 text-green-600" },
  { icon: BarChart3, title: "Laporan & Analytics", desc: "Laporan keuangan detail, grafik pendapatan, cash flow analysis, dan export PDF", color: "bg-teal-50 text-teal-600" },
  { icon: FileText, title: "Manajemen Kegiatan", desc: "Atur kajian, perayaan, rapat, dan kegiatan masjid dengan kalender terintegrasi", color: "bg-orange-50 text-orange-600" },
  { icon: CheckCircle2, title: "Absensi & Tracking Kehadiran", desc: "Tracking kehadiran jamaah di kegiatan dengan sistem QR code yang mudah digunakan", color: "bg-violet-50 text-violet-600" },
];

// Slide bisa berupa: { image, title, sub } atau { videoId (YouTube), title, sub, thumb }
const HERO_SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1591500366657-6be094e410b0?w=1600&q=80",
    title: "Kelola Masjid Lebih Cerdas",
    sub: "Platform digital terlengkap untuk administrasi, keuangan, dan informasi masjid modern",
  },
  {
    // Slide Video — Promosi Masjid
    videoId: "R2_FWcaazSA",
    thumb: "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=1600&q=80",
    title: "Profil Video Masjid Anda",
    sub: "Tampilkan video profil masjid — kajian, kegiatan, dan momen berharga jamaah di landing page",
    tag: "📹 Video Promosi",
  },
  {
    image: "https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1600&q=80",
    title: "Transparansi Keuangan Masjid",
    sub: "Laporan keuangan otomatis, donasi online, dan audit trail lengkap untuk kepercayaan jamaah",
  },
  {
    // Slide Video — Kegiatan
    videoId: "X4mHVQOLTzY",
    thumb: "https://images.unsplash.com/photo-1466442929976-97f336a657be?w=1600&q=80",
    title: "Kegiatan & Kajian Live",
    sub: "Tayangkan video kajian, ceramah, dan kegiatan masjid secara otomatis untuk jamaah di mana saja",
    tag: "🎥 Siaran Langsung",
  },
  {
    image: "https://images.unsplash.com/photo-1585036156171-384164a8c675?w=1600&q=80",
    title: "Informasi Real-time di Layar TV",
    sub: "Tampilkan jadwal, pengumuman, dan berita masjid langsung di layar digital secara otomatis",
  },
];

// Video kegiatan masjid — placeholder, akan digantikan data dari API
const MOSQUE_VIDEOS_DEFAULT = [
  { videoId: "R2_FWcaazSA", mosqueName: "Contoh Masjid", mosqueCity: "Jakarta", desc: "Suasana Khutbah Jumat" },
];

// Fitur/dokumen masjid — statis untuk ilustrasi fitur aplikasi di landing
const MOSQUE_ACTIVITIES = [
  { icon: <img src="/favicon.png" className="w-5 h-5 object-contain" />, title: "Jadwal Shalat Harian", desc: "Jadwal shalat 5 waktu terupdate otomatis setiap hari lengkap dengan Subuh, Dzuhur, Ashar, Maghrib, dan Isya", color: "from-emerald-500 to-teal-600" },
  { emoji: "📋", title: "Laporan Keuangan Bulanan", desc: "Dokumen laporan kas masuk, kas keluar, dan saldo masjid yang transparan dan bisa diakses jamaah kapanpun", color: "from-blue-500 to-indigo-600" },
  { emoji: "📣", title: "Pengumuman & Notifikasi", desc: "Broadcast pengumuman Jumat, peringatan hari besar Islam, dan agenda kegiatan langsung ke jamaah", color: "from-amber-500 to-orange-600" },
  { emoji: "🎓", title: "Jadwal Kajian & Ceramah", desc: "Dokumentasi jadwal kajian rutin, nama pemateri, tema, dan rekaman video kajian yang bisa diputar ulang", color: "from-purple-500 to-violet-600" },
  { emoji: "🤝", title: "Program Sosial & Zakat", desc: "Dokumen program santunan, zakat, infaq, dan sedekah beserta daftar penerima manfaat yang terverifikasi", color: "from-rose-500 to-pink-600" },
  { emoji: "🏗️", title: "Inventarisasi Aset Masjid", desc: "Pencatatan seluruh aset masjid: properti, kendaraan, peralatan, beserta kondisi dan jadwal pemeliharaan", color: "from-slate-500 to-gray-600" },
];


const TESTIMONIALS = [
  {
    name: "Ustadz Ahmad Fauzi",
    role: "Ketua DKM Masjid Al-Ikhlas, Jakarta",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    rating: 5,
    text: "MasjidKu benar-benar mengubah cara kami mengelola masjid. Laporan keuangan kini transparan dan jamaah bisa melihat langsung. Sangat recommended untuk masjid modern!",
  },
  {
    name: "Bpk. Hendra Wijaya",
    role: "Bendahara Masjid Baiturrohman, Bandung",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
    rating: 5,
    text: "Fitur AI Analitik sangat membantu saya memahami tren keuangan masjid. Rekomendasi yang diberikan sangat praktis dan bisa langsung diterapkan. Luar biasa!",
  },
  {
    name: "Ibu Siti Rahmawati",
    role: "Sekretaris DKM Masjid Taqwa, Surabaya",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    rating: 5,
    text: "Pengelolaan data jamaah jadi sangat mudah. Export CSV, kirim email, pencarian cepat — semua tersedia. Tampilan TV untuk info publik juga sangat profesional!",
  },
  {
    name: "Ust. Ridwan Karim",
    role: "Imam Masjid Al-Hidayah, Medan",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
    rating: 5,
    text: "Layar TV masjid kami kini menampilkan jadwal shalat otomatis. Jamaah sangat terbantu dan pengurus tidak perlu update manual lagi. Support tim MasjidKu juga responsif!",
  },
  {
    name: "Bpk. Darmawan Santoso",
    role: "Pengurus Masjid Nurul Iman, Yogyakarta",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80",
    rating: 5,
    text: "Fitur donasi QR code sangat memudahkan jamaah berinfak. Notifikasi real-time membuat bendahara langsung tahu setiap donasi masuk. Alhamdulillah, sangat bermanfaat!",
  },
  {
    name: "KH. Muhammad Yusuf",
    role: "Ketua MUI Kab. Makassar, Sulawesi Selatan",
    avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100&q=80",
    rating: 5,
    text: "Platform ini adalah solusi terbaik untuk masjid-masjid di Indonesia. Fitur absensi dan manajemen jamaah membantu kami mengetahui kondisi spiritual umat secara real-time.",
  },
  {
    name: "Ibu Fatimah Zahrah",
    role: "Koordinator Muslimah Masjid Ar-Rahman, Palembang",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b25af9f2?w=100&q=80",
    rating: 5,
    text: "Sebagai koordinator muslimah, saya sangat terbantu dengan fitur pengumuman dan notifikasi. Program kajian ibu-ibu kini lebih terorganisir dan jamaah selalu mendapat info tepat waktu.",
  },
  {
    name: "Bpk. Irfan Hakim Nasution",
    role: "Direktur Yayasan Masjid Al-Falah, Aceh",
    avatar: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=100&q=80",
    rating: 5,
    text: "MasjidKu Smart telah kami gunakan di 12 masjid binaan yayasan kami. Transparansi keuangan meningkat drastis dan kepercayaan donatur pun bertambah. Sangat merekomendasikan!",
  },
];

const APP_SCREENSHOTS = [
  { url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80", label: "Dashboard Utama" },
  { url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80", label: "Laporan Keuangan" },
  { url: "https://images.unsplash.com/photo-1434030216411-0b793f4b6f4a?w=800&q=80", label: "Jadwal Kegiatan" },
  { url: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&q=80", label: "Info Publik TV" },
];

function HeroSlider({ slides, waUrl, heroImage }) {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timer = useRef(null);
  const displaySlides = heroImage
    ? [{ image: heroImage, title: slides[0].title, sub: slides[0].sub }, ...slides.slice(1)]
    : slides;

  useEffect(() => {
    if (playing) {
      // Slide video lebih lama (12 detik), gambar 5 detik
      const delay = displaySlides[current]?.videoId ? 12000 : 5000;
      timer.current = setTimeout(() => setCurrent(c => (c + 1) % displaySlides.length), delay);
    }
    return () => clearTimeout(timer.current);
  }, [playing, current, displaySlides.length]);

  function go(idx) { setCurrent(idx); setPlaying(false); }
  function prev() { go((current - 1 + displaySlides.length) % displaySlides.length); }
  function next() { setCurrent(c => (c + 1) % displaySlides.length); setPlaying(true); }

  const s = displaySlides[current];

  return (
    <div className="relative h-[90vh] min-h-[600px] overflow-hidden bg-black">
      {/* Background layers — semua slide dirender, yg aktif opacity-100 */}
      {displaySlides.map((sl, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          {sl.videoId ? (
            // Slide Video
            <>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${sl.videoId}?autoplay=${i === current ? 1 : 0}&mute=1&loop=1&playlist=${sl.videoId}&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1&iv_load_policy=3&cc_load_policy=0`}
                className="absolute inset-0 w-full h-full scale-110 pointer-events-none"
                allow="autoplay; encrypted-media"
                title={sl.title}
                style={{ border: 'none' }}
              />
              {/* thumb fallback (cover jika video belum dimuat) */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
                style={{ backgroundImage: `url(${sl.thumb})`, opacity: 0.2 }}
              />
            </>
          ) : (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${sl.image || sl.thumb})` }}
            />
          )}
        </div>
      ))}

      {/* Gradient overlay — lebih tebal di area konten */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80 z-10" />

      {/* Badge tipe slide (video/gambar) */}
      {s.tag && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20">
          <span className="bg-black/50 backdrop-blur border border-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
            {s.tag}
          </span>
        </div>
      )}

      {/* Konten teks slide */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-white text-center px-6">
        <div className="mb-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 text-sm">
          <Sparkles className="h-3.5 w-3.5 text-yellow-300" /> Platform Digital Masjid #1 Indonesia
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight max-w-3xl drop-shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
          {s.title}
        </h1>
        <p className="text-lg md:text-xl text-white/85 max-w-2xl mb-8 leading-relaxed">
          {s.sub}
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <a href={waUrl} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 text-base h-12 shadow-xl">
              Mulai Gratis Sekarang
            </Button>
          </a>
          <a href="#galeri">
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 text-base h-12 gap-2">
              <Play className="h-4 w-4" /> Lihat Galeri & Video
            </Button>
          </a>
        </div>
      </div>

      {/* Nav arrows */}
      <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition border border-white/20">
        <ChevronLeft className="h-6 w-6 text-white" />
      </button>
      <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition border border-white/20">
        <ChevronRight className="h-6 w-6 text-white" />
      </button>

      {/* Thumbnail strip di bawah */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2 items-center">
        {displaySlides.map((sl, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={`relative overflow-hidden rounded-lg transition-all duration-300 border-2 ${
              i === current
                ? 'w-16 h-10 border-white opacity-100'
                : 'w-10 h-7 border-white/40 opacity-60 hover:opacity-80'
            }`}
          >
            <img
              src={sl.thumb || sl.image}
              alt=""
              className="w-full h-full object-cover"
            />
            {sl.videoId && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Play className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Play/Pause */}
      <button
        onClick={() => setPlaying(p => !p)}
        className="absolute bottom-4 right-6 z-30 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition border border-white/20"
      >
        {playing ? <Pause className="h-3 w-3 text-white" /> : <Play className="h-3 w-3 text-white" />}
      </button>
    </div>
  );
}

function StatsBar() {
  return (
    <div className="bg-primary text-primary-foreground py-6">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 px-6 text-center">
        {[
          { val: "500+", label: "Masjid Terdaftar" },
          { val: "50K+", label: "Jamaah Terkelola" },
          { val: "Rp 2M+", label: "Donasi Dikelola" },
          { val: "99%", label: "Kepuasan Pengguna" },
        ].map(s => (
          <div key={s.label}>
            <div className="text-3xl font-bold">{s.val}</div>
            <div className="text-sm opacity-80 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// GaleriSection: data dari masjid-masjid aktif
function GaleriSection({ mosques }) {
  const [activeFilter, setActiveFilter] = useState("Semua");

  // Kumpulkan semua foto dari semua masjid
  const allPhotos = [];
  mosques.forEach(m => {
    // Dari tv_slideshow_urls (bisa multiple)
    if (m.tv_slideshow_urls) {
      m.tv_slideshow_urls.split(',').map(u => u.trim()).filter(Boolean).forEach((url, idx) => {
        allPhotos.push({
          url,
          mosqueName: m.name,
          mosqueCity: m.city || '',
          mosqueId: m.id,
          label: idx === 0 ? `Kegiatan ${m.name}` : `Galeri ${m.name} (${idx + 1})`,
          tag: m.city || 'Masjid',
        });
      });
    }
    // Dari cover_image_url sebagai fallback
    if (!m.tv_slideshow_urls && m.cover_image_url) {
      allPhotos.push({
        url: m.cover_image_url,
        mosqueName: m.name,
        mosqueCity: m.city || '',
        mosqueId: m.id,
        label: `Foto ${m.name}`,
        tag: m.city || 'Masjid',
      });
    }
  });

  const cities = ["Semua", ...new Set(allPhotos.map(p => p.tag).filter(Boolean))];
  const filtered = activeFilter === "Semua" ? allPhotos : allPhotos.filter(p => p.tag === activeFilter);

  if (allPhotos.length === 0) return null;

  return (
    <section id="galeri" className="py-20 px-6 bg-gradient-to-b from-muted/10 to-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <span>🖼️</span> Galeri Masjid Berlangganan
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Momen Nyata dari Masjid-Masjid Indonesia</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Foto dan dokumentasi kegiatan nyata dari {mosques.length} masjid yang menggunakan MasjidKu Smart
          </p>
        </div>

        {/* Filter by city/area */}
        {cities.length > 2 && (
          <div className="flex gap-2 flex-wrap justify-center mb-8">
            {cities.slice(0, 10).map(t => (
              <button key={t} onClick={() => setActiveFilter(t)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeFilter === t
                    ? "bg-primary text-white shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                }`}>
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Gallery grid dengan keterangan masjid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {filtered.slice(0, 12).map((item, i) => (
            <div key={i}
              className={`relative group overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer ${
                i % 7 === 0 ? 'md:col-span-2 md:row-span-2' : ''
              }`}>
              <img
                src={item.url}
                alt={item.label}
                className={`w-full object-cover group-hover:scale-110 transition-transform duration-500 ${
                  i % 7 === 0 ? 'h-60 md:h-full' : 'h-36 md:h-44'
                }`}
                onError={e => { e.target.src = `https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&q=80`; }}
              />
              {/* Overlay selalu tampil di bawah, lebih tebal saat hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              {/* Info masjid — selalu tampil di bawah */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-xs font-bold leading-tight">{item.mosqueName}</p>
                {item.mosqueCity && <p className="text-white/60 text-xs mt-0.5">📍 {item.mosqueCity}</p>}
                {/* Label kegiatan hanya muncul saat hover */}
                <p className="text-white/80 text-xs mt-1 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">{item.label}</p>
              </div>
              {/* Badge link profil */}
              <a
                href={`/masjid/${item.mosqueId}`}
                className="absolute top-2 right-2 bg-black/50 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary"
              >
                Lihat Masjid →
              </a>
            </div>
          ))}
        </div>

        {filtered.length > 12 && (
          <p className="text-center text-muted-foreground text-sm mt-6">+{filtered.length - 12} foto lainnya dari masjid-masjid Indonesia</p>
        )}
      </div>
    </section>
  );
}


// VideoHighlightsSection: data video dari masjid aktif
function VideoHighlightsSection({ mosques }) {
  const [activeVideo, setActiveVideo] = useState(0);

  // Kumpulkan semua video dari masjid
  const allVideos = [];
  mosques.forEach(m => {
    const ytUrl = m.tv_video_url || m.youtube;
    if (ytUrl) {
      const ytId = ytUrl.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)?.[1];
      if (ytId) {
        allVideos.push({
          videoId: ytId,
          mosqueName: m.name,
          mosqueCity: m.city || '',
          mosqueId: m.id,
          desc: `Video resmi dari ${m.name}${m.city ? `, ${m.city}` : ''}`,
        });
      }
    }
  });

  if (allVideos.length === 0) return null;

  const current = allVideos[Math.min(activeVideo, allVideos.length - 1)];

  return (
    <section className="py-20 px-6 bg-gradient-to-br from-slate-900 to-emerald-950 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white rounded-full px-4 py-1.5 text-sm font-medium mb-4 border border-white/20">
            <Play className="h-3.5 w-3.5 text-emerald-400" /> Video Dari Masjid Berlangganan
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Video Kegiatan Masjid Indonesia</h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Video kajian, khutbah, dan kegiatan nyata dari masjid-masjid yang menggunakan MasjidKu Smart
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main video player */}
          <div className="lg:col-span-2">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-video bg-black border border-white/10">
              <iframe
                key={activeVideo}
                src={`https://www.youtube-nocookie.com/embed/${current.videoId}?autoplay=1&mute=1&rel=0&modestbranding=1&disablekb=1&iv_load_policy=3&cc_load_policy=0`}
                className="w-full h-full"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title={current.mosqueName}
              />
            </div>
            {/* Keterangan masjid */}
            <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <img src="/favicon.png" className="w-6 h-6 object-contain" />
              </div>
              <div>
                <h3 className="font-bold text-base">{current.mosqueName}</h3>
                <p className="text-white/50 text-sm">{current.desc}</p>
              </div>
              <a href={`/masjid/${current.mosqueId}`} className="ml-auto text-xs text-emerald-400 hover:text-emerald-300 whitespace-nowrap">
                Lihat Profil →
              </a>
            </div>
          </div>

          {/* Playlist */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-1">Masjid Lainnya ({allVideos.length})</p>
            {allVideos.map((v, i) => (
              <button key={i} onClick={() => setActiveVideo(i)}
                className={`flex gap-3 items-center p-3 rounded-xl text-left transition-all ${
                  activeVideo === i
                    ? "bg-emerald-500/20 border border-emerald-500/40"
                    : "bg-white/5 border border-white/10 hover:bg-white/10"
                }`}>
                <div className="relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-black">
                  <img
                    src={`https://img.youtube.com/vi/${v.videoId}/mqdefault.jpg`}
                    alt={v.mosqueName}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 flex items-center justify-center ${activeVideo === i ? 'bg-emerald-500/30' : 'bg-black/40'}`}>
                    <Play className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{v.mosqueName}</p>
                  <p className="text-xs text-white/50 mt-0.5">{v.mosqueCity}</p>
                </div>
              </button>
            ))}

            <div className="mt-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <p className="text-xs text-emerald-300 font-semibold mb-1">💡 Ingin video masjid Anda tampil di sini?</p>
              <p className="text-xs text-white/50">Daftarkan masjid Anda dan tambahkan link YouTube di menu Pengaturan → Layar TV.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AktivitasSection() {
  return (
    <section className="py-20 px-6 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <FileText className="h-3.5 w-3.5" /> Dokumen & Aktivitas
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Semua Dokumen Masjid di Satu Tempat</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Kelola, arsipkan, dan tampilkan seluruh dokumentasi kegiatan dan administrasi masjid secara digital
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOSQUE_ACTIVITIES.map((act, i) => (
            <div key={i}
              className="group bg-card border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              <div className={`bg-gradient-to-br ${act.color} p-6 text-white`}>
                <span className="text-4xl">{act.emoji}</span>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-base mb-2 group-hover:text-primary transition-colors">{act.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{act.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA kecil */}
        <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">Mulai Digitalisasi Masjid Anda Sekarang</h3>
          <p className="text-muted-foreground mb-5">Daftar gratis dan nikmati semua fitur pengelolaan masjid digital selama 30 hari</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="#harga">
              <Button className="px-8 font-semibold">Coba Gratis 30 Hari</Button>
            </a>
            <a href="#galeri">
              <Button variant="outline" className="px-8">Lihat Galeri Masjid</Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function VideoSection() {
  return (
    <section id="video" className="py-20 px-6 bg-gradient-to-b from-muted/20 to-background">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4">
          <Play className="h-3.5 w-3.5" /> Demo Aplikasi
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Lihat MasjidKu Beraksi</h2>
        <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
          Saksikan bagaimana MasjidKu memudahkan pengelolaan masjid dari keuangan hingga informasi publik
        </p>

        <div className="relative rounded-2xl overflow-hidden shadow-2xl border bg-black aspect-video">
          <iframe
            className="w-full h-full"

            src="https://www.youtube-nocookie.com/embed/xkuAToGvtW8?rel=0&modestbranding=1&disablekb=1&iv_load_policy=3&cc_load_policy=0"
            title="Demo MasjidKu"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* App screenshots slider */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {APP_SCREENSHOTS.map(s => (
            <div key={s.label} className="rounded-xl overflow-hidden border shadow-md hover:shadow-xl transition-shadow group">
              <div className="overflow-hidden">
                <img src={s.url} alt={s.label} className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="bg-card px-3 py-2">
                <p className="text-xs font-medium text-center">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const [current, setCurrent] = useState(0);
  const perPage = 3;
  const pages = Math.ceil(TESTIMONIALS.length / perPage);
  const visible = TESTIMONIALS.slice(current * perPage, current * perPage + perPage);

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-primary/5 to-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" /> Testimoni Pengguna
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Dipercaya Jutaan Masjid di Seluruh Negara</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Bergabunglah dengan jutaan masjid di seluruh Indonesia yang sudah merasakan manfaat MasjidKu Smart
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {visible.map((t, i) => (
            <div key={i} className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="absolute top-4 right-4 text-primary/20">
                <MessageSquare className="h-8 w-8" />
              </div>
              <div className="flex gap-1 mb-3">
                {Array(t.rating).fill(0).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {pages > 1 && (
          <div className="flex justify-center gap-2">
            {Array(pages).fill(0).map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? "bg-primary w-8" : "bg-muted-foreground/30"}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── AI CHAT WIDGET ─────────────────────────────────────────────────────────
const AI_PRESET_QA = [
  { q: "Apa itu MasjidKu Smart?", a: "MasjidKu Smart adalah platform digital terlengkap untuk manajemen masjid modern. Kami menyediakan fitur keuangan, jadwal shalat, data jamaah, inventory aset, donasi online, pengumuman, analitik AI, dan layar TV digital — semua dalam satu platform terintegrasi." },
  { q: "Berapa harga berlangganan?", a: "Kami menawarkan beberapa paket berlangganan yang terjangkau. Tersedia paket Gratis (30 hari trial), paket Bulanan, dan paket Tahunan dengan fitur lebih lengkap. Silakan scroll ke bagian Harga di halaman ini untuk melihat detail lengkap." },
  { q: "Bagaimana cara daftar masjid?", a: "Cara daftar sangat mudah! Cukup isi nama masjid dan email di formulir pendaftaran bagian Harga, pilih paket, lalu klik Bayar. Tim kami akan segera menghubungi Anda untuk aktivasi akun. Proses aktivasi kurang dari 24 jam!" },
  { q: "Apakah ada demo gratis?", a: "Ya! Kami menyediakan trial gratis 30 hari tanpa syarat. Anda bisa mencoba semua fitur premium MasjidKu Smart sebelum berlangganan. Daftar sekarang dan nikmati digitalisasi masjid Anda!" },
  { q: "Fitur apa saja yang tersedia?", a: "MasjidKu Smart memiliki 12+ fitur unggulan: Jadwal Shalat, Manajemen Keuangan, Data Jamaah, Inventory Aset, Halaman Publik, Digital Signage TV, Pengumuman & Notifikasi, AI Analytics, Donasi & Zakat, Laporan PDF, Manajemen Kegiatan, dan Absensi QR Code." },
  { q: "Bagaimana cara menghubungi support?", a: "Anda bisa menghubungi tim support kami melalui: WhatsApp (respon cepat), Email, atau form kontak di halaman ini. Tim kami siap membantu 7 hari seminggu dari pukul 08.00 - 20.00 WIB." },
];

function AIChatWidget({ waUrl, settings }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Assalamu\'alaikum! 👋 Saya asisten AI MasjidKu. Bagaimana saya bisa membantu Anda hari ini?' }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [showPreset, setShowPreset] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  function findAnswer(question) {
    const q = question.toLowerCase();
    for (const item of AI_PRESET_QA) {
      const keywords = item.q.toLowerCase().split(' ').filter(w => w.length > 3);
      if (keywords.some(kw => q.includes(kw))) return item.a;
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
      text: answer || `Terima kasih atas pertanyaan Anda tentang "${userMsg}". Untuk informasi lebih lanjut, silakan hubungi tim kami via WhatsApp atau scroll halaman ini untuk menemukan jawabannya. Kami siap membantu! 🕌`
    }]);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform"
        aria-label="Buka AI Chat"
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border overflow-hidden flex flex-col" style={{ maxHeight: '520px' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-emerald-600 px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">AI Assistant MasjidKu</p>
              <p className="text-white/70 text-xs flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-300 rounded-full" />Online sekarang</p>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto text-white/70 hover:text-white">
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.from === 'bot' && (
                  <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  m.from === 'user'
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-white border text-gray-700 rounded-bl-sm shadow-sm'
                }`}>
                  {m.text}
                </div>
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

            {/* Preset questions */}
            {showPreset && messages.length <= 1 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 text-center">Pilih pertanyaan atau ketik sendiri</p>
                {AI_PRESET_QA.slice(0, 4).map((item, i) => (
                  <button key={i} onClick={() => sendMessage(item.q)}
                    className="w-full text-left text-xs px-3 py-2 bg-primary/5 border border-primary/20 rounded-xl hover:bg-primary/10 text-gray-700 transition-colors">
                    {item.q}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                placeholder="Ketik pertanyaan..."
                className="flex-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button onClick={() => sendMessage(input)}
                className="w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary/90 flex-shrink-0">
                <Send className="h-4 w-4" />
              </button>
            </div>
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium">
              <Phone className="h-3 w-3" /> Chat langsung via WhatsApp
            </a>
          </div>
        </div>
      )}
    </>
  );
}

export default function Landing() {
  const [settings, setSettings] = useState(null);
  const [plans, setPlans] = useState([]);
  const [mosques, setMosques] = useState([]);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({ name: "", email: "", password: "", showPassword: false });
  const [selectedPlan, setSelectedPlan] = useState("yearly");

  useEffect(() => {
    smartApi.entities.AppSettings.list().then(data => { if (data.length > 0) setSettings(data[0]); });
    smartApi.entities.PlanFeatures.list().then(data => {
      const parsed = (data || []).map(p => ({
        ...p,
        features: (() => {
          if (Array.isArray(p.features)) return p.features;
          try { return JSON.parse(p.features || '[]'); }
          catch (_) { return p.features ? String(p.features).split(',').map(f => f.trim()) : []; }
        })()
      }));
      setPlans(parsed);
    });
    // Fetch masjid aktif untuk galeri & video
    smartApi.entities.Mosque.filter({ status: 'active' })
      .then(data => setMosques(data || []))
      .catch(() => smartApi.entities.Mosque.list().then(data => setMosques((data || []).filter(m => m.status !== 'inactive'))));
  }, []);

  const appName = settings?.app_name || "MasjidKu";
  const tagline = settings?.app_tagline || "Platform Digital Terlengkap untuk Manajemen Masjid";
  const waNumber = settings?.whatsapp_number || "6281234567890";
  const waUrl = `https://wa.me/${waNumber}?text=Halo, saya tertarik berlangganan ${appName}`;
  
  const selectedPlanData = plans.find(p => p.plan === selectedPlan);
  const planPrice = selectedPlanData?.price ?? 0;
  const priceDisplay = selectedPlanData 
    ? (planPrice === 0 ? "Gratis" : `Rp ${Number(planPrice).toLocaleString("id-ID")}`)
    : "Hubungi kami";

  async function handlePaymentClick() {
    if (!registrationForm.name.trim()) { toast.error("Nama masjid harus diisi"); return; }
    if (!registrationForm.email.trim()) { toast.error("Email harus diisi"); return; }
    if (!registrationForm.password.trim()) { toast.error("Password harus diisi"); return; }
    if (registrationForm.password.length < 6) { toast.error("Password minimal 6 karakter"); return; }

    setProcessingPayment(true);
    try {
      const slug = registrationForm.name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").substring(0, 50) + "-" + Date.now().toString(36);

      // 1. Buat data masjid
      const mosque = await smartApi.entities.Mosque.create({
        name: registrationForm.name,
        address: "-", city: "-",
        email: registrationForm.email,
        slug,
        subscription_plan: selectedPlan,
        subscription_status: planPrice === 0 ? "active" : "pending",
        subscription_start: new Date().toISOString(),
        subscription_end: new Date(Date.now() + (planPrice === 0 ? 30 : (selectedPlan === "yearly" ? 365 : 30)) * 24 * 60 * 60 * 1000).toISOString(),
        status: "active"
      });

      // 2. Daftarkan user sebagai Admin Masjid
      const { apiClient } = await import("@/api/apiClient");
      const regRes = await apiClient.post("/auth/register-mosque-admin", {
        full_name: registrationForm.name + " (Admin)",
        email: registrationForm.email,
        password: registrationForm.password,
        mosque_id: mosque.id
      });

      // 3. Simpan token login otomatis
      if (regRes.data?.token) {
        localStorage.setItem("token", regRes.data.token);
        localStorage.setItem("user", JSON.stringify(regRes.data.user));
      }

      if (planPrice === 0) {
        toast.success(`✅ Masjid ${registrationForm.name} berhasil terdaftar! Anda sudah login sebagai Admin.`);
        setRegistrationForm({ name: "", email: "", password: "", showPassword: false });
        setTimeout(() => { window.location.href = "/dashboard"; }, 2000);
      } else {
        const waMsg = `Halo, saya ingin mendaftar MasjidKu Smart.%0ANama Masjid: ${encodeURIComponent(registrationForm.name)}%0AEmail: ${encodeURIComponent(registrationForm.email)}%0APaket: ${selectedPlan} (${priceDisplay})%0AID Masjid: ${mosque.id}%0AMohon konfirmasi pembayaran.`;
        toast.success("Masjid terdaftar! Silakan konfirmasi pembayaran via WhatsApp.");
        setRegistrationForm({ name: "", email: "", password: "", showPassword: false });
        setTimeout(() => { window.open(`https://wa.me/${waNumber}?text=${waMsg}`, "_blank"); }, 1000);
      }
    } catch (err) {
      toast.error("Gagal: " + (err.response?.data?.error || err.message));
    } finally {
      setProcessingPayment(false);
    }
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Kontak bar tipis di atas navbar */}
      <div className="hidden md:block bg-primary text-primary-foreground text-xs py-1.5">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-5">
            {settings?.contact_phone && (
              <a href={`tel:${settings.contact_phone}`} className="flex items-center gap-1.5 hover:text-white/80 transition-colors">
                <Phone className="h-3 w-3" /> {settings.contact_phone}
              </a>
            )}
            {settings?.contact_email && (
              <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-1.5 hover:text-white/80 transition-colors">
                <Mail className="h-3 w-3" /> {settings.contact_email}
              </a>
            )}
            {!settings?.contact_phone && !settings?.contact_email && (
              <>
                <a href="tel:+6281234567890" className="flex items-center gap-1.5 hover:text-white/80 transition-colors">
                  <Phone className="h-3 w-3" /> +62 812-3456-7890
                </a>
                <a href="mailto:halo@masjidkusmart.id" className="flex items-center gap-1.5 hover:text-white/80 transition-colors">
                  <Mail className="h-3 w-3" /> halo@masjidkusmart.id
                </a>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Indonesia</span>
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white/80 transition-colors">
              💬 WhatsApp Support
            </a>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {settings?.logo_url
              ? <img src={settings.logo_url} alt="Logo" className="h-9 rounded-lg" />
              : <img src="/favicon.png" alt="MasjidKu Smart" className="h-9 rounded-lg" />}
            <span className="font-bold text-lg text-primary">{appName}</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#fitur" className="hover:text-primary transition-colors">Fitur</a>
            <a href="#galeri" className="hover:text-primary transition-colors">Galeri</a>
            <a href="#video" className="hover:text-primary transition-colors">Video</a>
            <a href="#testimoni" className="hover:text-primary transition-colors">Testimoni</a>
            <a href="#harga" className="hover:text-primary transition-colors">Harga</a>
            <a href="#kontak" className="hover:text-primary transition-colors">Kontak</a>
            <Link to="/cari-masjid" className="flex items-center gap-1.5 hover:text-primary transition-colors text-emerald-600 font-semibold group">
              <img src="/favicon.png" className="w-5 h-5 object-contain group-hover:scale-110 transition-transform" />
              Cari Masjid
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="font-semibold text-slate-600 hover:text-primary">
                Masuk
              </Button>
            </Link>
            <Link to="/admin" className="hidden lg:block">
              <Button variant="outline" size="sm" className="font-semibold text-primary border-primary hover:bg-primary/5">
                Superadmin
              </Button>
            </Link>
            <a href="#harga">
              <Button size="sm" className="font-semibold px-4 shadow-md">Mulai Gratis</Button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Slider */}
      <div className="pt-[60px]">
        <HeroSlider slides={HERO_SLIDES} waUrl={waUrl} heroImage={settings?.hero_image_url} />
      </div>

      {/* Stats */}
      <StatsBar />

      {/* Features */}
      <section id="fitur" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <Shield className="h-3.5 w-3.5" /> Fitur Lengkap
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Semua yang Dibutuhkan Masjid Anda</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Dari keuangan hingga informasi publik, MasjidKu hadir sebagai solusi satu platform
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-card rounded-2xl border p-6 hover:shadow-lg transition-all hover:-translate-y-1 group">
              <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center mb-4`}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Galeri Foto Kegiatan Masjid - dari data masjid aktif */}
      <GaleriSection mosques={mosques} />

      {/* Video Highlights - dari data masjid aktif */}
      <VideoHighlightsSection mosques={mosques} />

      {/* Dokumen & Aktivitas Masjid */}
      <AktivitasSection />

      {/* Video Demo App & Screenshots */}
      <VideoSection />

      {/* Testimonials */}
      <section id="testimoni">
        <TestimonialsSection />
      </section>

      {/* Pricing */}
      <section id="harga" className="py-20 px-6 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <TrendingUp className="h-3.5 w-3.5" /> Investasi Terbaik
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Pilih Paket Anda</h2>
            <p className="text-muted-foreground mb-8">Akses seluruh fitur premium dengan harga yang bersahabat</p>
            
            {plans.length > 0 && (
              <div className="flex gap-2 justify-center">
                {plans.map(plan => (
                  <button
                    key={plan.plan}
                    onClick={() => setSelectedPlan(plan.plan)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                      selectedPlan === plan.plan
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {plan.plan}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card rounded-3xl border-2 border-primary p-8 shadow-2xl relative overflow-hidden max-w-lg mx-auto">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-10 -mt-10" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-accent/10 rounded-full -ml-6 -mb-6" />
            <div className="relative">
              <div className="bg-primary/10 text-primary text-xs font-bold rounded-full px-3 py-1 inline-block mb-4 capitalize">{selectedPlan}</div>
              <div className="text-5xl font-bold text-primary mb-1">{priceDisplay}</div>
              <p className="text-muted-foreground text-sm mb-2">per masjid</p>
              {selectedPlanData?.description && <p className="text-muted-foreground text-xs mb-6 italic">{selectedPlanData.description}</p>}
              <ul className="space-y-3 text-left mb-8">
                {(selectedPlanData?.features || []).map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              
              {/* Payment Form */}
              <div className="space-y-3 mb-6 p-4 bg-primary/5 rounded-xl">
                <p className="text-xs font-bold text-primary text-left mb-2">📋 Data Pendaftaran</p>
                <div>
                  <label className="block text-xs font-semibold text-left mb-1">Nama Masjid / Mushola</label>
                  <input 
                    type="text" 
                    value={registrationForm.name}
                    onChange={e => setRegistrationForm({...registrationForm, name: e.target.value})}
                    placeholder="Masjid Al-Ikhlas"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={processingPayment}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-left mb-1">Email Admin</label>
                  <input 
                    type="email" 
                    value={registrationForm.email}
                    onChange={e => setRegistrationForm({...registrationForm, email: e.target.value})}
                    placeholder="admin@masjid.com"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={processingPayment}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-left mb-1">Password <span className="text-muted-foreground font-normal">(min. 6 karakter)</span></label>
                  <div className="relative">
                    <input 
                      type={registrationForm.showPassword ? "text" : "password"}
                      value={registrationForm.password}
                      onChange={e => setRegistrationForm({...registrationForm, password: e.target.value})}
                      placeholder="Buat password yang kuat"
                      className="w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled={processingPayment}
                    />
                    <button type="button" onClick={() => setRegistrationForm({...registrationForm, showPassword: !registrationForm.showPassword})}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs">
                      {registrationForm.showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground text-left">🔒 Email & password ini digunakan untuk login ke Dashboard Admin Masjid Anda.</p>
              </div>
              
              <Button 
                onClick={handlePaymentClick}
                disabled={processingPayment}
                className="w-full" 
                size="lg"
              >
                {processingPayment ? "Memproses..." : "Bayar Sekarang 💳"}
              </Button>
              <p className="text-xs text-muted-foreground mt-3">✅ Daftar & Bayar Langsung • Akses Instan</p>
            </div>
          </div>
        </div>
      </section>

      {/* Kontak Section */}
      <section id="kontak" className="py-20 px-6 bg-gradient-to-b from-muted/10 to-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <Phone className="h-3.5 w-3.5" /> Hubungi Kami
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Ada Pertanyaan? Kami Siap Membantu</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Tim support kami siap melayani Anda 7 hari seminggu untuk memastikan masjid Anda berhasil go digital
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* WhatsApp */}
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              className="group bg-card border rounded-2xl p-6 text-center hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer hover:border-green-500/50">
              <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-100 transition-colors">
                <MessageSquare className="h-7 w-7" />
              </div>
              <h3 className="font-bold mb-1">WhatsApp</h3>
              <p className="text-sm text-muted-foreground mb-3">Respon tercepat via WhatsApp. Kami biasanya membalas dalam 5 menit!</p>
              <span className="text-green-600 text-sm font-semibold group-hover:underline">
                {settings?.whatsapp_number ? `+${settings.whatsapp_number}` : '+62 812-3456-7890'}
              </span>
            </a>

            {/* Email */}
            <a href={`mailto:${settings?.contact_email || 'halo@masjidkusmart.id'}`}
              className="group bg-card border rounded-2xl p-6 text-center hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer hover:border-blue-500/50">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 transition-colors">
                <Mail className="h-7 w-7" />
              </div>
              <h3 className="font-bold mb-1">Email</h3>
              <p className="text-sm text-muted-foreground mb-3">Kirim pertanyaan detail via email dan kami akan membalas dalam 1x24 jam kerja.</p>
              <span className="text-blue-600 text-sm font-semibold group-hover:underline">
                {settings?.contact_email || 'halo@masjidkusmart.id'}
              </span>
            </a>

            {/* Telepon */}
            <a href={`tel:${settings?.contact_phone || '+6281234567890'}`}
              className="group bg-card border rounded-2xl p-6 text-center hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer hover:border-purple-500/50">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-100 transition-colors">
                <Phone className="h-7 w-7" />
              </div>
              <h3 className="font-bold mb-1">Telepon</h3>
              <p className="text-sm text-muted-foreground mb-3">Hubungi langsung tim kami di jam operasional 08.00 – 20.00 WIB setiap hari.</p>
              <span className="text-purple-600 text-sm font-semibold group-hover:underline">
                {settings?.contact_phone || '+62 812-3456-7890'}
              </span>
            </a>
          </div>

          {/* Office info */}
          <div className="bg-gradient-to-br from-primary/5 to-emerald-50 border border-primary/20 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Kantor MasjidKu Smart</h3>
              <p className="text-muted-foreground text-sm">
                {settings?.address || 'Jl. Jendral Sudirman Perumahan Bukit Cilegon Asri Blok DB no. 19 Kel. Bagendung Kec. Cilegon Kota Cilegon Banten, Indonesia 10110'}
              </p>
              <p className="text-sm mt-2 text-primary font-medium">🕐 Jam Operasional: Senin – Minggu, 08.00 – 20.00 WIB</p>
            </div>
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="md:ml-auto flex-shrink-0">
              <Button className="px-8 shadow-lg">Konsultasi Gratis</Button>
            </a>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 px-6 bg-primary text-primary-foreground text-center">
        <div className="max-w-2xl mx-auto">
          <Wifi className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl font-bold mb-3">Siap Digitalisasi Masjid Anda?</h2>
          <p className="text-lg opacity-85 mb-6">Bergabunglah dengan jutaan masjid yang sudah menggunakan MasjidKu Smart</p>
          <a href={waUrl} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold px-10 h-12 text-base">
              Daftar Sekarang — Gratis!
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-3">
                <img src="/favicon.png" alt="MasjidKu Smart" className="h-12 rounded-xl" />
                <span className="font-bold text-xl">{appName}</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">Platform digital terlengkap untuk manajemen masjid modern. Dipercaya jutaan masjid di seluruh Indonesia.</p>
              <div className="flex gap-3">
                <a href={waUrl} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-medium transition-colors">WhatsApp</a>
                <a href={`mailto:${settings?.contact_email || 'halo@masjidkusmart.id'}`}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium transition-colors">Email</a>
              </div>
            </div>
            {/* Links */}
            <div>
              <p className="font-semibold text-sm mb-3 text-slate-300">Platform</p>
              <div className="space-y-2 text-sm text-slate-400">
                <a href="#fitur" className="block hover:text-white transition-colors">Fitur Lengkap</a>
                <a href="#harga" className="block hover:text-white transition-colors">Harga & Paket</a>
                <a href="#galeri" className="block hover:text-white transition-colors">Galeri Masjid</a>
                <a href="#testimoni" className="block hover:text-white transition-colors">Testimoni</a>
              </div>
            </div>
            {/* Contact */}
            <div>
              <p className="font-semibold text-sm mb-3 text-slate-300">Kontak</p>
              <div className="space-y-2 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  {settings?.contact_phone || '+62 812-3456-7890'}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  {settings?.contact_email || 'halo@masjidkusmart.id'}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  Indonesia
                </div>
              </div>
            </div>
            {/* Mobile App */}
            <div>
              <p className="font-semibold text-sm mb-3 text-slate-300">Aplikasi Mobile <span className="bg-emerald-500 text-white px-1.5 py-0.5 rounded text-[10px] ml-1">BARU</span></p>
              <div className="bg-white p-2 text-black rounded-lg inline-block mb-2 shadow-lg">
                <QRCode value="https://ms.dstechsmart.com" size={90} />
              </div>
              <p className="text-xs text-slate-400 leading-snug">Scan dengan kamera HP Anda untuk <b>Menginstal Aplikasi MasjidKu</b> secara otomatis.</p>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-6 flex flex-col md:flex-row items-center justify-between gap-2 text-slate-500 text-xs">
            <p>© {new Date().getFullYear()} {appName}. All rights reserved.</p>
            <p>Dibuat dengan ❤️ untuk kemajuan masjid Indonesia</p>
          </div>
        </div>
      </footer>

      {/* AI Chat Widget */}
      <AIChatWidget waUrl={waUrl} settings={settings} />
    </div>
  );
}
