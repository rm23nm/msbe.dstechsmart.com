import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import QRCode from "react-qr-code";
import { smartApi } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/formatCurrency";
import {
  CheckCircle,
  Star,
  Users as UsersIcon,
  Calendar,
  DollarSign,
  Package,
  Globe,
  Sparkles,
  Monitor,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  MessageSquare,
  TrendingUp,
  Shield,
  Wifi,
  Megaphone,
  Gift,
  FileText,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Send,
  Bot,
  X,
  ChevronDown,
  Rocket,
  Crown,
  Zap,
  ShieldCheck,
  Building2,
  BookOpen,
  ClipboardList,
  Info,
  Search,
  Map,
  Loader2,
} from "lucide-react";

// --- DATA STATIS ---
const FEATURES = [
  {
    icon: Bot,
    title: "Integrasi Telegram & AI",
    desc: "Bot notifikasi otomatis, tanya jawab jamaah, dan asisten digital pengurus langsung di Telegram",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Sparkles,
    title: "Scan Struk AI Gemini",
    desc: "Analisis laporan keuangan instan hanya dengan foto struk belanja menggunakan teknologi AI Gemini",
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: CheckCircle2,
    title: "Mushaf Al-Quran & Tafsir",
    desc: "Digital Mushaf lengkap dengan murotal audio per ayat dan tafsir untuk pengajian dan publik",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: ClipboardList,
    title: "Absensi QR Code",
    desc: "Tracking kehadiran jamaah di setiap majelis ilmu dan kegiatan masjid dengan sistem barcode instan",
    color: "bg-violet-50 text-violet-600",
  },
  {
    icon: Calendar,
    title: "Jadwal Shalat & Jumat",
    desc: "Atur jadwal shalat 5 waktu, petugas Jumat, dan tampilkan otomatis di layar TV masjid",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: DollarSign,
    title: "Manajemen Keuangan",
    desc: "Catat pemasukan & pengeluaran, laporan otomatis per periode dengan grafik interaktif",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Globe,
    title: "Halaman Publik Masjid",
    desc: "Website masjid profesional yang bisa dibagikan ke seluruh jamaah dengan custom domain",
    color: "bg-rose-50 text-rose-600",
  },
  {
    icon: Monitor,
    title: "Digital Signage (Public TV)",
    desc: "Tampilan otomatis layar TV untuk jadwal shalat, pengumuman, donasi, dan keuangan masjid",
    color: "bg-cyan-50 text-cyan-600",
  },
  {
    icon: Megaphone,
    title: "Pengumuman & Notifikasi",
    desc: "Broadcast pengumuman penting dan kirim notifikasi real-time ke seluruh jamaah",
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: Gift,
    title: "Manajemen Donasi & Zakat",
    desc: "Terima donasi online via Midtrans, tracking transparansi, dan QR code donasi",
    color: "bg-green-50 text-green-600",
  },
];

const HERO_SLIDES_DEFAULT = [
  {
    image:
      "https://images.unsplash.com/photo-1591500366657-6be094e410b0?w=1600&q=80",
    title: "Kelola Masjid Lebih Cerdas",
    sub: "Platform digital terlengkap untuk administrasi, keuangan, dan informasi masjid modern",
    tag: "✨ Modern & Transparan",
  },
  {
    videoId: "xkuAToGvtW8",
    thumb:
      "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=1600&q=80",
    title: "Masa Depan Masjid Ada di Genggaman",
    sub: "Platform digital #1 Indonesia untuk administrasi tajam dan jamaah yang lebih dekat.",
    tag: "📹 Demo Aplikasi",
  },
  {
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600&q=80",
    title: "Kegiatan & Kajian Live",
    sub: "Tayangkan video kajian, ceramah, dan kegiatan masjid secara otomatis untuk jamaah di mana saja.",
  },
];

