import { useState, useEffect, useRef } from "react";
import { smartApi } from "@/api/apiClient";
import { useMosqueContext } from "@/lib/useMosqueContext";
import PageHeader from "../components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Send, Bot, Settings, CheckCircle2, XCircle, Upload, Scan,
  BotIcon, Zap, Receipt, AlertCircle, Eye, EyeOff, Loader2,
  MessageSquare, Bell, DollarSign, Calendar, Megaphone
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function TelegramIntegration() {
  const { currentMosque } = useMosqueContext();
  const [settings, setSettings] = useState({
    bot_token: "",
    chat_id: "",
    notify_transactions: true,
    notify_activities: true,
    notify_announcements: true,
    notify_donations: true,
    bot_enabled: false,
    gemini_api_key: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingBot, setTestingBot] = useState(false);
  const [testingSend, setTestingSend] = useState(false);
  const [botInfo, setBotInfo] = useState(null);
  const [showToken, setShowToken] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [activeTab, setActiveTab] = useState("setup");

  // Receipt scan state
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [savingTransaction, setSavingTransaction] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (currentMosque) loadSettings();
  }, [currentMosque]);

  async function loadSettings() {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE}/api/telegram/settings?mosque_id=${currentMosque.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSettings({
          bot_token: data.bot_token || "",
          chat_id: data.chat_id || "",
          notify_transactions: data.notify_transactions ?? true,
          notify_activities: data.notify_activities ?? true,
          notify_announcements: data.notify_announcements ?? true,
          notify_donations: data.notify_donations ?? true,
          bot_enabled: data.bot_enabled ?? false,
          gemini_api_key: data.gemini_api_key || "",
        });
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE}/api/telegram/settings`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ mosque_id: currentMosque.id, ...settings }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("✅ Pengaturan Telegram berhasil disimpan!");
        await loadSettings();
      } else {
        toast.error(data.error || "Gagal menyimpan pengaturan");
      }
    } catch (e) {
      toast.error("Gagal menyimpan: " + e.message);
    }
    setSaving(false);
  }

  async function handleTestBot() {
    setTestingBot(true);
    setBotInfo(null);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE}/api/telegram/test-bot`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ mosque_id: currentMosque.id, bot_token: settings.bot_token }),
      });
      const data = await res.json();
      if (data.success) {
        setBotInfo(data.bot);
        toast.success(`✅ Bot @${data.bot.username} berhasil terkoneksi!`);
      } else {
        toast.error("❌ " + (data.error || "Token tidak valid"));
      }
    } catch (e) {
      toast.error("Gagal tes koneksi: " + e.message);
    }
    setTestingBot(false);
  }

  async function handleTestSend() {
    setTestingSend(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE}/api/telegram/test-send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ mosque_id: currentMosque.id, chat_id: settings.chat_id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("✅ Pesan test berhasil dikirim ke Telegram!");
      } else {
        toast.error("❌ " + (data.error || "Gagal kirim pesan test"));
      }
    } catch (e) {
      toast.error("Gagal: " + e.message);
    }
    setTestingSend(false);
  }

  function handleReceiptSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    setReceiptFile(file);
    setScanResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => setReceiptPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleScanReceipt() {
    if (!receiptFile) return;
    setScanning(true);
    setScanResult(null);
    try {
      const token = localStorage.getItem("auth_token");
      const formData = new FormData();
      formData.append("receipt", receiptFile);
      formData.append("mosque_id", currentMosque.id);

      const res = await fetch(`${API_BASE}/api/telegram/analyze-receipt`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setScanResult({ ...data.data, receipt_url: data.receipt_url });
        toast.success("✅ Struk berhasil dibaca oleh AI!");
      } else {
        toast.error("❌ " + (data.error || "Gagal membaca struk"));
      }
    } catch (e) {
      toast.error("Gagal scan struk: " + e.message);
    }
    setScanning(false);
  }

  async function handleSaveTransaction() {
    if (!scanResult) return;
    setSavingTransaction(true);
    try {
      const token = localStorage.getItem("auth_token");
      const payload = {
        mosque_id: currentMosque.id,
        type: "expense",
        amount: scanResult.amount,
        category: scanResult.category,
        description: `${scanResult.description}${scanResult.store_name ? ` (${scanResult.store_name})` : ""}`,
        date: scanResult.date,
        receipt_url: scanResult.receipt_url || null,
        source: "web_ocr",
      };

      const res = await fetch(`${API_BASE}/api/transactions/create`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("✅ Transaksi berhasil dicatat dari struk!");
        setScanResult(null);
        setReceiptFile(null);
        setReceiptPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        toast.error("❌ " + (data.error || "Gagal menyimpan transaksi"));
      }
    } catch (e) {
      toast.error("Gagal: " + e.message);
    }
    setSavingTransaction(false);
  }

  function formatCurrency(amount) {
    return "Rp " + parseFloat(amount || 0).toLocaleString("id-ID");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    { key: "setup", label: "Setup Bot", icon: <Bot className="h-4 w-4" /> },
    { key: "notifikasi", label: "Notifikasi", icon: <Bell className="h-4 w-4" /> },
    { key: "scan_struk", label: "Scan Struk", icon: <Receipt className="h-4 w-4" /> },
    { key: "cara_pakai", label: "Panduan", icon: <MessageSquare className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrasi Telegram"
        description="Hubungkan masjid dengan Telegram untuk notifikasi otomatis dan scan struk"
      />

      {/* Status Banner */}
      <div className={`rounded-xl border p-4 flex items-center gap-3 ${
        settings.bot_enabled
          ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
          : "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
      }`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          settings.bot_enabled ? "bg-emerald-100 dark:bg-emerald-900" : "bg-amber-100 dark:bg-amber-900"
        }`}>
          {settings.bot_enabled ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-600" />
          )}
        </div>
        <div>
          <p className={`font-semibold text-sm ${settings.bot_enabled ? "text-emerald-800 dark:text-emerald-200" : "text-amber-800 dark:text-amber-200"}`}>
            {settings.bot_enabled ? "🤖 Telegram Bot Aktif" : "⚙️ Telegram Bot Belum Aktif"}
          </p>
          <p className={`text-xs ${settings.bot_enabled ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
            {settings.bot_enabled
              ? "Bot sedang berjalan. Notifikasi otomatis dan scan struk sudah siap."
              : "Konfigurasi bot token dan Chat ID untuk mengaktifkan fitur Telegram."}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.key ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ===================== TAB: SETUP ===================== */}
      {activeTab === "setup" && (
        <div className="space-y-5 max-w-2xl">
          {/* Bot Token */}
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <BotIcon className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Konfigurasi Bot Telegram</h3>
            </div>

            <div className="space-y-2">
              <Label>Bot Token (dari @BotFather)</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showToken ? "text" : "password"}
                    value={settings.bot_token}
                    onChange={(e) => setSettings({ ...settings, bot_token: e.target.value })}
                    placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestBot}
                  disabled={testingBot || !settings.bot_token}
                  className="flex-shrink-0"
                >
                  {testingBot ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  {testingBot ? "Testing..." : "Tes Bot"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Chat dengan <a href="https://t.me/BotFather" target="_blank" rel="noopener" className="text-primary underline font-medium">@BotFather</a> di Telegram, buat bot baru, dan salin token-nya ke sini.
              </p>
            </div>

            {/* Bot Info */}
            {botInfo && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Bot Terverifikasi ✓</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    @{botInfo.username} — {botInfo.first_name}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t">
              <Label>Chat ID / Group ID untuk Notifikasi</Label>
              <div className="flex gap-2">
                <Input
                  value={settings.chat_id}
                  onChange={(e) => setSettings({ ...settings, chat_id: e.target.value })}
                  placeholder="-100123456789 atau @nama_channel"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestSend}
                  disabled={testingSend || !settings.chat_id || !settings.bot_token}
                  className="flex-shrink-0"
                >
                  {testingSend ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {testingSend ? "Mengirim..." : "Tes Kirim"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                ID grup atau channel Telegram. Untuk grup: format <code>-100xxxxxxxxx</code>. Tambahkan bot ke grup/channel terlebih dahulu.
              </p>
            </div>

            {/* Enable Bot */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <Label>Aktifkan Bot Telegram</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Bot akan menerima pesan dan kirim notifikasi otomatis
                </p>
              </div>
              <Switch
                checked={settings.bot_enabled}
                onCheckedChange={(v) => setSettings({ ...settings, bot_enabled: v })}
              />
            </div>
          </div>

          {/* Gemini API Key */}
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Scan className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">AI untuk Scan Struk (Gemini)</h3>
              <Badge variant="outline" className="text-xs">Opsional</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Masukkan Gemini API Key untuk mengaktifkan fitur scan struk otomatis lewat foto.
            </p>

            <div className="space-y-2">
              <Label>Gemini API Key</Label>
              <div className="relative">
                <Input
                  type={showGeminiKey ? "text" : "password"}
                  value={settings.gemini_api_key}
                  onChange={(e) => setSettings({ ...settings, gemini_api_key: e.target.value })}
                  placeholder="AIza......................................"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Dapatkan gratis di{" "}
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" className="text-primary underline font-medium">
                  aistudio.google.com/apikey
                </a>. Tersedia gratis dengan kuota 15 request/menit.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <p className="font-semibold">✨ Cara kerja Scan Struk:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Foto struk belanja/nota langsung dari HP</li>
                <li>AI Gemini membaca teks, tanggal, total, dan nama toko</li>
                <li>Data otomatis terisi di form transaksi</li>
                <li>Konfirmasi lalu simpan — selesai!</li>
              </ol>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </div>
      )}

      {/* ===================== TAB: NOTIFIKASI ===================== */}
      {activeTab === "notifikasi" && (
        <div className="max-w-2xl space-y-5">
          <div className="bg-card rounded-xl border p-6 space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Pengaturan Notifikasi</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Pilih jenis event yang akan dikirim notifikasinya ke Telegram.
            </p>

            {[
              {
                key: "notify_transactions",
                icon: <DollarSign className="h-5 w-5 text-emerald-600" />,
                title: "Transaksi Keuangan",
                desc: "Notifikasi setiap ada pemasukan atau pengeluaran baru dicatat",
              },
              {
                key: "notify_activities",
                icon: <Calendar className="h-5 w-5 text-blue-600" />,
                title: "Kegiatan Baru",
                desc: "Notifikasi saat ada kegiatan atau program masjid baru ditambahkan",
              },
              {
                key: "notify_announcements",
                icon: <Megaphone className="h-5 w-5 text-amber-600" />,
                title: "Pengumuman Penting",
                desc: "Notifikasi saat pengumuman baru dipublish ke jamaah",
              },
              {
                key: "notify_donations",
                icon: <Receipt className="h-5 w-5 text-purple-600" />,
                title: "Donasi Masuk",
                desc: "Notifikasi saat ada donasi baru masuk dari jamaah",
              },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <Switch
                  checked={settings[item.key]}
                  onCheckedChange={(v) => setSettings({ ...settings, [item.key]: v })}
                />
              </div>
            ))}
          </div>

          {/* Contoh pesan notifikasi */}
          <div className="bg-card rounded-xl border p-6 space-y-3">
            <h4 className="font-semibold text-sm">📱 Contoh Pesan Notifikasi Telegram</h4>
            <div className="bg-[#EFFDDE] dark:bg-[#1a3a2a] rounded-xl p-4 text-sm space-y-1 font-mono border">
              <p className="font-bold">💸 Transaksi Keuangan Baru</p>
              <p className="text-muted-foreground">🏛️ <strong>Masjid Al-Ikhlas</strong></p>
              <p>📋 Jenis: <strong>PENGELUARAN</strong></p>
              <p>💵 Jumlah: <strong>Rp 250.000</strong></p>
              <p>📂 Kategori: Kebersihan</p>
              <p>📝 Keterangan: Pembelian alat kebersihan</p>
              <p>📅 Tanggal: 2 April 2026</p>
              <p className="text-xs text-muted-foreground">🕐 02/04/2026, 18.00.00</p>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
            {saving ? "Menyimpan..." : "Simpan Pengaturan Notifikasi"}
          </Button>
        </div>
      )}

      {/* ===================== TAB: SCAN STRUK ===================== */}
      {activeTab === "scan_struk" && (
        <div className="max-w-2xl space-y-5">
          {/* Upload Area */}
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Scan Struk / Nota Belanja</h3>
              <Badge className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">AI Powered</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Upload foto struk belanja, nota, atau kwitansi. AI akan otomatis membaca dan mengisi data transaksi.
            </p>

            {/* Upload zone */}
            {!receiptPreview ? (
              <label
                htmlFor="receipt-upload"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-muted-foreground/30 rounded-xl cursor-pointer hover:bg-muted/30 transition-colors group"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Upload className="h-7 w-7 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Klik untuk upload foto struk</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP — maks 10MB</p>
                  </div>
                </div>
                <input
                  id="receipt-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleReceiptSelect}
                />
              </label>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border group">
                  <img src={receiptPreview} alt="Preview struk" className="w-full max-h-80 object-contain bg-muted/20" />
                  <button
                    onClick={() => {
                      setReceiptFile(null);
                      setReceiptPreview(null);
                      setScanResult(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white text-xs px-2.5 py-1 rounded-lg font-semibold"
                  >
                    ✕ Hapus
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleScanReceipt}
                    disabled={scanning}
                    className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {scanning ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        AI sedang membaca struk...
                      </>
                    ) : (
                      <>
                        <Scan className="h-4 w-4" />
                        Scan dengan AI
                      </>
                    )}
                  </Button>
                  <label htmlFor="receipt-upload-replace" className="cursor-pointer">
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-1" /> Ganti
                    </Button>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Hasil Scan */}
          {scanResult && (
            <div className="bg-card rounded-xl border-2 border-emerald-400 dark:border-emerald-600 p-6 space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h3 className="font-semibold text-emerald-800 dark:text-emerald-200">
                  Struk Berhasil Dibaca!
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Tanggal</p>
                  <Input
                    type="date"
                    value={scanResult.date || ""}
                    onChange={(e) => setScanResult({ ...scanResult, date: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total Pembayaran</p>
                  <Input
                    type="number"
                    value={scanResult.amount || 0}
                    onChange={(e) => setScanResult({ ...scanResult, amount: parseFloat(e.target.value) || 0 })}
                    className="h-8 text-sm font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Nama Toko/Vendor</p>
                  <Input
                    value={scanResult.store_name || ""}
                    onChange={(e) => setScanResult({ ...scanResult, store_name: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Kategori</p>
                  <select
                    value={scanResult.category || "Lainnya"}
                    onChange={(e) => setScanResult({ ...scanResult, category: e.target.value })}
                    className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm"
                  >
                    {["Operasional", "Konsumsi", "Kebersihan", "Listrik & Air", "Gaji & Honor", "Perlengkapan", "Pemeliharaan", "Kegiatan", "Donasi", "Lainnya"].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 space-y-1">
                  <p className="text-xs text-muted-foreground">Keterangan</p>
                  <Input
                    value={scanResult.description || ""}
                    onChange={(e) => setScanResult({ ...scanResult, description: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {scanResult.items && scanResult.items.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-2">🛒 Item yang terdeteksi:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {scanResult.items.map((item, i) => (
                      <span key={i} className="px-2 py-0.5 bg-muted rounded-full text-xs">{item}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total akan dicatat sebagai:</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(scanResult.amount)}</p>
                  <p className="text-xs text-muted-foreground">Pengeluaran — {scanResult.category}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setScanResult(null)}
                    className="text-sm"
                  >
                    <XCircle className="h-4 w-4 mr-1" /> Batal
                  </Button>
                  <Button
                    onClick={handleSaveTransaction}
                    disabled={savingTransaction}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {savingTransaction ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {savingTransaction ? "Menyimpan..." : "Simpan ke Laporan Keuangan"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB: PANDUAN ===================== */}
      {activeTab === "cara_pakai" && (
        <div className="max-w-2xl space-y-5">
          {/* Panduan Setup */}
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Cara Membuat Bot Telegram
            </h3>
            <ol className="space-y-3 text-sm">
              {[
                { num: 1, text: 'Buka Telegram, cari dan chat @BotFather', code: null },
                { num: 2, text: 'Ketik perintah /newbot', code: '/newbot' },
                { num: 3, text: 'Masukkan nama bot masjid Anda (misal: Bot Masjid Al-Ikhlas)', code: null },
                { num: 4, text: 'Masukkan username bot (harus diakhiri "bot", misal: masjidalikhlas_bot)', code: null },
                { num: 5, text: 'Salin token yang diberikan BotFather (format: 1234567890:ABCdef...)', code: null },
                { num: 6, text: 'Paste token di kolom "Bot Token" pada tab Setup', code: null },
              ].map(step => (
                <li key={step.num} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                    {step.num}
                  </span>
                  <span>
                    {step.text}
                    {step.code && <code className="ml-1 px-1.5 py-0.5 bg-muted rounded text-xs font-mono">{step.code}</code>}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Cara dapat Chat ID */}
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <h3 className="font-semibold">Cara Mendapatkan Chat ID Grup</h3>
            <ol className="space-y-3 text-sm">
              {[
                'Tambahkan bot Anda ke grup/channel Telegram masjid',
                'Tambahkan juga @userinfobot ke grup yang sama',
                'Ketik perintah /start di grup tersebut',
                'Bot akan membalas dengan Chat ID grup (format: -100xxxxxxxxx)',
                'Salin Chat ID tersebut ke kolom "Chat ID" di tab Setup',
                'Klik "Tes Kirim" untuk verifikasi',
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Perintah Bot */}
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <h3 className="font-semibold">📋 Perintah Bot yang Tersedia</h3>
            <p className="text-sm text-muted-foreground">
              Chat langsung dengan bot Anda menggunakan perintah berikut:
            </p>
            <div className="space-y-2">
              {[
                { cmd: '/start', desc: 'Menu utama dan info bot' },
                { cmd: '/saldo', desc: 'Cek saldo keuangan masjid' },
                { cmd: '/transaksi', desc: '5 transaksi keuangan terakhir' },
                { cmd: '/kegiatan', desc: 'Daftar kegiatan mendatang' },
                { cmd: '/pengumuman', desc: 'Pengumuman terbaru' },
                { cmd: '/konfirmasi', desc: 'Konfirmasi simpan hasil scan struk' },
                { cmd: '/batal', desc: 'Batalkan proses scan struk' },
              ].map(item => (
                <div key={item.cmd} className="flex items-center gap-3 py-2 border-b last:border-b-0">
                  <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono font-bold text-primary min-w-[130px]">
                    {item.cmd}
                  </code>
                  <span className="text-sm text-muted-foreground">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cara scan struk via Telegram */}
          <div className="bg-card rounded-xl border p-6 space-y-4">
            <h3 className="font-semibold">🧾 Cara Scan Struk via Telegram Bot</h3>
            <ol className="space-y-3 text-sm">
              {[
                'Buka chat dengan bot Telegram masjid',
                'Foto struk/nota belanja langsung dari kamera HP',
                'Kirim foto tersebut ke bot (langsung drag & drop atau tombol lampiran)',
                'AI akan membaca struk dan menampilkan detail transaksi',
                'Cek data yang terbaca (tanggal, jumlah, kategori)',
                'Balas /konfirmasi untuk menyimpan ke laporan keuangan',
                'Atau /batal untuk membatalkan',
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-200">
              💡 <strong>Tips foto struk:</strong> Pastikan foto terang, tidak buram, seluruh struk terlihat lengkap, dan background berbeda dengan teks struk untuk hasil terbaik.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
