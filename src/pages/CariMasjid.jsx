import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { smartApi } from "@/api/apiClient";
import { Search, MapPin, Phone, Mail, Globe, Users, ArrowRight, Landmark, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CariMasjid() {
  const [mosques, setMosques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterCity, setFilterCity] = useState("Semua");

  useEffect(() => {
    smartApi.entities.Mosque.filter({ status: "active" })
      .then(data => setMosques(data || []))
      .catch(() =>
        smartApi.entities.Mosque.list().then(data =>
          setMosques((data || []).filter(m => m.status !== "inactive"))
        )
      )
      .finally(() => setLoading(false));
  }, []);

  const cities = ["Semua", ...new Set(mosques.map(m => m.city).filter(Boolean))];

  const filtered = mosques.filter(m => {
    const q = query.toLowerCase();
    const matchQuery =
      !q ||
      m.name?.toLowerCase().includes(q) ||
      m.city?.toLowerCase().includes(q) ||
      m.address?.toLowerCase().includes(q);
    const matchCity = filterCity === "Semua" || m.city === filterCity;
    return matchQuery && matchCity;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-emerald-700 text-white py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-6 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Kembali ke Login
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🕌</span>
            <h1 className="text-3xl font-bold">Cari Masjid Anda</h1>
          </div>
          <p className="text-white/80 text-base mb-8 max-w-xl">
            Temukan masjid Anda dari daftar masjid yang telah bergabung dengan MasjidKu Smart
          </p>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cari nama masjid, kota, atau alamat..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl text-slate-800 text-base shadow-xl focus:outline-none focus:ring-2 focus:ring-white/50 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* City filter */}
        {cities.length > 2 && (
          <div className="flex gap-2 flex-wrap mb-6">
            {cities.slice(0, 12).map(city => (
              <button
                key={city}
                onClick={() => setFilterCity(city)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  filterCity === city
                    ? "bg-primary text-white shadow-md"
                    : "bg-white text-slate-600 border hover:border-primary hover:text-primary"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-500 text-sm">
            {loading ? "Memuat..." : `${filtered.length} masjid ditemukan`}
            {query && ` untuk "${query}"`}
          </p>
          <Link to="/#harga">
            <Button size="sm" variant="outline" className="text-primary border-primary">
              + Daftarkan Masjid Baru
            </Button>
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Memuat daftar masjid...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border">
            <Landmark className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Masjid Tidak Ditemukan</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
              {query
                ? `Tidak ada masjid yang cocok dengan "${query}". Coba kata kunci lain.`
                : "Belum ada masjid yang terdaftar. Jadilah yang pertama!"}
            </p>
            <Link to="/#harga">
              <Button className="px-6">Daftarkan Masjid Anda</Button>
            </Link>
          </div>
        )}

        {/* Mosque Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(mosque => (
              <div
                key={mosque.id}
                className="bg-white rounded-2xl border hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden group"
              >
                {/* Cover */}
                <div className="relative h-32 bg-gradient-to-br from-primary/20 to-emerald-100 overflow-hidden">
                  {mosque.cover_image_url ? (
                    <img
                      src={mosque.cover_image_url}
                      alt={mosque.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => { e.target.style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-5xl opacity-30">🕌</span>
                    </div>
                  )}
                  {/* Logo */}
                  {mosque.logo_url && (
                    <img
                      src={mosque.logo_url}
                      alt="Logo"
                      className="absolute bottom-3 left-4 w-10 h-10 rounded-xl object-cover border-2 border-white shadow-md bg-white"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-bold text-base text-slate-800 mb-1 line-clamp-1">{mosque.name}</h3>
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-3">
                    <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <span className="line-clamp-1">{mosque.address ? `${mosque.address}, ` : ""}{mosque.city}{mosque.province ? `, ${mosque.province}` : ""}</span>
                  </div>

                  {/* Contact quick links */}
                  <div className="flex gap-2 mb-4">
                    {mosque.phone && (
                      <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                        <Phone className="h-3 w-3" /> {mosque.phone}
                      </span>
                    )}
                    {mosque.email && !mosque.phone && (
                      <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                        <Mail className="h-3 w-3" /> {mosque.email}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={`/masjid/${mosque.slug || mosque.id}`}
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 hover:border-primary hover:text-primary">
                        <Globe className="h-3.5 w-3.5" /> Lihat Halaman
                      </Button>
                    </Link>
                    <Link
                      to={`/masjid/${mosque.slug || mosque.id}/login`}
                      className="flex-1"
                    >
                      <Button size="sm" className="w-full text-xs gap-1.5">
                        <Users className="h-3.5 w-3.5" /> Login Jamaah
                        <ArrowRight className="h-3 w-3 ml-auto" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA daftar */}
        <div className="mt-10 bg-gradient-to-br from-emerald-50 to-primary/5 border border-emerald-200 rounded-2xl p-8 text-center">
          <span className="text-3xl block mb-3">🕌</span>
          <h3 className="font-bold text-lg mb-2">Masjid Anda Belum Terdaftar?</h3>
          <p className="text-slate-500 text-sm mb-5 max-w-md mx-auto">
            Daftarkan masjid Anda sekarang dan nikmati semua fitur manajemen digital. Trial gratis 30 hari!
          </p>
          <Link to="/#harga">
            <Button className="px-8 shadow-md">Daftarkan Masjid Sekarang</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
