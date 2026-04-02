import { useState, useEffect } from "react";
import { base44 } from "@/api/apiClient";
import { useMosqueContext } from "@/lib/useMosqueContext";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "../components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Settings, Save, Globe, ExternalLink, Copy, Upload, ShieldCheck } from "lucide-react";
import NotificationSettings from "../components/NotificationSettings";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function Pengaturan() {
  const { currentMosque, loading, isMosqueAdmin, isAdmin, reload } = useMosqueContext();
  const { user, checkAppState } = useAuth();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [setup2FAData, setSetup2FAData] = useState(null);

  const handleSetup2FA = async () => {
    try {
      const data = await base44.auth.generate2FA();
      setSetup2FAData(data);
    } catch (error) {
      toast.error("Gagal menyiapkan 2FA");
    }
  };

  const handleEnable2FA = async () => {
    try {
      await base44.auth.enable2FA(twoFactorToken);
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
      await base44.auth.disable2FA(twoFactorToken);
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
        tv_slideshow_urls: currentMosque.tv_slideshow_urls || "",
        tv_video_url: currentMosque.tv_video_url || "",
        tv_prayer_overlay_text: currentMosque.tv_prayer_overlay_text || "Mohon matikan handphone. Luruskan dan rapatkan shaf.",
        tv_prayer_overlay_duration: currentMosque.tv_prayer_overlay_duration || 15,
      });
    }
  }, [currentMosque]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const cleanForm = { ...form };
    if (cleanForm.logo_url?.startsWith('data:')) cleanForm.logo_url = currentMosque.logo_url || '';
    if (cleanForm.cover_image_url?.startsWith('data:')) cleanForm.cover_image_url = currentMosque.cover_image_url || '';
    await base44.entities.Mosque.update(currentMosque.id, cleanForm);
    toast.success("Pengaturan berhasil disimpan");
    await reload();
    setSaving(false);
  }

  function copyPortfolioLink() {
    const url = `${window.location.origin}/masjid/${currentMosque.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link disalin!");
  }

  if (loading || !currentMosque) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const canEdit = isMosqueAdmin || isAdmin;
  const portfolioUrl = `/masjid/${currentMosque.id}`;
  const tabs = [
    { key: "info", label: "Info Masjid" },
    { key: "portfolio", label: "Halaman Publik" },
    { key: "layar_tv", label: "Layar TV" },
    ...(isMosqueAdmin || isAdmin ? [{ key: "pembayaran", label: "Pembayaran" }] : []),
    { key: "notifikasi", label: "Notifikasi" },
    { key: "subscription", label: "Langganan" },
    { key: "keamanan", label: "Keamanan Akun" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Pengaturan" description="Kelola informasi dan konfigurasi masjid" />

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === t.key ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="max-w-2xl space-y-6">

        {/* INFO TAB */}
        {activeTab === "info" && (
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Informasi Masjid</h3>
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
                <Input value={form.established_year || ""} onChange={e => setForm({ ...form, established_year: e.target.value })} disabled={!canEdit} placeholder="contoh: 1985" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Logo Masjid</Label>
              <p className="text-xs text-muted-foreground">Ukuran ideal: 200×200 px (format PNG/JPG, maks 500KB)</p>
              <div className="flex gap-2 items-center">
                {form.logo_url && <img src={form.logo_url} alt="logo" className="w-12 h-12 rounded-lg object-cover border" />}
                <Input value={form.logo_url || ""} onChange={e => setForm({ ...form, logo_url: e.target.value })} disabled={!canEdit} placeholder="https://... atau upload di bawah" />
              </div>
              {canEdit && (
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm hover:bg-muted transition-colors">
                    <Upload className="h-4 w-4" /> Upload Logo
                    <input type="file" accept="image/*" className="hidden" onChange={async e => {
                      const file = e.target.files[0]; if (!file) return;
                      const { file_url } = await base44.integrations.Core.UploadFile({ file });
                      setForm(f => ({ ...f, logo_url: file_url }));
                    }} />
                  </label>
                  <span className="text-xs text-muted-foreground">atau tempel link URL</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Foto Sampul / Hero</Label>
              <p className="text-xs text-muted-foreground">Ukuran ideal: 1200×400 px (format PNG/JPG, maks 2MB)</p>
              <div className="space-y-2">
                {form.cover_image_url && <img src={form.cover_image_url} alt="cover" className="w-full h-28 rounded-lg object-cover border" />}
                <Input value={form.cover_image_url || ""} onChange={e => setForm({ ...form, cover_image_url: e.target.value })} disabled={!canEdit} placeholder="https://... atau upload di bawah" />
              </div>
              {canEdit && (
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm hover:bg-muted transition-colors">
                  <Upload className="h-4 w-4" /> Upload Foto Sampul
                  <input type="file" accept="image/*" className="hidden" onChange={async e => {
                    const file = e.target.files[0]; if (!file) return;
                    const { file_url } = await base44.integrations.Core.UploadFile({ file });
                    setForm(f => ({ ...f, cover_image_url: file_url }));
                  }} />
                </label>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Warna Utama Masjid</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.primary_color || "#2d6a4f"} onChange={e => setForm({ ...form, primary_color: e.target.value })} disabled={!canEdit} className="w-10 h-9 rounded border cursor-pointer" />
                  <Input value={form.primary_color || ""} onChange={e => setForm({ ...form, primary_color: e.target.value })} disabled={!canEdit} placeholder="#2d6a4f" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Zona Waktu</Label>
                <select value={form.timezone || "Asia/Jakarta"} onChange={e => setForm({ ...form, timezone: e.target.value })} disabled={!canEdit}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm">
                  <option value="Asia/Jakarta">WIB (Jakarta)</option>
                  <option value="Asia/Makassar">WITA (Makassar)</option>
                  <option value="Asia/Jayapura">WIT (Jayapura)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* PORTFOLIO TAB */}
        {activeTab === "portfolio" && (
          <div className="space-y-5">
            {/* Portfolio Link */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Globe className="h-4 w-4 text-primary" /> Link Halaman Publik
              </h3>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-card border rounded-lg px-3 py-2 text-sm text-muted-foreground truncate">
                  {window.location.origin}/masjid/{currentMosque.id}
                </code>
                <Button type="button" size="icon" variant="outline" onClick={copyPortfolioLink}><Copy className="h-4 w-4" /></Button>
                <Link to={portfolioUrl} target="_blank">
                  <Button type="button" size="icon" variant="outline"><ExternalLink className="h-4 w-4" /></Button>
                </Link>
              </div>
            </div>

            <div className="bg-card rounded-xl border p-6 space-y-4">
              <h3 className="font-semibold">Konfigurasi Halaman Publik</h3>

              <div className="space-y-2">
                <Label>Slug URL (opsional)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">/masjid/</span>
                  <Input value={form.slug || ""} onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} disabled={!canEdit} placeholder="al-ikhlas-jakarta" />
                </div>
                <p className="text-xs text-muted-foreground">Jika diisi, halaman bisa diakses via /masjid/[slug]</p>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Tampilkan Keuangan di Halaman Publik</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Transparansi keuangan untuk jamaah</p>
                  </div>
                  <Switch checked={form.show_financial} onCheckedChange={v => setForm({ ...form, show_financial: v })} disabled={!canEdit} />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
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
            </div>

            {/* Custom Domain */}
            <div className="bg-card rounded-xl border p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" /> Domain Kustom
              </h3>
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
                    <li>Atau tambahkan record A: arahkan ke IP server MasjidKu</li>
                    <li>Tunggu propagasi DNS (bisa 1-24 jam)</li>
                    <li>Hubungi tim support untuk aktivasi domain</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TV DISPLAY TAB */}
        {activeTab === "layar_tv" && (
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-primary" /> Konfigurasi Layar TV
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Tampilkan Laporan Keuangan</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Munculkan total saldo dan pemasukan bulan ini</p>
                </div>
                <Switch checked={form.tv_show_finance} onCheckedChange={v => setForm({ ...form, tv_show_finance: v })} disabled={!canEdit} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Tampilkan Petugas Jumat</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Munculkan area petugas Jumat terdekat</p>
                </div>
                <Switch checked={form.tv_show_jumat} onCheckedChange={v => setForm({ ...form, tv_show_jumat: v })} disabled={!canEdit} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Tampilkan Kegiatan</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Munculkan jadwal kegiatan mendatang</p>
                </div>
                <Switch checked={form.tv_show_activities} onCheckedChange={v => setForm({ ...form, tv_show_activities: v })} disabled={!canEdit} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Tampilkan Pengumuman</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Munculkan pesan pengumuman publik</p>
                </div>
                <Switch checked={form.tv_show_announcements} onCheckedChange={v => setForm({ ...form, tv_show_announcements: v })} disabled={!canEdit} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Tampilkan Barcode Donasi QRIS</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Tampilkan QRCode di pojok layar TV</p>
                </div>
                <Switch checked={form.tv_show_qrcode} onCheckedChange={v => setForm({ ...form, tv_show_qrcode: v })} disabled={!canEdit} />
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label>Slide Gambar / Banner TV (Link URL)</Label>
              <Textarea 
                value={form.tv_slideshow_urls || ""} 
                onChange={e => setForm({ ...form, tv_slideshow_urls: e.target.value })} 
                disabled={!canEdit} 
                rows={3} 
                placeholder="https://example.com/banner1.jpg, https://example.com/banner2.png" 
              />
              <p className="text-xs text-muted-foreground">Pisahkan link gambar dengan koma (,). Kami menyarankan menggunakan link (contoh Google Drive atau Postimages) untuk menghemat storage.</p>
            </div>

            <div className="space-y-2 pt-2">
              <Label>Video Rekaman (Link YouTube MP4)</Label>
              <Input 
                value={form.tv_video_url || ""} 
                onChange={e => setForm({ ...form, tv_video_url: e.target.value })} 
                disabled={!canEdit} 
                placeholder="https://youtube.com/watch?v=..." 
              />
              <p className="text-xs text-muted-foreground">URL YouTube untuk diputar otomatis di TV saat tidak ada slide.</p>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold text-sm">Mode Saat Waktu Shalat Tiba</h4>
              <p className="text-xs text-muted-foreground mb-2">Seluruh layar TV akan tertutup pesan ini dan jadwal shalat saat waktu adzan tiba, menyembunyikan laporan atau kegiatan secara otomatis.</p>
              
              <div className="space-y-2">
                <Label>Pesan Himbauan (Fullscreen)</Label>
                <Input 
                  value={form.tv_prayer_overlay_text || ""} 
                  onChange={e => setForm({ ...form, tv_prayer_overlay_text: e.target.value })} 
                  disabled={!canEdit} 
                  placeholder="Mohon matikan handphone. Luruskan dan rapatkan shaf." 
                />
              </div>

              <div className="space-y-2">
                <Label>Durasi Layar Penuh (Menit)</Label>
                <Input 
                  type="number"
                  value={form.tv_prayer_overlay_duration || ""} 
                  onChange={e => setForm({ ...form, tv_prayer_overlay_duration: parseInt(e.target.value) || 0 })} 
                  disabled={!canEdit} 
                />
                <p className="text-xs text-muted-foreground">Setelah durasi ini habis, layar TV akan kembali normal ke tampilan awal.</p>
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
          <div className="bg-card rounded-xl border p-6 space-y-6">
            <h3 className="font-semibold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Keamanan Akun
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