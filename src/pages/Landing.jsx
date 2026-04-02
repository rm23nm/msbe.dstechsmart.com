import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { handleSnapPayment, loadMidtransSnap } from "@/lib/midtransClient";
import { toast } from "sonner";
import {
  CheckCircle, Star, Users, Calendar, DollarSign, Package, Globe, Sparkles, Monitor, ChevronLeft, ChevronRight,
  Play, Pause, MessageSquare, TrendingUp, Shield, Wifi, Megaphone,
  BarChart3, Gift, FileText, CheckCircle2
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

const HERO_SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1585036156171-384164a8c675?w=1600&q=80",
    title: "Kelola Masjid Lebih Cerdas",
    sub: "Platform digital terlengkap untuk administrasi, keuangan, dan informasi masjid modern",
  },
  {
    image: "https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1600&q=80",
    title: "Transparansi Keuangan Masjid",
    sub: "Laporan keuangan otomatis, donasi online, dan audit trail lengkap untuk kepercayaan jamaah",
  },
  {
    image: "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=1600&q=80",
    title: "Jadwal & Kegiatan Terpadu",
    sub: "Atur jadwal shalat, kegiatan kajian, dan petugas Jumat dalam satu platform terintegrasi",
  },
  {
    image: "https://images.unsplash.com/photo-1466442929976-97f336a657be?w=1600&q=80",
    title: "Informasi Real-time di Layar TV",
    sub: "Tampilkan jadwal, pengumuman, dan berita masjid langsung di layar digital secara otomatis",
  },
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
  const displaySlides = heroImage ? [{ image: heroImage, title: slides[0].title, sub: slides[0].sub }, ...slides.slice(1)] : slides;

  useEffect(() => {
    if (playing) {
      timer.current = setInterval(() => setCurrent(c => (c + 1) % displaySlides.length), 5000);
    }
    return () => clearInterval(timer.current);
  }, [playing, displaySlides.length]);

  function go(idx) { setCurrent(idx); setPlaying(false); }
  function prev() { go((current - 1 + displaySlides.length) % displaySlides.length); }
  function next() { go((current + 1) % displaySlides.length); }

  const s = displaySlides[current];

  return (
    <div className="relative h-[90vh] min-h-[600px] overflow-hidden">
      {displaySlides.map((sl, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? "opacity-100" : "opacity-0"}`}
          style={{ backgroundImage: `url(${sl.image})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
      ))}
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-6">
        <div className="mb-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 text-sm">
          <Sparkles className="h-3.5 w-3.5 text-yellow-300" /> Platform Digital Masjid #1 Indonesia
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight max-w-3xl drop-shadow-lg">
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
          <a href="#video">
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 text-base h-12 gap-2">
              <Play className="h-4 w-4" /> Lihat Demo
            </Button>
          </a>
        </div>
      </div>

      {/* Controls */}
      <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition">
        <ChevronLeft className="h-5 w-5 text-white" />
      </button>
      <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition">
        <ChevronRight className="h-5 w-5 text-white" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {displaySlides.map((_, i) => (
          <button key={i} onClick={() => go(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? "bg-white w-8" : "bg-white/50"}`} />
        ))}
      </div>

      {/* Play/Pause */}
      <button onClick={() => setPlaying(p => !p)} className="absolute bottom-8 right-6 z-20 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition">
        {playing ? <Pause className="h-3.5 w-3.5 text-white" /> : <Play className="h-3.5 w-3.5 text-white" />}
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

        {/* Video embed placeholder — replace src with actual YouTube embed */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border bg-black aspect-video">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1"
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
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Dipercaya Ratusan Masjid</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Bergabunglah dengan ratusan masjid yang sudah merasakan manfaat MasjidKu
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

export default function Landing() {
  const [settings, setSettings] = useState(null);
  const [plans, setPlans] = useState([]);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({ name: "", email: "" });
  const [selectedPlan, setSelectedPlan] = useState("yearly");

  useEffect(() => {
    base44.entities.AppSettings.list().then(data => { if (data.length > 0) setSettings(data[0]); });
    base44.entities.PlanFeatures.list().then(data => setPlans(data || []));
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
    if (!registrationForm.name.trim()) {
      toast.error("Nama masjid harus diisi");
      return;
    }
    if (!registrationForm.email.trim()) {
      toast.error("Email harus diisi");
      return;
    }

    setProcessingPayment(true);
    try {
    // Jika plan gratis, skip pembayaran
    if (planPrice === 0) {
    const mosque = await base44.entities.Mosque.create({
      name: registrationForm.name,
      address: "-",
      city: "-",
      email: registrationForm.email,
      slug: registrationForm.name.toLowerCase().replace(/\s+/g, '-'),
      subscription_plan: selectedPlan,
      subscription_status: "active",
      subscription_start: new Date().toISOString(),
      subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active"
    });
    toast.success(`Masjid ${registrationForm.name} berhasil terdaftar! Selamat datang di MasjidKu!`);
    setRegistrationForm({ name: "", email: "" });
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 2000);
    setProcessingPayment(false);
    return;
    }

    // Create mosque first
    const mosque = await base44.entities.Mosque.create({
    name: registrationForm.name,
    address: "-",
    city: "-",
    email: registrationForm.email,
    slug: registrationForm.name.toLowerCase().replace(/\s+/g, '-'),
    subscription_plan: selectedPlan,
    subscription_status: "pending",
    status: "active"
    });

    // Trigger payment
    await loadMidtransSnap();
    await handleSnapPayment({
        mosque_id: mosque.id,
        order_id: `LAND-${mosque.id}-${Date.now()}`,
        amount: planPrice,
        customer_name: registrationForm.name,
        customer_email: registrationForm.email,
        success: async (result) => {
          const daysInPlan = selectedPlan === 'monthly' ? 30 : 365;
          await base44.entities.Mosque.update(mosque.id, {
            subscription_status: "active",
            subscription_start: new Date().toISOString(),
            subscription_end: new Date(Date.now() + daysInPlan * 24 * 60 * 60 * 1000).toISOString()
          });
          toast.success(`Masjid ${registrationForm.name} berhasil terdaftar! Selamat datang di MasjidKu!`);
          setRegistrationForm({ name: "", email: "" });
          // Redirect to dashboard after a moment
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 2000);
        },
        error: async () => {
          await base44.entities.Mosque.delete(mosque.id);
          toast.error("Pembayaran dibatalkan");
        },
        pending: () => toast.info("Pembayaran sedang diproses...")
      });
    } catch (err) {
      toast.error("Error: " + err.message);
    } finally {
      setProcessingPayment(false);
    }
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {settings?.logo_url
              ? <img src={settings.logo_url} alt="Logo" className="h-8 rounded-lg" />
              : <span className="text-2xl">🕌</span>}
            <span className="font-bold text-lg text-primary">{appName}</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#fitur" className="hover:text-primary transition-colors">Fitur</a>
            <a href="#video" className="hover:text-primary transition-colors">Demo</a>
            <a href="#testimoni" className="hover:text-primary transition-colors">Testimoni</a>
            <a href="#harga" className="hover:text-primary transition-colors">Harga</a>
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

      {/* Video & Screenshots */}
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
                <div>
                  <label className="block text-xs font-semibold text-left mb-1">Nama Masjid</label>
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
                  <label className="block text-xs font-semibold text-left mb-1">Email</label>
                  <input 
                    type="email" 
                    value={registrationForm.email}
                    onChange={e => setRegistrationForm({...registrationForm, email: e.target.value})}
                    placeholder="admin@masjid.com"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={processingPayment}
                  />
                </div>
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

      {/* CTA Banner */}
      <section className="py-16 px-6 bg-primary text-primary-foreground text-center">
        <div className="max-w-2xl mx-auto">
          <Wifi className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl font-bold mb-3">Siap Digitalisasi Masjid Anda?</h2>
          <p className="text-lg opacity-85 mb-6">Bergabunglah dengan ratusan masjid yang sudah menggunakan MasjidKu</p>
          <a href={waUrl} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold px-10 h-12 text-base">
              Daftar Sekarang — Gratis!
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 text-center text-sm text-muted-foreground border-t bg-muted/20">
        <div className="flex justify-center items-center gap-2 mb-3">
          <span className="text-2xl">🕌</span>
          <span className="font-bold text-foreground">{appName}</span>
        </div>
        <p className="mb-1">Platform digital terlengkap untuk manajemen masjid modern</p>
        {settings?.contact_email && <p>Email: {settings.contact_email}</p>}
        {settings?.contact_phone && <p>Telepon: {settings.contact_phone}</p>}
        <p className="mt-3">© {new Date().getFullYear()} {appName}. All rights reserved.</p>
      </footer>
    </div>
  );
}