const MOSQUE_ACTIVITIES = [
  {
    emoji: "🌙",
    title: "Jadwal Shalat Harian",
    desc: "Jadwal shalat 5 waktu terupdate otomatis setiap hari",
    color: "from-emerald-500 to-teal-600",
  },
  {
    emoji: "📋",
    title: "Laporan Keuangan",
    desc: "Dokumen kas masuk/keluar yang transparan dan akuntabel",
    color: "from-blue-500 to-indigo-600",
  },
  {
    emoji: "📣",
    title: "Pengumuman & Notifikasi",
    desc: "Broadcast pengumuman penting langsung ke jamaah",
    color: "from-amber-500 to-orange-600",
  },
  {
    emoji: "🎓",
    title: "Jadwal Kajian",
    desc: "Dokumentasi jadwal kajian rutin dan nama pemateri",
    color: "from-purple-500 to-violet-600",
  },
  {
    emoji: "🤝",
    title: "Program Zakat",
    desc: "Manajemen santunan dan zakat yang terverifikasi",
    color: "from-rose-500 to-pink-600",
  },
  {
    emoji: "🏗️",
    title: "Aset Masjid",
    desc: "Pencatatan inventaris properti dan peralatan masjid",
    color: "from-slate-500 to-gray-600",
  },
];

const TESTIMONIALS = [
  {
    name: "Ustadz Ahmad Fauzi",
    role: "Ketua DKM, Jakarta",
    text: "MasjidKu mengubah cara kami mengelola keuangan menjadi lebih transparan.",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    rating: 5,
  },
  {
    name: "Bpk. Hendra Wijaya",
    role: "Bendahara, Bandung",
    text: "Fitur AI Gemini membantu saya merapikan laporan kas hanya dalam hitungan detik.",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
    rating: 5,
  },
];

