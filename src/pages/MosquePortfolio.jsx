import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/apiClient";
import { formatCurrency, formatDate } from "@/lib/formatCurrency";
import {
  MapPin, Phone, Mail, Calendar, Clock, ArrowUpRight,
  ArrowDownRight, Wallet, Megaphone, Instagram, Youtube,
  Facebook, Globe, Landmark, UserPlus
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
      const me = await base44.auth.me();
      // Check if already a member
      const existing = await base44.entities.MosqueMember.filter({ user_email: me.email, mosque_id: mosqueId });
      if (existing.length === 0) {
        await base44.entities.MosqueMember.create({
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
      base44.auth.redirectToLogin(window.location.pathname + '?join=true');
    }
  }

  const handleJoinClick = () => {
    processJoin(mosque?.id);
  };

  async function loadData() {
    setLoading(true);
    let mosqueData = null;
    try {
      // Try by slug first, then list all and find by id
      const bySlug = await base44.entities.Mosque.filter({ slug: id });
      if (bySlug?.length > 0) {
        mosqueData = bySlug[0];
      } else {
        try {
          const byId = await base44.entities.Mosque.filter({ id: id });
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
      base44.entities.Activity.filter({ mosque_id: mosqueData.id, status: "upcoming" }, "date", 6),
      base44.entities.Announcement.filter({ mosque_id: mosqueData.id, status: "published" }, "-created_date", 5),
      mosqueData.show_financial ? base44.entities.Transaction.filter({ mosque_id: mosqueData.id }, "-date", 100) : Promise.resolve([]),
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

        {/* Footer */}
        <footer className="border-t pt-6 text-center text-xs text-muted-foreground">
          <p>Halaman ini dikelola menggunakan <span className="font-semibold text-primary">MasjidKu</span></p>
          <Link to="/" className="hover:text-primary hover:underline mt-1 inline-block">Daftarkan masjid Anda →</Link>
        </footer>
      </div>
    </div>
  );
}