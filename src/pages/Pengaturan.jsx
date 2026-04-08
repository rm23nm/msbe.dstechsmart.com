import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import { useMosqueContext } from "@/lib/useMosqueContext";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "../components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Settings, Save, Globe, ExternalLink, Copy, Upload, ShieldCheck, Users, KeyRound, Sparkles, Navigation } from "lucide-react";
import NotificationSettings from "../components/NotificationSettings";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const TIMEZONE_DATA = [
  { 
    country: "Indonesia", 
    zones: [
      { value: "Asia/Jakarta", label: "WIB (Jakarta, Surabaya, Medan)" },
      { value: "Asia/Makassar", label: "WITA (Bali, Makassar, Balikpapan)" },
      { value: "Asia/Jayapura", label: "WIT (Jayapura, Ambon, Manokwari)" }
    ]
  },
  {
    country: "Singapore",
    zones: [{ value: "Asia/Singapore", label: "SGT (Singapore)" }]
  },
  {
    country: "Malaysia",
    zones: [
      { value: "Asia/Kuala_Lumpur", label: "MYT (Kuala Lumpur, Penang)" },
      { value: "Asia/Kuching", label: "MYT (Kuching, Kota Kinabalu)" }
    ]
  },
  {
    country: "Saudi Arabia",
    zones: [{ value: "Asia/Riyadh", label: "AST (Mecca, Medina, Riyadh)" }]
  },
  {
    country: "Brunei",
    zones: [{ value: "Asia/Brunei", label: "BNT (Bandar Seri Begawan)" }]
  },
  {
    country: "Others",
    zones: [
      { value: "UTC", label: "UTC (Coordinated Universal Time)" },
      { value: "Asia/Bangkok", label: "ICT (Bangkok, Hanoi, Jakarta)" },
      { value: "Asia/Dubai", label: "GST (Dubai, Abu Dhabi)" },
      { value: "Asia/Tokyo", label: "JST (Tokyo, Seoul)" },
      { value: "Europe/London", label: "GMT (London, Lisbon)" },
      { value: "Europe/Istanbul", label: "TRT (Istanbul, Ankara)" }
    ]
  }
];