// --- MAIN COMPONENT ---
export default function LandingPage() {
  const [mosques, setMosques] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    name: "",
    email: "",
    password: "",
    showPassword: false,
  });
  const [appName, setAppName] = useState("MasjidKu Smart");
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [mList, pList, sList] = await Promise.all([
          smartApi.entities.Mosque.list(),
          smartApi.entities.PlanFeatures.list(),
          smartApi.entities.AppSettings.list(),
        ]);
        setMosques(mList || []);
        setPlans(pList.filter((p) => p.plan !== "trial") || []);
        if (sList && sList.length > 0) {
          setSettings(sList[0]);
          setAppName(sList[0].app_name || "MasjidKu Smart");
        }
      } catch (err) {}
      setLoading(false);
    }
    loadData();
  }, []);

  const waUrl = settings?.whatsapp_number
    ? `https://wa.me/${settings.whatsapp_number}?text=Halo%20Admin%20MasjidKu%2C%20saya%20ingin%20bertanya%20tentang%20aplikasi.`
    : `https://wa.me/628123456789?text=Halo%20Admin%20MasjidKu%2C%20saya%20ingin%20bertanya%20tentang%20aplikasi.`;

  async function handlePaymentClick(plan) {
    if (
      !registrationForm.name ||
      !registrationForm.email ||
      !registrationForm.password
    ) {
      toast.error("Mohon isi form pendaftaran di atas");
      document
        .getElementById("pendaftaran")
        .scrollIntoView({ behavior: "smooth" });
      return;
    }
    setProcessingPayment(true);
    try {
      const response = await smartApi.auth.register({
        name: registrationForm.name,
        email: registrationForm.email,
        password: registrationForm.password,
        subscription_plan: plan.plan,
      });
      if (response && response.token) {
        toast.success("Registrasi Berhasil!");
        window.location.href = "/dashboard";
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessingPayment(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Previous Design */}
      <header className="fixed top-0 left-0 right-0 z-50">
        {/* Top Bar */}
        <div className="bg-[#10b981] text-white py-2 px-6 text-xs md:text-[13px] font-medium">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <Phone className="h-3 w-3" />{" "}
                {settings?.contact_phone || "+6282259494242"}
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="h-3 w-3" />{" "}
                {settings?.contact_email || "cs@dstechsmart.com"}
              </div>
            </div>
            <div className="hidden md:flex gap-4">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3" /> Indonesia
              </div>
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-3 w-3" /> WhatsApp Support
              </div>
            </div>
          </div>
        </div>
        {/* Main Nav */}
        <nav className="bg-white/95 backdrop-blur shadow-sm py-4 px-6 border-b">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src="/favicon.png" className="w-9 h-9" alt="Logo" />
              <span className="font-bold text-xl text-[#0f172a]">
                {appName}
              </span>
            </Link>
            <div className="hidden lg:flex items-center gap-6 text-[13px] font-semibold text-slate-500">
              <a href="#cari" className="flex items-center gap-1.5 text-primary">
                <Search className="h-3.5 w-3.5" /> Cari Masjid
              </a>
              <a href="#fitur" className="hover:text-primary transition-colors">
                Fitur
              </a>
              <a href="#galeri" className="hover:text-primary transition-colors">
                Galeri
              </a>
              <a href="#video" className="hover:text-primary transition-colors">
                Video
              </a>
              <a href="#testimoni" className="hover:text-primary transition-colors">
                Testimoni
              </a>
              <a href="#harga" className="hover:text-primary transition-colors">
                Harga
              </a>
              <a href="#kontak" className="hover:text-primary transition-colors">
                Kontak
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button
                  variant="ghost"
                  className="text-xs font-bold text-slate-600"
                >
                  Masuk
                </Button>
              </Link>
              <Link to="/admin">
                <Button
                  variant="outline"
                  className="text-xs font-bold border-slate-200"
                >
                  Superadmin
                </Button>
              </Link>
              <a href="#harga">
                <Button className="bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold rounded-lg px-5">
                  Mulai Gratis
                </Button>
              </a>
            </div>
          </div>
        </nav>
      </header>

      <div className="pt-24 font-sans">
        <HeroSlider
          slides={HERO_SLIDES_DEFAULT}
          waUrl={waUrl}
          heroImage={settings?.hero_image_url}
        />

        <div id="cari">
          <SearchSection mosques={mosques} />
        </div>

        <StatsBar />

        <section id="fitur" className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Badge className="bg-[#10b981]/10 text-[#10b981] border-none px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
              MODERN & TRANSPARAN
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              Solusi Digital Lengkap
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Teknologi pendamping khidmat pengurus dalam memakmurkan masjid.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="group p-8 rounded-3xl border bg-white hover:shadow-xl transition-all border-slate-100"
              >
                <div
                  className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center mb-6`}
                >
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-extrabold mb-3">{f.title}</h3>
                <p className="text-base text-slate-500 leading-relaxed font-medium">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Keunggulan (Rich Card Comparison) */}
        <section className="py-24 px-6 bg-[#f8fafc]">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2">
              <h2 className="text-4xl font-black mb-8">
                Kenapa Memilih MasjidKu Smart?
              </h2>
              <div className="space-y-6">
                {[
                  {
                    t: "Kecerdasan AI Gemini",
                    d: "Scan struk otomatis masuk ke laporan keuangan masjid.",
                    i: Sparkles,
                  },
                  {
                    t: "Bot Pembantu Pengurus",
                    d: "Integrasi bot otomatis di Telegram untuk layanan jamaah.",
                    i: Bot,
                  },
                  {
                    t: "Dashboard Multi Platform",
                    d: "Sistem yang bisa diakses via HP, Laptop, hingga TV Masjid.",
                    i: Monitor,
                  },
                ].map((k, i) => (
                  <div
                    key={i}
                    className="flex gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm"
                  >
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <k.i className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">{k.t}</h4>
                      <p className="text-sm text-slate-400 font-medium">
                        {k.d}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 relative bg-[#0f172a] text-white p-8 rounded-[2rem] shadow-2xl">
              <div className="mb-6 font-bold text-emerald-400">
                MasjidKu Smart vs Konvensional
              </div>
              <div className="space-y-4">
                {[
                  ["Input Laporan Kas", "Otomatis AI", "Manual"],
                  ["Informasi Jadwal", "Real-time TV/Bot", "Print Kertas"],
                  ["Transparansi Dana", "Online Terbuka", "Papan Tulis"],
                ].map((r, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-3 gap-2 text-xs border-b border-white/5 pb-5 last:border-0"
                  >
                    <span className="text-slate-400">{r[0]}</span>
                    <span className="font-bold text-emerald-400">{r[1]}</span>
                    <span className="text-slate-500 line-through">{r[2]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <GaleriSection mosques={mosques} />

        <div id="video">
          <VideoHighlightsSection mosques={mosques} />
        </div>

        <AktivitasSection />

        <div id="video-demo">
          <VideoDemoSection />
        </div>

        <TestimonialsSection />

        {/* Pricing Restoration */}
        <section id="harga" className="py-24 px-6 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold mb-4">
                Pilih Paket Terbaik
              </h2>
              <p className="text-slate-500">
                Sesuaikan dengan kebutuhan digitalisasi masjid Anda.
              </p>
            </div>

            <div
              id="pendaftaran"
              className="bg-white rounded-3xl border p-8 mb-12 max-w-3xl mx-auto shadow-sm"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#10b981]">
                  <UsersIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Daftar Akun Pengurus</h3>
                  <p className="text-xs text-slate-400 tracking-tight">
                    Siapkan akses eksklusif untuk manajemen masjid Anda saat
                    ini.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">
                    Nama Masjid
                  </Label>
                  <Input
                    value={registrationForm.name}
                    onChange={(e) =>
                      setRegistrationForm({
                        ...registrationForm,
                        name: e.target.value,
                      })
                    }
                    className="rounded-xl h-11"
                    placeholder="Contoh: Al-Ikhlas"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">
                    Email Login
                  </Label>
                  <Input
                    value={registrationForm.email}
                    onChange={(e) =>
                      setRegistrationForm({
                        ...registrationForm,
                        email: e.target.value,
                      })
                    }
                    className="rounded-xl h-11"
                    placeholder="admin@masjid.id"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">
                    Password
                  </Label>
                  <Input
                    type="password"
                    value={registrationForm.password}
                    onChange={(e) =>
                      setRegistrationForm({
                        ...registrationForm,
                        password: e.target.value,
                      })
                    }
                    className="rounded-xl h-11"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {plans.map((p) => {
                let feat = [];
                try {
                  feat = p.features
                    ? typeof p.features === "string"
                      ? JSON.parse(p.features)
                      : p.features
                    : [];
                } catch (e) {}
                const duration =
                  p.plan === "monthly"
                    ? "1 Bln"
                    : p.plan === "triwulan"
                      ? "3 Bln"
                      : p.plan === "semester"
                        ? "6 Bln"
                        : "12 Bln";
                return (
                  <div
                    key={p.id}
                    className={`bg-white border rounded-3xl p-6 flex flex-col hover:shadow-xl transition-all ${p.is_popular ? "ring-2 ring-emerald-500" : ""}`}
                  >
                    <div className="font-bold text-lg mb-4 capitalize">
                      Paket {p.plan}
                    </div>
                    <div className="mb-6">
                      {p.original_price > p.price && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs text-slate-400 line-through">
                            {formatCurrency(p.original_price)}
                          </span>
                          <Badge
                            variant="secondary"
                            className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5"
                          >
                            -
                            {Math.round((1 - p.price / p.original_price) * 100)}
                            %
                          </Badge>
                        </div>
                      )}
                      <div className="text-2xl font-black text-[#0f172a]">
                        {formatCurrency(p.price)}
                      </div>
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-wide">
                        Per {duration}
                      </div>
                    </div>
                    <ul className="flex-1 space-y-2 mb-8">
                      {feat.slice(0, 6).map((f, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-sm font-medium text-slate-500"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => handlePaymentClick(p)}
                      disabled={processingPayment}
                      className={`${p.is_popular ? "bg-emerald-500 hover:bg-emerald-600" : "bg-[#0f172a] hover:bg-[#1e293b]"} h-11 rounded-xl text-sm font-bold text-white`}
                    >
                      Daftar Sekarang
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Restore Contact Section */}
        <section
          id="kontak"
          className="py-24 px-6 bg-white overflow-hidden scroll-mt-24"
        >
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-start">
            <div className="lg:w-1/2">
              <Badge className="bg-emerald-50 text-emerald-600 border-none px-4 py-1.5 mb-6">
                HUBUNGI KAMI
              </Badge>
              <h2 className="text-4xl font-black mb-6">
                Konsultasikan Kebutuhan Masjid Anda
              </h2>
              <p className="text-slate-500 mb-12">
                Tim kami siap membantu menjawab pertanyaan seputar digitalisasi
                operasional kemasjidan Anda.
              </p>
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 border rounded-2xl">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-bold uppercase transition-all">
                      Telepon / WhatsApp
                    </div>
                    <div className="font-bold">
                      {settings?.contact_phone || "+6282259494242"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 border rounded-2xl">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-bold uppercase transition-all">
                      Email Support
                    </div>
                    <div className="font-bold">
                      {settings?.contact_email || "cs@dstechsmart.com"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2 bg-[#0f172a] text-white p-8 rounded-[2rem] shadow-2xl relative">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-slate-500">
                    Nama
                  </Label>
                  <Input
                    className="bg-white/5 border-white/10 rounded-xl text-white"
                    placeholder="John"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-slate-500">
                    WhatsApp
                  </Label>
                  <Input
                    className="bg-white/5 border-white/10 rounded-xl text-white"
                    placeholder="081..."
                  />
                </div>
              </div>
              <div className="space-y-1 mb-6">
                <Label className="text-[10px] uppercase font-bold text-slate-500">
                  Pesan
                </Label>
                <textarea
                  className="w-full min-h-[100px] bg-white/5 border border-white/10 p-4 rounded-xl text-xs outline-none focus:ring-1 ring-emerald-500"
                  placeholder="Ketik pesan Anda..."
                />
              </div>
              <Button className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold">
                Kirim Sekarang
              </Button>
            </div>
          </div>
        </section>

        {/* Footer Restore Banner */}
        <section className="bg-emerald-600 py-20 px-6 text-center text-white">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-center">
              <Wifi className="h-10 w-10 opacity-30" />
            </div>
            <h2 className="text-4xl font-black">
              Siap Digitalisasi Masjid Anda?
            </h2>
            <p className="text-emerald-50 opacity-80 text-xl font-medium">
              Bergabunglah dengan jutaan masjid yang sudah menggunakan MasjidKu
              Smart.
            </p>
            <a href="#harga">
              <Button className="bg-white text-emerald-600 hover:bg-emerald-50 px-10 h-14 rounded-2xl text-lg font-bold">
                Daftar Sekarang — Gratis!
              </Button>
            </a>
          </div>
        </section>

        {/* Full Footer Previous Design */}
        <footer className="bg-[#0f172a] py-20 px-6 text-white border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
              <div className="md:col-span-1">
                <div className="flex items-center gap-3 mb-6">
                  <img src="/favicon.png" className="w-10" alt="Logo" />
                  <h4 className="text-xl font-bold">MasjidKu Smart</h4>
                </div>
                <p className="text-slate-400 text-base leading-relaxed mb-6 italic">
                  Platform digital terlengkap untuk manajemen masjid modern.
                  Dipercaya jutaan masjid di seluruh Indonesia.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-[#10b981] px-5 py-2.5 text-xs font-bold text-white rounded-full"
                  >
                    WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[#4f46e5] px-5 py-2.5 text-xs font-bold text-white rounded-full"
                  >
                    Email
                  </Button>
                </div>
              </div>
              <div className="md:pl-10 h-max">
                <h5 className="mb-6 text-sm font-bold tracking-widest text-slate-300 uppercase">
                  Platform
                </h5>
                <ul className="space-y-4 text-base text-slate-500">
                  {[
                    "Fitur Lengkap",
                    "Harga & Paket",
                    "Galeri Masjid",
                    "Testimoni",
                  ].map((l, i) => (
                    <li key={i}>
                      <a
                        href={`#${l.toLowerCase().split(" ")[0]}`}
                        className="hover:text-emerald-400 transition-colors"
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="mb-6 text-sm font-bold tracking-widest text-slate-300 uppercase">
                  Kontak
                </h5>
                <ul className="space-y-4 text-sm text-slate-400">
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-emerald-400" /> +6282259494242
                  </li>
                  <li className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-emerald-400" />{" "}
                    cs@dstechsmart.com
                  </li>
                  <li className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-emerald-400" /> Indonesia
                  </li>
                </ul>
              </div>
              <div className="text-center md:text-left">
                <h5 className="flex items-center justify-center gap-2 mb-6 text-sm font-bold tracking-widest text-slate-300 md:justify-start uppercase">
                  Aplikasi Mobile{" "}
                  <Badge className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 border-none uppercase">
                    BARU
                  </Badge>
                </h5>
                <div className="inline-block p-3 mb-4 bg-white border-4 shadow-2xl rounded-2xl border-white/10">
                  <QRCode value={window.location.origin} size={110} />
                </div>
                <p className="text-xs italic leading-relaxed text-slate-500 max-w-[170px]">
                  Scan dengan kamera HP Anda untuk Menginstal Aplikasi MasjidKu
                  secara otomatis.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-between gap-4 pt-10 border-t md:flex-row border-white/5 text-xs">
              <div className="font-medium text-slate-600">
                © {new Date().getFullYear()} MasjidKu Smart. All rights
                reserved.
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 uppercase font-bold tracking-tighter">
                Dibuat dengan ❤️ untuk kemajuan masjid Indonesia
              </div>
            </div>
          </div>
        </footer>
      </div>

      <AIChatWidget waUrl={waUrl} settings={settings} />
    </div>
  );
}

// ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────

function HeroSlider({ slides, waUrl, heroImage }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () => setCurrent((c) => (c + 1) % slides.length),
      8000,
    );
    return () => clearInterval(t);
  }, [slides.length]);
  const s = slides[current];
  return (
    <div className="relative h-[85vh] bg-[#0f172a] overflow-hidden">
      {slides.map((sl, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? "opacity-100" : "opacity-0"}`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${sl.thumb || sl.image})`,
              filter: "brightness(0.35) contrast(1.1)",
            }}
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent opacity-60" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center z-10 px-6">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 mb-8 animate-in fade-in zoom-in duration-700">
          <Star className="h-3 w-3 text-emerald-400 fill-emerald-400" />
          <span className="text-[10px] font-bold tracking-widest uppercase">
            Platform Digital Masjid #1 Indonesia
          </span>
        </div>
        <h1 className="text-5xl md:text-[84px] font-black mb-8 leading-[0.9] tracking-tighter max-w-5xl animate-in slide-in-from-bottom-8 duration-700">
          {s.title}
        </h1>
        <p className="text-lg md:text-2xl text-slate-200 opacity-90 max-w-2xl mb-12 font-medium leading-relaxed">
          {s.sub}
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a href="#harga">
            <Button className="bg-[#10b981] hover:bg-[#059669] text-white px-10 h-16 rounded-2xl text-lg font-bold shadow-2xl shadow-emerald-500/20">
              Mulai Sekarang
            </Button>
          </a>
          <a href={waUrl} target="_blank">
            <Button
              variant="outline"
              className="border-white/30 bg-white/5 text-white hover:bg-white hover:text-slate-900 px-10 h-16 rounded-2xl text-lg font-bold backdrop-blur-md"
            >
              Konsultasi Video
            </Button>
          </a>
        </div>
      </div>
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2.5 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "bg-[#10b981] w-12" : "bg-white/20 w-4"}`}
          />
        ))}
      </div>
      <div className="absolute top-1/2 left-6 -translate-y-1/2 z-20 hidden md:block">
        <Button
          variant="ghost"
          className="rounded-full w-12 h-12 border border-white/10 bg-white/5 hover:bg-white/10 text-white"
          onClick={() =>
            setCurrent((c) => (c - 1 + slides.length) % slides.length)
          }
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </div>
      <div className="absolute top-1/2 right-6 -translate-y-1/2 z-20 hidden md:block">
        <Button
          variant="ghost"
          className="rounded-full w-12 h-12 border border-white/10 bg-white/5 hover:bg-white/10 text-white"
          onClick={() => setCurrent((c) => (c + 1) % slides.length)}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}

function StatsBar() {
  return (
    <div className="bg-[#0f172a] py-14 border-y border-white/5">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-6 text-center text-white">
        {[
          { v: "1.200+", l: "Masjid Aktif" },
          { v: "250K+", l: "Jamaah Terdaftar" },
          { v: "99.9%", l: "Data Uptime" },
          { v: "24/7", l: "Support Support" },
        ].map((s, i) => (
          <div key={i}>
            <div className="text-4xl font-black mb-1">{s.v}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black opacity-80">
              {s.l}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SearchSection({ mosques }) {
  const [query, setQuery] = useState("");
  const filtered = mosques
    .filter(
      (m) =>
        !query ||
        m.name?.toLowerCase().includes(query.toLowerCase()) ||
        m.city?.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 8);

  return (
    <section className="px-6 max-w-5xl mx-auto -mt-10 relative z-40">
      <div className="bg-white rounded-[2rem] shadow-2xl border-4 border-[#10b981]/10 p-2.5 flex flex-col md:flex-row items-stretch md:items-center gap-2">
        <div className="flex-1 relative flex items-center pl-6">
          <Search className="absolute left-6 h-5 w-5 text-slate-300" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder="Cari Masjid Terdaftar (Contoh: Al-Ikhlas, Jakarta...)"
            className="w-full h-14 pl-10 pr-4 outline-none border-none text-slate-700 font-bold placeholder:text-slate-300"
          />
        </div>
        <Button className="h-14 px-10 rounded-[1.5rem] bg-[#10b981] hover:bg-[#059669] text-white font-black text-[13px] shadow-lg shadow-emerald-500/20">
          Cari Sekarang
        </Button>
      </div>

      {query && filtered.length > 0 && (
        <div className="mt-4 bg-white rounded-[2rem] border shadow-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
          {filtered.map((m) => (
            <Link
              key={m.id}
              to={`/m/${m.id}`}
              className="flex items-center gap-4 p-4 hover:bg-emerald-50 rounded-2xl transition-colors border border-slate-50 group"
            >
              <div className="w-12 h-12 rounded-xl border bg-white p-1 overflow-hidden flex-shrink-0 shadow-sm">
                <img
                  src={m.logo_url || "/favicon.png"}
                  className="w-full h-full object-contain"
                  alt={m.name}
                />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm text-slate-800 group-hover:text-emerald-600 transition-colors truncate">
                  {m.name}
                </div>
                <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase tracking-tighter">
                  <MapPin className="h-2.5 w-2.5" /> {m.city || "Indonesia"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function GaleriSection({ mosques }) {
  const photos = mosques
    .flatMap((m) =>
      m.tv_slideshow_urls ? m.tv_slideshow_urls.split(",") : [m.logo_url],
    )
    .filter(Boolean)
    .slice(0, 10);
  if (photos.length === 0) return null;
  return (
    <section id="galeri" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black">Galeri Kebermanfaatan</h2>
          <p className="text-slate-500">
            Melihat nyata penggunaan platform di berbagai masjid.
          </p>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-10 scrollbar-hide px-4">
          {photos.map((url, i) => (
            <div
              key={i}
              className="relative w-85 h-60 flex-shrink-0 rounded-[2.5rem] overflow-hidden shadow-xl border-8 border-slate-50 hover:scale-105 transition-all duration-500 group"
            >
              <img
                src={url}
                className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function VideoHighlightsSection({ mosques }) {
  const video = mosques.find((m) => m.tv_video_url || m.youtube);
  if (!video) return null;
  const vidId = (video.tv_video_url || video.youtube).match(
    /(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/,
  )?.[1];
  if (!vidId) return null;
  return (
    <section className="py-24 px-6 bg-[#0f172a] text-white text-center overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <Badge className="bg-emerald-500 mb-6 font-bold">
          LIVE DOKUMENTASI
        </Badge>
        <h2 className="text-3xl font-black mb-12">
          Video Kegiatan Bersama MasjidKu
        </h2>
        <div className="aspect-video bg-black rounded-[3rem] overflow-hidden border-8 border-white/5 shadow-[0_0_80px_rgba(var(--primary-rgb),0.1)]">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${vidId}?rel=0`}
            className="w-full h-full"
            allowFullScreen
          />
        </div>
        <p className="mt-8 font-black text-slate-500 text-sm tracking-widest uppercase">
          📽️ Video dari: {video.name}
        </p>
      </div>
    </section>
  );
}

