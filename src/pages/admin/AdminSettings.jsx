import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Settings } from "lucide-react";

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState("branding");
  const [form, setForm] = useState({
    app_name: "", app_tagline: "", logo_url: "", primary_color: "",
    hero_image_url: "", contact_email: "", contact_phone: "",
    price_monthly: "", whatsapp_number: "",
    midtrans_server_key: "", midtrans_client_key: "", midtrans_environment: "sandbox"
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    smartApi.entities.AppSettings.list().then(data => {
      if (data.length > 0) {
        setSettings(data[0]);
        setForm({ ...data[0] });
      }
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    if (settings?.id) {
      await smartApi.entities.AppSettings.update(settings.id, form);
    } else {
      const created = await smartApi.entities.AppSettings.create(form);
      setSettings(created);
    }
    setSaving(false);
    toast.success("Pengaturan tersimpan");
  };

  const fields = [
    { key: "app_name", label: "Nama Aplikasi" },
    { key: "app_tagline", label: "Tagline" },
    { key: "contact_email", label: "Email Kontak" },
    { key: "contact_phone", label: "Telepon Kontak" },
    { key: "price_monthly", label: "Harga Tahunan (Rp)" },
    { key: "whatsapp_number", label: "Nomor WhatsApp" },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader title="Pengaturan Aplikasi" description="Konfigurasi branding, harga, dan pembayaran platform" />
      
      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit mb-6">
        <button onClick={() => setActiveTab("branding")} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === "branding" ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Branding</button>
        <button onClick={() => setActiveTab("pembayaran")} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === "pembayaran" ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Pembayaran</button>
      </div>

      {/* BRANDING TAB */}
      {activeTab === "branding" && (
      <div className="bg-card rounded-xl border p-6 space-y-4">
        {/* Logo Upload */}
        <div>
          <Label>Logo Aplikasi</Label>
          <p className="text-xs text-muted-foreground mb-2">Ukuran ideal: 200×200 px (PNG/JPG, maks 500KB)</p>
          <div className="flex items-center gap-3">
            {form.logo_url && <img src={form.logo_url} alt="logo" className="w-12 h-12 rounded-lg object-cover border" />}
            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm hover:bg-muted transition-colors">
              <Upload className="h-4 w-4" /> Upload Logo
              <input type="file" accept="image/*" className="hidden" onChange={async e => {
                const file = e.target.files[0]; if (!file) return;
                const { file_url } = await smartApi.integrations.Core.UploadFile({ file });
                setForm(f => ({ ...f, logo_url: file_url }));
              }} />
            </label>
            <span className="text-xs text-muted-foreground">atau</span>
            <Input className="flex-1" value={form.logo_url || ""} onChange={e => setForm(p => ({ ...p, logo_url: e.target.value }))} placeholder="URL logo..." />
          </div>
        </div>

        {/* Hero Image Upload */}
        <div>
          <Label>Gambar Hero Landing Page</Label>
          <p className="text-xs text-muted-foreground mb-2">Ukuran ideal: 1200×600 px (PNG/JPG, maks 2MB)</p>
          <div className="space-y-2">
            {form.hero_image_url && <img src={form.hero_image_url} alt="hero" className="w-full h-32 rounded-lg object-cover border" />}
            <div className="flex gap-2">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm hover:bg-muted transition-colors">
                <Upload className="h-4 w-4" /> Upload Hero
                <input type="file" accept="image/*" className="hidden" onChange={async e => {
                  const file = e.target.files[0]; if (!file) return;
                  const { file_url } = await smartApi.integrations.Core.UploadFile({ file });
                  setForm(f => ({ ...f, hero_image_url: file_url }));
                }} />
              </label>
              <Input className="flex-1" value={form.hero_image_url || ""} onChange={e => setForm(p => ({ ...p, hero_image_url: e.target.value }))} placeholder="URL hero image..." />
            </div>
          </div>
        </div>

        {/* Warna Utama */}
        <div>
          <Label>Warna Utama Aplikasi</Label>
          <div className="flex items-center gap-2 mt-1">
            <input type="color" value={form.primary_color || "#2d6a4f"} onChange={e => setForm(p => ({ ...p, primary_color: e.target.value }))} className="w-10 h-9 rounded border cursor-pointer" />
            <Input className="flex-1" value={form.primary_color || ""} onChange={e => setForm(p => ({ ...p, primary_color: e.target.value }))} placeholder="#2d6a4f" />
          </div>
        </div>

        {fields.map(f => (
          <div key={f.key}>
            <Label>{f.label}</Label>
            <Input
              className="mt-1"
              value={form[f.key] || ""}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
            />
          </div>
        ))}
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Menyimpan..." : "Simpan Pengaturan"}
        </Button>
      </div>
      )}

      {/* PEMBAYARAN TAB */}
      {activeTab === "pembayaran" && (
      <div className="bg-card rounded-xl border p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-primary" /> Konfigurasi Midtrans (Global)
        </h3>
        <p className="text-sm text-muted-foreground mb-4">Konfigurasi API Midtrans global untuk semua masjid. Setiap masjid juga bisa override dengan kredensial mereka sendiri.</p>
        
        <div className="space-y-2">
          <Label>Environment</Label>
          <select value={form.midtrans_environment || "sandbox"} onChange={e => setForm({ ...form, midtrans_environment: e.target.value })}
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
            placeholder="SB-Mid-server-xxxxx atau Mid-server-xxxxx"
          />
          <p className="text-xs text-muted-foreground">Gunakan untuk API server-to-server (jangan dishare publik)</p>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <Label>Midtrans Client Key</Label>
          <Input 
            value={form.midtrans_client_key || ""} 
            onChange={e => setForm({ ...form, midtrans_client_key: e.target.value })} 
            placeholder="SB-Mid-client-xxxxx atau Mid-client-xxxxx"
          />
          <p className="text-xs text-muted-foreground">Digunakan untuk Snap.js (boleh publik)</p>
        </div>

        {form.midtrans_client_key && form.midtrans_server_key && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-800">
            <p className="font-semibold">✓ Midtrans sudah dikonfigurasi</p>
            <p className="text-xs mt-1">API Midtrans global aktif. Masjid tetap bisa override dengan kredensial mereka sendiri.</p>
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

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Menyimpan..." : "Simpan Pengaturan"}
        </Button>
      </div>
      )}
    </div>
  );
}