export default function Pengaturan() {
  const { currentMosque, loading, isMosqueAdmin, isAdmin, reload } = useMosqueContext();
  const { user, checkAppState, updateUser } = useAuth();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [setup2FAData, setSetup2FAData] = useState(null);

  const handleSetup2FA = async () => {
    try {
      const data = await smartApi.auth.generate2FA();
      setSetup2FAData(data);
    } catch (error) {
      toast.error("Gagal menyiapkan 2FA");
    }
  };

  const handleEnable2FA = async () => {
    try {
      await smartApi.auth.enable2FA(twoFactorToken);
      toast.success("2FA berhasil diaktifkan");
      setSetup2FAData(null);
      setTwoFactorToken("");
      await checkAppState();
    } catch (error) {
      toast.error(error.response?.data?.error || "Kode tidak valid");
    }
  };

  const handleDisable2FA = async () => {
    try {
      await smartApi.auth.disable2FA(twoFactorToken);
      toast.success("2FA berhasil dinonaktifkan");
      setTwoFactorToken("");
      await checkAppState();
    } catch (error) {
      toast.error(error.response?.data?.error || "Kode tidak valid");
    }
  };

  useEffect(() => {
    if (currentMosque) {
      setForm({
        name: currentMosque.name || "",
        address: currentMosque.address || "",
        city: currentMosque.city || "",
        province: currentMosque.province || "",
        phone: currentMosque.phone || "",
        email: currentMosque.email || "",
        about: currentMosque.about || "",
        established_year: currentMosque.established_year || "",
        logo_url: currentMosque.logo_url || "",
        cover_image_url: currentMosque.cover_image_url || "",
        slug: currentMosque.slug || "",
        custom_domain: currentMosque.custom_domain || "",
        instagram: currentMosque.instagram || "",
        facebook: currentMosque.facebook || "",
        youtube: currentMosque.youtube || "",
        show_financial: currentMosque.show_financial ?? false,
        primary_color: currentMosque.primary_color || "",
        timezone: currentMosque.timezone || "Asia/Jakarta",
        midtrans_server_key: currentMosque.midtrans_server_key || "",
        midtrans_client_key: currentMosque.midtrans_client_key || "",
        midtrans_environment: currentMosque.midtrans_environment || "sandbox",
        tv_show_finance: currentMosque.tv_show_finance ?? true,
        tv_show_jumat: currentMosque.tv_show_jumat ?? true,
        tv_show_activities: currentMosque.tv_show_activities ?? true,
        tv_show_announcements: currentMosque.tv_show_announcements ?? true,
        tv_show_qrcode: currentMosque.tv_show_qrcode ?? true,
        tv_live_mode: currentMosque.tv_live_mode || false,
        tv_slideshow_urls: currentMosque.tv_slideshow_urls || "",
        tv_video_url: currentMosque.tv_video_url || "",
        tv_prayer_overlay_text: currentMosque.tv_prayer_overlay_text || "Mohon matikan handphone. Luruskan dan rapatkan shaf.",
        tv_prayer_overlay_duration: currentMosque.tv_prayer_overlay_duration || 15,
        tv_background_url: currentMosque.tv_background_url || "",
        organization_structure_url: currentMosque.organization_structure_url || "",
      });
    }
  }, [currentMosque]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const cleanForm = { ...form };
    
    // Pastikan koordinat dikirim sebagai angka atau null jika kosong
    if (cleanForm.latitude === "" || cleanForm.latitude === undefined) cleanForm.latitude = null;
    else cleanForm.latitude = parseFloat(cleanForm.latitude);

    if (cleanForm.longitude === "" || cleanForm.longitude === undefined) cleanForm.longitude = null;
    else cleanForm.longitude = parseFloat(cleanForm.longitude);

    if (cleanForm.logo_url?.startsWith('data:')) cleanForm.logo_url = currentMosque.logo_url || '';
    if (cleanForm.cover_image_url?.startsWith('data:')) cleanForm.cover_image_url = currentMosque.cover_image_url || '';
    
    // Filter fields that belong to User, not Mosque to prevent Prisma unknown argument errors
    const userFields = ["pin", "currentPassword", "newPassword", "confirmPassword"];
    userFields.forEach(field => delete cleanForm[field]);

    try {
      await smartApi.entities.Mosque.update(currentMosque.id, cleanForm);
      toast.success("Pengaturan berhasil disimpan");
      await reload();
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan: " + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  }

  function copyPortfolioLink() {
    const url = `${window.location.origin}/masjid/${currentMosque.slug || currentMosque.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link disalin!");
  }

  if (loading || !currentMosque) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const canEdit = isMosqueAdmin || isAdmin;
  const portfolioUrl = `/masjid/${currentMosque.slug || currentMosque.id}`;
  const tabs = [
    { key: "info", label: "Info Masjid" },
    { key: "portfolio", label: "Halaman Publik" },
    { key: "layar_tv", label: "Layar TV" },
    { key: "jadwal", label: "Jadwal Shalat" },
    { key: "jumat", label: "Petugas Jumat" },
    ...(isMosqueAdmin || isAdmin ? [{ key: "pembayaran", label: "Pembayaran" }] : []),
    { key: "notifikasi", label: "Notifikasi" },
    { key: "subscription", label: "Langganan" },
    { key: "keamanan", label: "Keamanan Akun" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Pengaturan" description="Kelola informasi dan konfigurasi masjid" />

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-full md:w-fit overflow-x-auto no-scrollbar">
        {tabs.map(t => (
          <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === t.key ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 max-w-5xl">
        {/* INFO MASJID */}
        {activeTab === "info" && (
          <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b pb-4">
              <Settings className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Informasi Masjid</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-emerald-800">Koordinat Lokasi (GPS)</h4>
                    <p className="text-[10px] text-emerald-600">Digunakan untuk sinkronisasi jadwal shalat otomatis sesuai daerah.</p>
                  </div>
                  {canEdit && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-[10px] gap-1.5 bg-white"
                      onClick={() => {
                        if (!navigator.geolocation) return toast.error("Browser tidak mendukung geolokasi");
                        toast.loading("Mencari koordinat...");
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            setForm(f => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
                            toast.dismiss();
                            toast.success("Koordinat berhasil didapatkan!");
                          },
                          (err) => {
                            toast.dismiss();
                            toast.error("Gagal mendapatkan lokasi: " + err.message);
                          }
                        );
                      }}
                    >
                      <Navigation className="h-3 w-3" /> Ambil Lokasi Saya
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px]">Latitude</Label>
                    <Input 
                      type="number" 
                      step="any"
                      value={form.latitude || ""} 
                      onChange={e => setForm({ ...form, latitude: parseFloat(e.target.value) || "" })} 
                      disabled={!canEdit} 
                      placeholder="-6.1754"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px]">Longitude</Label>
                    <Input 
                      type="number" 
                      step="any"
                      value={form.longitude || ""} 
                      onChange={e => setForm({ ...form, longitude: parseFloat(e.target.value) || "" })} 
                      disabled={!canEdit} 
                      placeholder="106.8272"
                      className="h-9"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Logo Masjid</Label>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-slate-50 p-4 rounded-xl border border-dashed">
                  <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center border shadow-sm overflow-hidden">
                    {form.logo_url ? (
                      <img src={form.logo_url} alt="logo" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-[10px] text-muted-foreground font-bold uppercase text-center px-1">Tanpa Logo</div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex gap-2">
                       <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] hover:bg-emerald-700 transition-colors font-bold shadow-sm">
                          <Upload className="h-3 w-3" /> UPLOAD LOGO (maks 500KB)
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async e => {
                              const file = e.target.files[0];
                              if (!file) return;
                              if (file.size > 500 * 1024) return toast.error("Ukuran logo terlalu besar (Maks 500KB)");
                              toast.loading("Mengunggah logo...");
                              try {
                                const { file_url } = await smartApi.integrations.Core.UploadFile({ file });
                                setForm(f => ({ ...f, logo_url: file_url }));
                                toast.dismiss();
                                toast.success("Logo berhasil diunggah!");
                              } catch (err) {
                                toast.dismiss();
                                toast.error("Gagal upload: " + err.message);
                              }
                            }}
                          />
                       </label>
                    </div>
                    <Input 
                      value={form.logo_url || ""} 
                      onChange={e => setForm({ ...form, logo_url: e.target.value })} 
                      disabled={!canEdit} 
                      placeholder="Atau tempel Link Foto Logo di sini..." 
                      className="h-8 text-xs bg-white"
                    />
                    <p className="text-[10px] text-muted-foreground italic">Khusus logo diperbolehkan upload. Ukuran akan dibatasi.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nama Masjid</Label>
                <Input value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} disabled={!canEdit} />
              </div>
              <div className="space-y-2">
                <Label>Tentang Masjid</Label>
                <Textarea value={form.about || ""} onChange={e => setForm({ ...form, about: e.target.value })} disabled={!canEdit} rows={3} placeholder="Deskripsi singkat masjid..." />
              </div>
              <div className="space-y-2">
                <Label>Alamat</Label>
                <Textarea value={form.address || ""} onChange={e => setForm({ ...form, address: e.target.value })} disabled={!canEdit} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kota</Label>
                  <Input value={form.city || ""} onChange={e => setForm({ ...form, city: e.target.value })} disabled={!canEdit} />
                </div>
                <div className="space-y-2">
                  <Label>Provinsi</Label>
                  <Input value={form.province || ""} onChange={e => setForm({ ...form, province: e.target.value })} disabled={!canEdit} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telepon</Label>
                  <Input value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} disabled={!canEdit} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} disabled={!canEdit} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tahun Berdiri</Label>
                  <Input value={form.established_year || ""} onChange={e => setForm({ ...form, established_year: e.target.value })} disabled={!canEdit} placeholder="1985" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Warna Utama</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.primary_color || "#2d6a4f"} onChange={e => setForm({ ...form, primary_color: e.target.value })} disabled={!canEdit} className="w-10 h-9 rounded border" />
                    <Input value={form.primary_color || ""} onChange={e => setForm({ ...form, primary_color: e.target.value })} disabled={!canEdit} placeholder="#2d6a4f" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Zona Waktu</Label>
                  <select value={form.timezone || "Asia/Jakarta"} onChange={e => setForm({ ...form, timezone: e.target.value })} disabled={!canEdit}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                    {TIMEZONE_DATA.map(c => (
                      <optgroup key={c.country} label={c.country}>
                        {c.zones.map(z => (
                          <option key={z.value} value={z.value}>{z.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {canEdit && <Button type="submit" className="w-full" disabled={saving}>{saving ? "Menyimpan..." : "Simpan Informasi Masjid"}</Button>}
          </div>
        )}

        {/* JADWAL SHALAT */}
        {activeTab === "jadwal" && (
          <JadwalShalatManager mosque={currentMosque} canEdit={canEdit} />
        )}

        {/* PETUGAS JUMAT */}
        {activeTab === "jumat" && (
          <JumatOfficerManager mosque={currentMosque} canEdit={canEdit} />
        )}



        {/* PORTFOLIO TAB */}
        {activeTab === "portfolio" && (
          <div className="space-y-5">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Globe className="h-4 w-4 text-primary" /> Link Halaman Publik
              </h3>
              <div className="flex items-center gap-2">
                  {window.location.origin}/masjid/{currentMosque.slug || currentMosque.id}
                <Button type="button" size="icon" variant="outline" onClick={copyPortfolioLink}><Copy className="h-4 w-4" /></Button>
                <Link to={portfolioUrl} target="_blank">
                  <Button type="button" size="icon" variant="outline"><ExternalLink className="h-4 w-4" /></Button>
                </Link>
              </div>
            </div>

            <div className="bg-card rounded-xl border p-6 space-y-4">
              <h3 className="font-semibold">Konfigurasi Halaman Publik</h3>

              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-500" /> Tampilan Halaman Depan
                </h4>
                
                <div className="space-y-3">
                  <Label>Foto Banner Utama (Hero Image)</Label>
                  <p className="text-[10px] text-muted-foreground italic">Foto ini akan menjadi latar belakang paling atas di halaman publik masjid Bapak.</p>
                  <div className="flex flex-col gap-3">
                    {form.cover_image_url && (
                        <div className="relative w-full h-32 rounded-xl overflow-hidden border">
                          <img src={form.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div className="space-y-1.5">
                      <Input 
                        value={form.cover_image_url || ""} 
                        onChange={e => setForm({ ...form, cover_image_url: e.target.value })} 
                        placeholder="Tempel Link Foto Banner di sini (Contoh: Google Drive / Postimages)" 
                        className="h-9 text-xs bg-white"
                      />
                      <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                        <b>Tips:</b> Upload foto Bapak ke <a href="https://postimages.org" target="_blank" className="text-emerald-600 underline">postimages.org</a> lalu tempel "Direct Link"-nya di sini untuk performa terbaik.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <Label>Link Video Intro (YouTube)</Label>
                  <Input 
                    value={form.tv_video_url || ""} 
                    onChange={e => setForm({ ...form, tv_video_url: e.target.value })} 
                    placeholder="https://youtube.com/watch?v=..." 
                  />
                  <p className="text-[10px] text-muted-foreground">Video ini akan diputar sebagai perkenalan di halaman publik.</p>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <Label>Slug URL (opsional)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">/masjid/</span>
                    <Input value={form.slug || ""} onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} disabled={!canEdit} placeholder="al-ikhlas-jakarta" />
                  </div>
                  <p className="text-xs text-muted-foreground">Jika diisi, halaman bisa diakses via /masjid/[slug]</p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Tampilkan Keuangan di Halaman Publik</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Transparansi keuangan untuk jamaah</p>
                  </div>
                  <Switch checked={form.show_financial} onCheckedChange={v => setForm({ ...form, show_financial: v })} disabled={!canEdit} />
                </div>

                <div className="space-y-3">
                  <Label>Sosial Media</Label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-pink-500 text-sm w-24">Instagram</span>
                      <Input value={form.instagram || ""} onChange={e => setForm({ ...form, instagram: e.target.value })} disabled={!canEdit} placeholder="https://instagram.com/..." />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600 text-sm w-24">Facebook</span>
                      <Input value={form.facebook || ""} onChange={e => setForm({ ...form, facebook: e.target.value })} disabled={!canEdit} placeholder="https://facebook.com/..." />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-red-600 text-sm w-24">YouTube</span>
                      <Input value={form.youtube || ""} onChange={e => setForm({ ...form, youtube: e.target.value })} disabled={!canEdit} placeholder="https://youtube.com/..." />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" /> Foto Struktur Organisasi
                  </Label>
                  <p className="text-xs text-muted-foreground">Upload gambar struktur kepengurusan DKM Masjid (format PNG/JPG, maks 2MB).</p>
                  
                  <div className="space-y-3">
                    {form.organization_structure_url ? (
                      <div className="relative rounded-xl overflow-hidden border border-muted group">
                        <img
                          src={form.organization_structure_url}
                          alt="Struktur Organisasi"
                          className="w-full h-40 object-contain bg-slate-50"
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, organization_structure_url: "" })}
                            className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 text-white text-xs px-2.5 py-1 rounded-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ✕ Hapus
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-32 rounded-xl border border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/20">
                        <div className="text-center text-muted-foreground">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p className="text-xs italic">Belum ada foto struktur organisasi</p>
                        </div>
                      </div>
                    )}

                    {canEdit && (
                      <div className="flex gap-2">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-muted transition-colors font-medium flex-shrink-0">
                          <Upload className="h-4 w-4" /> Upload Foto
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async e => {
                              const file = e.target.files[0];
                              if (!file) return;
                              try {
                                const { file_url } = await smartApi.integrations.Core.UploadFile({ file });
                                setForm(f => ({ ...f, organization_structure_url: file_url }));
                                toast.success("Foto struktur berhasil diunggah");
                              } catch (err) {
                                toast.error("Gagal upload: " + err.message);
                              }
                            }}
                          />
                        </label>
                        <Input
                          value={form.organization_structure_url || ""}
                          onChange={e => setForm({ ...form, organization_structure_url: e.target.value })}
                          placeholder="Atau paste URL foto struktur..."
                          className="flex-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Domain - Restricted to Enterprise */}
            <div className="bg-card rounded-xl border p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" /> Domain Kustom
              </h3>
              
              {currentMosque?.subscription_plan === 'enterprise' ? (
                <>
                  <div className="space-y-2">
                    <Label>Domain Masjid</Label>
                    <Input
                      value={form.custom_domain || ""}
                      onChange={e => setForm({ ...form, custom_domain: e.target.value })}
                      disabled={!canEdit}
                      placeholder="masjidalikhlas.com"
                    />
                    <p className="text-xs text-muted-foreground">Masukkan domain tanpa "https://". Contoh: masjidalikhlas.com</p>
                  </div>
                  {form.custom_domain && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 space-y-2">
                      <p className="font-semibold">📋 Cara Menghubungkan Domain:</p>
                      <ol className="list-decimal list-inside space-y-1 text-xs">
                        <li>Login ke panel registrar domain Anda (GoDaddy, Niagahoster, dll.)</li>
                        <li>Buka pengaturan DNS untuk domain <strong>{form.custom_domain}</strong></li>
                        <li>Tambahkan record CNAME: <code className="bg-amber-100 px-1 rounded">www → {window.location.hostname}</code></li>
                        <li>Tunggu propagasi DNS (bisa 1-24 jam)</li>
                        <li>Hubungi tim support untuk aktivasi domain</li>
                      </ol>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-muted/30 border border-dashed rounded-xl p-6 text-center">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="h-6 w-6 text-amber-600" />
                  </div>
                  <h4 className="font-bold text-sm">Fitur Khusus Paket Enterprise</h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                    Kustom domain mandiri hanya tersedia untuk pengguna <strong>Paket Enterprise 1 Tahun</strong>. Silakan upgrade paket Anda untuk menggunakan domain sendiri.
                  </p>
                  <Button type="button" variant="link" className="mt-2 text-xs" onClick={() => setActiveTab('subscription')}>
                    Cara Upgrade →
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TV DISPLAY TAB */}
        {activeTab === "layar_tv" && (
          <div className="bg-card rounded-2xl border p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-lg">Konfigurasi Layar TV (Digital Signage)</h3>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Link Layar TV:</span>
                <code className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border">/tv/{currentMosque.slug || currentMosque.id}</code>
                <Link to={`/tv/${currentMosque.slug || currentMosque.id}`} target="_blank">
                  <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-emerald-100 text-emerald-600">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* LEFT COLUMN: Toggles & Live Mode */}
              <div className="space-y-6">
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-[1.5rem] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-500" />
                      <div>
                        <Label className="font-black text-xs uppercase tracking-wider">Mode Live (CCTV / Streaming)</Label>
                        <p className="text-[10px] text-muted-foreground mt-0.5 italic leading-relaxed">Tampilkan Live Kamera (Khatib) di layar TV.</p>
                      </div>
                    </div>
                    <Switch checked={form.tv_live_mode} onCheckedChange={v => setForm({...form, tv_live_mode: v})} disabled={!canEdit} />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold">URL Video / Live Streaming</Label>
                    <Input 
                      value={form.tv_video_url || ""} 
                      onChange={e => setForm({...form, tv_video_url: e.target.value})} 
                      placeholder="Contoh: https://www.youtube.com/watch?v=..." 
                      className="h-9 bg-white"
                      disabled={!canEdit}
                    />
                    <p className="text-[9px] text-muted-foreground leading-relaxed">
                      *Mendukung Link YouTube Live atau Direct Stream (HLS/MP4).
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-sm flex items-center gap-2 px-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Kontrol Visibilitas Informasi
                  </h4>
                  <div className="bg-slate-50/50 rounded-2xl border p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-semibold">Laporan Keuangan</Label>
                        <p className="text-[10px] text-muted-foreground">Saldo & Infaq bulanan</p>
                      </div>
                      <Switch checked={form.tv_show_finance} onCheckedChange={v => setForm({ ...form, tv_show_finance: v })} disabled={!canEdit} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-semibold">Petugas Jumat</Label>
                        <p className="text-[10px] text-muted-foreground">Khatib, Imam & Bilal</p>
                      </div>
                      <Switch checked={form.tv_show_jumat} onCheckedChange={v => setForm({ ...form, tv_show_jumat: v })} disabled={!canEdit} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-semibold">Jadwal Kegiatan & Absensi</Label>
                        <p className="text-[10px] text-muted-foreground">Kiosk absensi otomatis</p>
                      </div>
                      <Switch checked={form.tv_show_activities} onCheckedChange={v => setForm({ ...form, tv_show_activities: v })} disabled={!canEdit} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-semibold">Pengumuman Digital</Label>
                        <p className="text-[10px] text-muted-foreground">Running text & maklumat</p>
                      </div>
                      <Switch checked={form.tv_show_announcements} onCheckedChange={v => setForm({ ...form, tv_show_announcements: v })} disabled={!canEdit} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-semibold">Barcode Donasi (QRIS)</Label>
                        <p className="text-[10px] text-muted-foreground">QR Code di pojok layar</p>
                      </div>
                      <Switch checked={form.tv_show_qrcode} onCheckedChange={v => setForm({ ...form, tv_show_qrcode: v })} disabled={!canEdit} />
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Media & Overlay */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <h4 className="font-bold text-sm flex items-center gap-2 px-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Slide & Banner TV
                  </h4>
                  <div className="space-y-2">
                    <Textarea 
                      value={form.tv_slideshow_urls || ""} 
                      onChange={e => setForm({ ...form, tv_slideshow_urls: e.target.value })} 
                      disabled={!canEdit} 
                      rows={3} 
                      className="bg-white text-xs rounded-xl"
                      placeholder="https://example.com/banner1.jpg, https://example.com/banner2.png" 
                    />
                    <p className="text-[10px] text-muted-foreground leading-relaxed italic">Pisahkan link gambar dengan koma (,).</p>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <h4 className="font-bold text-sm flex items-center gap-2 px-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Mode Waktu Shalat (Full Overlay)
                  </h4>
                  <div className="bg-slate-50/50 rounded-2xl border p-5 space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold">Pesan Himbauan</Label>
                      <Input 
                        value={form.tv_prayer_overlay_text || ""} 
                        onChange={e => setForm({ ...form, tv_prayer_overlay_text: e.target.value })} 
                        disabled={!canEdit} 
                        className="h-9 bg-white"
                        placeholder="Mohon matikan handphone. Luruskan dan rapatkan shaf." 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-bold">Durasi Layar Penuh (Menit)</Label>
                      <Input 
                        type="number"
                        value={form.tv_prayer_overlay_duration || ""} 
                        onChange={e => setForm({ ...form, tv_prayer_overlay_duration: parseInt(e.target.value) || 0 })} 
                        disabled={!canEdit} 
                        className="h-9 bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <h4 className="font-bold text-sm flex items-center gap-2 px-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Background Layar TV
                  </h4>
                  <div className="space-y-3">
                    {form.tv_background_url ? (
                      <div className="relative rounded-[1.5rem] overflow-hidden border group aspect-video bg-black shadow-lg">
                        <img src={form.tv_background_url} alt="BG TV" className="w-full h-full object-cover opacity-60 transition-opacity group-hover:opacity-40" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <p className="text-white text-[10px] font-bold uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md">Preview Background</p>
                        </div>
                        {canEdit && (
                          <button type="button" onClick={() => setForm({ ...form, tv_background_url: "" })}
                            className="absolute top-3 right-3 bg-red-500 text-white w-8 h-8 flex items-center justify-center rounded-full shadow-lg hover:bg-red-600 transition-colors z-10">✕</button>
                        )}
                      </div>
                    ) : (
                      <div className="w-full aspect-video rounded-[1.5rem] border border-dashed flex flex-col items-center justify-center bg-slate-50 text-muted-foreground border-slate-300">
                        <Sparkles className="h-8 w-8 mb-2 opacity-20" />
                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Background Default (Gradien Gelap)</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] hover:bg-slate-100 transition-colors font-black uppercase bg-white shadow-sm shrink-0">
                        <Upload className="h-3.5 w-3.5" /> Upload
                        <input type="file" accept="image/*" className="hidden" onChange={async e => {
                          const file = e.target.files[0];
                          if (!file) return;
                          toast.loading("Mengunggah Background...");
                          try {
                            const { file_url } = await smartApi.integrations.Core.UploadFile({ file });
                            setForm(f => ({ ...f, tv_background_url: file_url }));
                            toast.dismiss(); toast.success("Background diperbarui!");
                          } catch (err) { toast.dismiss(); toast.error(err.message); }
                        }} />
                      </label>
                      <Input value={form.tv_background_url || ""} onChange={e => setForm({ ...form, tv_background_url: e.target.value })}
                        placeholder="Atau tempel Link URL Foto..." className="h-10 bg-white text-xs rounded-xl shadow-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PEMBAYARAN TAB */}
        {activeTab === "pembayaran" && (isMosqueAdmin || isAdmin) && (
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-primary" /> Konfigurasi Midtrans
            </h3>
            <p className="text-sm text-muted-foreground mb-4">Hubungkan akun Midtrans untuk menerima pembayaran online (donasi, registrasi kegiatan, dll)</p>
            
            <div className="space-y-2">
              <Label>Environment</Label>
              <select value={form.midtrans_environment || "sandbox"} onChange={e => setForm({ ...form, midtrans_environment: e.target.value })} disabled={!canEdit}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm">
                <option value="sandbox">Sandbox (Testing)</option>
                <option value="production">Production (Live)</option>
              </select>
              <p className="text-xs text-muted-foreground">Gunakan Sandbox untuk testing, Production untuk transaksi nyata</p>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Label>Midtrans Server Key</Label>
              <Input 
                type="password" 
                value={form.midtrans_server_key || ""} 
                onChange={e => setForm({ ...form, midtrans_server_key: e.target.value })} 
                disabled={!canEdit}
                placeholder="SB-Mid-server-xxxxx atau Mid-server-xxxxx"
              />
              <p className="text-xs text-muted-foreground">Gunakan untuk API server-to-server (jangan dishare publik)</p>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Label>Midtrans Client Key</Label>
              <Input 
                value={form.midtrans_client_key || ""} 
                onChange={e => setForm({ ...form, midtrans_client_key: e.target.value })} 
                disabled={!canEdit}
                placeholder="SB-Mid-client-xxxxx atau Mid-client-xxxxx"
              />
              <p className="text-xs text-muted-foreground">Digunakan untuk Snap.js (boleh publik)</p>
            </div>

            {form.midtrans_client_key && form.midtrans_server_key && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-800">
                <p className="font-semibold">✓ Midtrans sudah dikonfigurasi</p>
                <p className="text-xs mt-1">Fitur pembayaran online sudah aktif untuk donasi dan registrasi kegiatan</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 space-y-2">
              <p className="font-semibold">📖 Cara Mendapatkan Keys Midtrans:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Login ke <a href="https://dashboard.midtrans.com" target="_blank" rel="noopener" className="underline font-semibold">dashboard.midtrans.com</a></li>
                <li>Pilih environment (Sandbox untuk testing)</li>
                <li>Buka menu Settings → Access Keys</li>
                <li>Copy Server Key dan Client Key</li>
                <li>Paste di form di atas dan simpan</li>
              </ol>
            </div>
          </div>
        )}

        {/* NOTIFIKASI TAB */}
        {activeTab === "notifikasi" && (
          <NotificationSettings />
        )}

        {/* SUBSCRIPTION TAB */}
        {activeTab === "subscription" && (
          <div className="bg-card rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Informasi Langganan</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Paket</p>
                <p className="font-medium capitalize">{currentMosque.subscription_plan || 'Trial'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge variant={currentMosque.subscription_status === 'active' ? 'default' : 'secondary'}>
                  {currentMosque.subscription_status || 'Trial'}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Mulai</p>
                <p className="font-medium">{currentMosque.subscription_start ? new Date(currentMosque.subscription_start).toLocaleDateString('id-ID') : '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Berakhir</p>
                <p className="font-medium">{currentMosque.subscription_end ? new Date(currentMosque.subscription_end).toLocaleDateString('id-ID') : '-'}</p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/20 text-sm">
              <p className="font-semibold text-primary mb-1">Upgrade Paket</p>
              <p className="text-muted-foreground">Untuk upgrade langganan atau perpanjangan, hubungi tim MasjidKu.</p>
            </div>
          </div>
        )}

        {/* KEAMANAN TAB */}
        {activeTab === "keamanan" && (
          <div className="bg-card rounded-xl border p-6 space-y-8">
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <KeyRound className="h-5 w-5 text-primary" /> Ganti Password
              </h3>
              <div className="space-y-4 max-w-sm">
                <div className="space-y-2">
                  <Label>Password Saat Ini</Label>
                  <Input 
                    type="password" 
                    value={form.currentPassword || ""} 
                    onChange={e => setForm({...form, currentPassword: e.target.value})} 
                    placeholder="Masukkan password saat ini" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password Baru</Label>
                  <Input 
                    type="password" 
                    value={form.newPassword || ""} 
                    onChange={e => setForm({...form, newPassword: e.target.value})} 
                    placeholder="Masukkan password baru" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Konfirmasi Password Baru</Label>
                  <Input 
                    type="password" 
                    value={form.confirmPassword || ""} 
                    onChange={e => setForm({...form, confirmPassword: e.target.value})} 
                    placeholder="Ulangi password baru" 
                  />
                </div>
                <Button 
                  type="button" 
                  onClick={async () => {
                    if (!form.currentPassword || !form.newPassword) {
                      toast.error("Semua field password wajib diisi");
                      return;
                    }
                    if (form.newPassword !== form.confirmPassword) {
                      toast.error("Konfirmasi password tidak cocok");
                      return;
                    }
                    if (form.newPassword.length < 6) {
                      toast.error("Password baru minimal 6 karakter");
                      return;
                    }
                    setSaving(true);
                    try {
                      await smartApi.auth.changePassword(form.currentPassword, form.newPassword);
                      toast.success("Password berhasil diubah");
                      setForm({...form, currentPassword: "", newPassword: "", confirmPassword: ""});
                    } catch (error) {
                      toast.error(error.response?.data?.error || "Gagal mengubah password");
                    }
                    setSaving(false);
                  }}
                  disabled={saving}
                >
                  {saving ? "Menyimpan..." : "Ganti Password"}
                </Button>
              </div>
            </div>

            <div className="pt-8 border-t">
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" /> PIN Safeti Konfirmasi
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                PIN ini akan diminta sebagai konfirmasi setiap kali Bapak melakukan aksi krusial (Hapus, Edit, Simpan) untuk mencegah kesalahan klik.
              </p>
              
              <div className="space-y-4 max-w-sm">
                <div className="space-y-2">
                  <Label>PIN Keamanan (4-6 Digit)</Label>
                  <Input 
                    type="password" 
                    placeholder="Masukkan PIN baru Bapak..."
                    value={form.pin || ""}
                    onChange={e => setForm({...form, pin: e.target.value})}
                    maxLength={6}
                    className="text-xl font-mono tracking-widest"
                  />
                  <p className="text-[10px] text-muted-foreground italic">
                    {user?.pin ? "✅ PIN sudah terpasang. Bapak bisa mengubahnya di sini." : "⚠️ Bapak belum menyetelan PIN Safeti."}
                  </p>
                </div>
                
                <Button 
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    if (!form.pin || form.pin.length < 4) {
                      toast.error("PIN minimal 4 digit angka");
                      return;
                    }
                    setSaving(true);
                    try {
                      const updatedUser = await smartApi.auth.updateMe({ pin: form.pin });
                      if (updateUser) updateUser(updatedUser);
                      toast.success("✅ PIN Safeti Smart Berhasil Disimpan!");
                      setForm({...form, pin: ""});
                    } catch (err) {
                      toast.error("Gagal menyimpan PIN: " + err.message);
                    }
                    setSaving(false);
                  }}
                  className="border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Simpan PIN Keamanan
                </Button>
              </div>
            </div>

            <hr className="border-muted" />

            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <ShieldCheck className="h-5 w-5 text-primary" /> Autentikasi Dua Faktor (2FA)
              </h3>
              <div className="bg-slate-50 border p-4 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                  <div>
                    <h4 className="font-medium text-slate-800">Autentikasi Dua Faktor (2FA)</h4>
                    <p className="text-sm text-slate-500 mt-1">
                      Tambahkan lapisan keamanan ekstra ke akun Anda menggunakan aplikasi Authenticator.
                    </p>
                  </div>
                  <Badge className="w-fit" variant={user?.two_factor_enabled ? "default" : "secondary"}>
                    {user?.two_factor_enabled ? "Aktif" : "Tidak Aktif"}
                  </Badge>
                </div>

                {!user?.two_factor_enabled ? (
                  <div className="space-y-4">
                    {!setup2FAData ? (
                      <Button type="button" onClick={handleSetup2FA}>Mulai Setup 2FA</Button>
                    ) : (
                      <div className="bg-white p-4 border rounded-xl space-y-4">
                        <p className="text-sm font-medium">1. Scan QR Code ini dengan aplikasi Authenticator (Google Authenticator, Authy, dll.)</p>
                        <div className="bg-slate-100 p-4 rounded-lg inline-block">
                          <img src={setup2FAData.qrCode} alt="QR Code" className="w-48 h-48 mx-auto" />
                        </div>
                        <p className="text-xs text-muted-foreground">Key Manual: <code className="bg-muted px-1 rounded">{setup2FAData.secret}</code></p>
                        
                        <div className="pt-4 border-t">
                          <p className="text-sm font-medium mb-2">2. Masukkan 6-digit kode OTP</p>
                          <div className="flex gap-2">
                            <Input 
                              value={twoFactorToken} 
                              onChange={e => setTwoFactorToken(e.target.value.replace(/\D/g,''))} 
                              placeholder="123456" 
                              maxLength={6} 
                              className="w-32 tracking-widest text-center" 
                            />
                            <Button type="button" onClick={handleEnable2FA} disabled={twoFactorToken.length !== 6}>Aktifkan</Button>
                            <Button type="button" variant="outline" onClick={() => { setSetup2FAData(null); setTwoFactorToken(""); }}>Batal</Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 bg-white p-4 border rounded-xl">
                    <p className="text-sm border-b pb-3 mb-3 text-slate-600">Untuk menonaktifkan 2FA, masukkan kode Authenticator Anda saat ini.</p>
                    <div className="flex gap-2">
                      <Input 
                        value={twoFactorToken} 
                        onChange={e => setTwoFactorToken(e.target.value.replace(/\D/g,''))} 
                        placeholder="123456" 
                        maxLength={6} 
                        className="w-32 tracking-widest text-center" 
                      />
                      <Button type="button" variant="destructive" onClick={handleDisable2FA} disabled={twoFactorToken.length !== 6}>Nonaktifkan 2FA</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {canEdit && activeTab !== "keamanan" && (
          <Button type="submit" disabled={saving} className="gap-2">
            <Save className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        )}
      </form>
    </div>
  );
}

function JadwalShalatManager({ mosque, canEdit }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadData();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [mosque.id]);

  async function loadData() {
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    try {
      const list = await smartApi.entities.PrayerTime.filter({ mosque_id: mosque.id, created_date: today });
      if (list.length > 0) {
        setData(list[0]);
        setIsNew(false);
      } else {
        // Jika data belum ada hari ini, coba sinkron otomatis dulu via API filter (backend akan fetch otomatis jika kita panggil)
        const res = await smartApi.entities.PrayerTime.filter({ mosque_id: mosque.id });
        const list2 = await smartApi.entities.PrayerTime.filter({ mosque_id: mosque.id, created_date: today });
        if (list2.length > 0) {
          setData(list2[0]);
          setIsNew(false);
        } else {
          setData({ mosque_id: mosque.id, subuh: "04:30", dzuhur: "12:00", ashar: "15:15", maghrib: "18:00", isya: "19:15", created_date: today });
          setIsNew(true);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    toast.loading("Mensinkronkan dengan Kemenag RI...");
    try {
      const today = new Date().toISOString().slice(0, 10);
      // Panggil filter lagi dengan params hari ini untuk memicu auto-sync backend
      const list = await smartApi.entities.PrayerTime.filter({ mosque_id: mosque.id, created_date: today });
      if (list.length > 0) {
        setData(list[0]);
        setIsNew(false);
        toast.dismiss();
        toast.success("Jadwal hari ini berhasil diperbarui");
      }
    } catch (e) {
      toast.dismiss();
      toast.error("Gagal sinkronisasi otomatis");
    }
  }

  async function handleSaveLocal() {
    if (!canEdit) return;
    setSaving(true);
    try {
      if (isNew) {
        const res = await smartApi.entities.PrayerTime.create(data);
        setData(res);
        setIsNew(false);
      } else {
        await smartApi.entities.PrayerTime.update(data.id, data);
      }
      toast.success("Jadwal manual berhasil disimpan");
    } catch (e) {
      toast.error("Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-center py-20 opacity-50"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-2" />Memuat jadwal...</div>;
  if (!data) return <div className="p-10 text-center">Gagal memuat data jadwal.</div>;

  return (
    <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-800 p-6 text-white text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Konfigurasi Jadwal</p>
        <h3 className="text-2xl font-black">Waktu Shalat Hari Ini</h3>
        <p className="text-xs opacity-70 mt-1">{currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="flex items-stretch justify-between gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
          <div className="flex-1">
            <h4 className="text-sm font-bold text-emerald-900 flex items-center gap-2 italic">
              <Sparkles className="h-4 w-4 text-emerald-500" /> Sinkronisasi Otomatis Aktif
            </h4>
            <p className="text-[10px] text-emerald-600 mt-1 leading-relaxed">
              Sistem akan otomatis mengambil jadwal dari Kemenag RI setiap hari berdasarkan lokasi GPS masjid Anda.
            </p>
          </div>
          {canEdit && (
            <Button type="button" variant="outline" size="sm" onClick={handleSync} className="h-full px-4 bg-white font-bold gap-2 text-xs border-emerald-200 hover:bg-emerald-50">
              Sinkronkan Sekarang
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'].map(key => (
            <div key={key} className="space-y-2 p-3 bg-muted/30 border rounded-xl group hover:border-primary/50 transition-colors">
              <Label className="flex justify-between items-center capitalize font-black text-[10px] tracking-widest text-muted-foreground group-hover:text-primary">
                {key}
              </Label>
              <Input 
                type="text" 
                value={data[key] || ""} 
                onChange={e => setData({ ...data, [key]: e.target.value })} 
                disabled={!canEdit}
                placeholder="00:00"
                className="font-bold text-lg h-10 bg-white text-center"
              />
            </div>
          ))}
        </div>

        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex gap-3 italic">
          <Settings className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <p className="text-[10px] text-amber-700 leading-normal">
            <b>Catatan:</b> Anda dapat menyesuaikan jadwal di atas secara manual jika terdapat selisih menit. Tekan "Simpan Jadwal Manual" untuk menetapkan waktu pilihan Anda.
          </p>
        </div>

        {canEdit && (
          <Button type="button" onClick={handleSaveLocal} className="w-full h-12 font-black tracking-widest shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
            {saving ? "Menyimpan..." : "SIMPAN JADWAL MANUAL"}
          </Button>
        )}
      </div>
    </div>
  );
}

function getNextFriday() {
  const d = new Date();
  const day = d.getDay();
  const diff = (5 - day + 7) % 7 || 7;
  const next = new Date(d);
  next.setDate(d.getDate() + diff);
  return next.toISOString().split('T')[0];
}

function JumatOfficerManager({ mosque, canEdit }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ imam: '', khatib: '', muadzin: '', bilal: '', notes: '', jumat_date: getNextFriday() });
  const [saving, setSaving] = useState(false);
  const [id, setId] = useState(null);

  useEffect(() => { loadData(); }, [mosque.id]);

  async function loadData() {
    setLoading(true);
    try {
      const list = await smartApi.entities.JumatOfficer.filter({ mosque_id: mosque.id }, '-jumat_date', 1);
      if (list.length > 0) {
        setData(list[0]);
        setId(list[0].id);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    if (!canEdit) return;
    setSaving(true);
    try {
      if (id) await smartApi.entities.JumatOfficer.update(id, { ...data, mosque_id: mosque.id });
      else {
        const res = await smartApi.entities.JumatOfficer.create({ ...data, mosque_id: mosque.id });
        setId(res.id);
      }
      toast.success("Petugas Jumat berhasil disimpan");
    } catch (e) { toast.error("Gagal menyimpan"); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="text-center py-10 opacity-50"><div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-2" />Memuat Petugas...</div>;

  return (
    <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <Users className="h-5 w-5 text-emerald-600" />
        <h3 className="font-bold">Pengaturan Petugas Shalat Jumat</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 space-y-2">
            <Label>Tanggal Hari Jumat</Label>
            <Input type="date" value={data.jumat_date?.split('T')[0] || ""} onChange={e => setData({...data, jumat_date: e.target.value})} disabled={!canEdit} />
        </div>
        {[
          { key: 'imam', label: 'Imam' },
          { key: 'khatib', label: 'Khatib' },
          { key: 'muadzin', label: 'Muadzin' },
          { key: 'bilal', label: 'Bilal' }
        ].map(off => (
          <div key={off.key} className="space-y-2">
            <Label>{off.label}</Label>
            <Input value={data[off.key] || ""} onChange={e => setData({...data, [off.key]: e.target.value})} placeholder={`Nama ${off.label}`} disabled={!canEdit} />
          </div>
        ))}
        <div className="md:col-span-2 space-y-2">
            <Label>Catatan / Maklumat</Label>
            <Textarea value={data.notes || ""} onChange={e => setData({...data, notes: e.target.value})} placeholder="Catatan untuk petugas atau pengumuman jumat..." disabled={!canEdit} />
        </div>
      </div>

      {canEdit && <Button type="button" onClick={handleSave} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold italic tracking-tighter uppercase h-12 shadow-lg shadow-emerald-500/20">{saving ? "Menyimpan..." : "SIMPAN DATA PETUGAS"}</Button>}
    </div>
  )
}