function AktivitasSection() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto text-center mb-16">
        <h2 className="text-3xl font-black mb-4 tracking-tight">
          Administrasi Rapi & Terpusat
        </h2>
        <p className="text-slate-400">
          Seluruh arsip masjid tersimpan aman di infrastruktur cloud kami.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {MOSQUE_ACTIVITIES.map((a, i) => (
          <div
            key={i}
            className="p-10 rounded-[2.5rem] border border-slate-50 hover:bg-slate-50 transition-all hover:-translate-y-2 group"
          >
            <span className="text-5xl mb-6 block group-hover:scale-110 transition-transform">
              {a.emoji}
            </span>
            <h4 className="font-bold text-lg mb-3">{a.title}</h4>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              {a.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function VideoDemoSection() {
  return (
    <section className="py-24 px-6 bg-slate-50 text-center">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-black mb-12">
          Demo Aplikasi MasjidKu Smart
        </h2>
        <div className="group relative aspect-video bg-black rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
          <iframe
            src="https://www.youtube-nocookie.com/embed/xkuAToGvtW8"
            className="w-full h-full"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section id="testimoni" className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black">Testimoni Pengurus</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex flex-col"
            >
              <p className="italic text-slate-600 mb-8 font-medium leading-relaxed">
                "{t.text}"
              </p>
              <div className="flex items-center gap-4 mt-auto">
                <img
                  src={t.avatar}
                  className="w-14 h-14 rounded-full border-2 border-white shadow-md object-cover"
                />
                <div className="text-left">
                  <div className="font-bold text-sm text-[#0f172a]">
                    {t.name}
                  </div>
                  <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    {t.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AIChatWidget({ waUrl, settings }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "model",
      text: "Assalamu'alaikum! Saya Asisten MasjidKu. Ada yang bisa saya bantu terkait digitalisasi masjid Anda hari ini?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (open) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const res = await fetch(`${apiUrl}/api/ai/customer-service`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: messages
            .slice(1)
            .slice(-6)
            .map((m) => ({ role: m.role, parts: [{ text: m.text || "" }] })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "model", text: data.text }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "Mohon maaf, sistem sedang sibuk. Silakan hubungi kami via WhatsApp.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-10 right-10 z-[60] w-16 h-16 bg-[#10b981] rounded-full shadow-[0_15px_40px_rgba(16,185,129,0.4)] flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all border-4 border-white animate-bounce"
      >
        {open ? <X className="h-8 w-8" /> : <Bot className="h-8 w-8" />}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-28 right-6 md:right-10 z-[60] w-[calc(100vw-3rem)] md:w-96 h-[500px] bg-white rounded-[2.5rem] shadow-2xl border overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
          {/* Header */}
          <div className="bg-[#10b981] p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-bold">MasjidKu Assistant</div>
                <div className="text-[10px] flex items-center gap-1 opacity-80 uppercase tracking-widest font-black">
                  <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse" />{" "}
                  AI Online
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 scrollbar-hide">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-3xl text-[13px] leading-relaxed shadow-sm ${m.role === "user" ? "bg-[#10b981] text-white rounded-tr-none" : "bg-white text-slate-700 rounded-tl-none border border-slate-100"}`}
                >
                  {m.text}
                  {m.role === "model" && m.text?.includes("wa.me") && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <a
                        href={waUrl}
                        target="_blank"
                        className="flex items-center justify-center gap-2 bg-emerald-500 text-white py-2 rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                      >
                        <MessageSquare className="h-4 w-4" /> Hubungi CS
                        WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t">
            <div className="relative">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Tanya harga, fitur, atau lainnya..."
                className="w-full h-12 bg-slate-100 rounded-2xl pl-4 pr-12 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all border-none"
              />
              <button
                onClick={handleSend}
                disabled={loading}
                className="absolute right-2 top-2 w-8 h-8 bg-[#10b981] text-white rounded-xl flex items-center justify-center hover:bg-[#059669] disabled:bg-slate-300 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="text-[9px] text-center text-slate-300 mt-2 font-bold uppercase tracking-widest">
              Powered by Gemini AI
            </div>
          </div>
        </div>
      )}
    </>
  );
}
