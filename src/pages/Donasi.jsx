import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { smartApi } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Heart, Upload, CheckCircle } from "lucide-react";

const CATEGORIES = [
  { value: "zakat", label: "Zakat" },
  { value: "infak", label: "Infak" },
  { value: "sedekah", label: "Sedekah" },
  { value: "kotak_amal", label: "Kotak Amal" },
  { value: "wakaf", label: "Wakaf" },
  { value: "lainnya", label: "Lainnya" },
];

const PAYMENT_METHODS = [
  { value: "transfer_bank", label: "Transfer Bank (Manual)" },
  { value: "qris", label: "QRIS (Midtrans)" },
  { value: "e_wallet", label: "E-Wallet (Midtrans)" },
  { value: "tunai", label: "Tunai" },
];

export default function Donasi() {
  const { id } = useParams();
  const [mosque, setMosque] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    donor_name: "", donor_email: "", donor_phone: "",
    category: "infak", amount: "", payment_method: "transfer_bank",
    proof_url: "", notes: ""
  });

  useEffect(() => {
    loadMosque();
  }, [id]);

  async function loadMosque() {
    try {
      let found = null;
      if (id) {
        const byId = await smartApi.entities.Mosque.filter({ id });
        if (byId?.length) {
          found = byId[0];
        } else {
          const bySlug = await smartApi.entities.Mosque.filter({ slug: id });
          if (bySlug?.length) found = bySlug[0];
        }
      } else {
        const all = await smartApi.entities.Mosque.list();
        found = all.find(m => m.status === 'active') || all[0] || null;
      }
      if (found) setMosque(found);
    } catch (e) {
      console.error('Error loading mosque:', e);
    }
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await smartApi.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, proof_url: file_url }));
    setUploading(false);
    toast.success("Bukti transfer berhasil diupload");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.donor_name || !form.amount) {
      toast.error("Harap lengkapi nama dan jumlah donasi");
      return;
    }
    
    setSubmitting(true);
    try {
      // Create donation record
      const donation = await smartApi.entities.Donation.create({
        ...form,
        mosque_id: mosque.id,
        amount: Number(form.amount),
        status: "pending",
        proof_url: form.proof_url || null,
      });

      // If Midtrans configured and using online payment
      if (mosque.midtrans_client_key && (form.payment_method === "qris" || form.payment_method === "e_wallet")) {
        const orderId = `${mosque.id}-${donation.id}-${Date.now()}`;
        
        // Create payment record
        const payment = await smartApi.entities.Payment.create({
          mosque_id: mosque.id,
          transaction_type: "donation",
          reference_id: donation.id,
          midtrans_order_id: orderId,
          amount: Number(form.amount),
          status: "pending",
          payer_name: form.donor_name,
          payer_email: form.donor_email,
          payer_phone: form.donor_phone,
          payment_method: form.payment_method,
        });

        // Generate Snap token - note: this requires backend function support
        // For now, we'll handle via donation proof upload
        toast.info("Pembayaran online akan diimplementasikan segera");
        setSubmitted(true);
      } else {
        // Manual transfer or cash
        if (!form.proof_url && form.payment_method !== "tunai") {
          toast.error("Harap upload bukti transfer");
          setSubmitting(false);
          return;
        }
        setSubmitted(true);
        toast.success("Donasi berhasil dicatat!");
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  }

  if (!mosque) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href)}`;

  if (submitted) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <CheckCircle className="h-10 w-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold">Donasi Terkirim!</h2>
        <p className="text-muted-foreground">Donasi Anda sedang menunggu konfirmasi dari bendahara masjid. Jazakallah khairan atas kebaikan Anda.</p>
        <Button onClick={() => setSubmitted(false)} variant="outline">Donasi Lagi</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative h-48 overflow-hidden" style={{ background: mosque.primary_color || 'hsl(var(--primary))' }}>
        {mosque.cover_image_url && <img src={mosque.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />}
        <div className="relative flex items-center justify-center h-full gap-4 text-white">
          {mosque.logo_url && <img src={mosque.logo_url} alt="" className="w-16 h-16 rounded-xl object-cover" />}
          <div>
            <h1 className="text-2xl font-bold">{mosque.name}</h1>
            <p className="text-white/70 text-sm">{mosque.address}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-6 space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Heart className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold">Form Donasi</h2>
          <p className="text-sm text-muted-foreground">
            {mosque.midtrans_client_key 
              ? "Pembayaran online dan manual tersedia" 
              : "Donasi akan dikonfirmasi oleh bendahara masjid"}
          </p>
        </div>

        {/* QR Code */}
        <div className="bg-card border rounded-xl p-4 flex items-center gap-4">
          <img src={qrUrl} alt="QR" className="w-24 h-24 rounded-lg" />
          <div>
            <p className="font-semibold text-sm">Bagikan halaman ini</p>
            <p className="text-xs text-muted-foreground">Scan QR code untuk mengakses halaman donasi ini</p>
            <p className="text-xs text-primary mt-1 truncate">{window.location.href}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-card border rounded-xl p-4 space-y-4">
            <h3 className="font-semibold text-sm">Data Donatur</h3>
            <div>
              <Label>Nama Lengkap *</Label>
              <Input className="mt-1" value={form.donor_name} onChange={e => setForm(f => ({ ...f, donor_name: e.target.value }))} placeholder="Nama Anda" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input className="mt-1" type="email" value={form.donor_email} onChange={e => setForm(f => ({ ...f, donor_email: e.target.value }))} placeholder="email@..." />
              </div>
              <div>
                <Label>No. HP</Label>
                <Input className="mt-1" value={form.donor_phone} onChange={e => setForm(f => ({ ...f, donor_phone: e.target.value }))} placeholder="08..." />
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4 space-y-4">
            <h3 className="font-semibold text-sm">Detail Donasi</h3>
            <div>
              <Label>Kategori *</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Jumlah Donasi (Rp) *</Label>
              <Input className="mt-1" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="100000" required />
            </div>
            <div>
              <Label>Metode Pembayaran *</Label>
              <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Catatan</Label>
              <Input className="mt-1" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Catatan tambahan (opsional)" />
            </div>
          </div>

          {(form.payment_method === "transfer_bank" || form.payment_method === "tunai" || !mosque.midtrans_client_key) && (
            <div className="bg-card border rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-sm">Bukti Transfer {form.payment_method === "tunai" ? "(Opsional)" : "*"}</h3>
              {form.payment_method !== "tunai" && (
                <p className="text-xs text-muted-foreground">Upload foto/screenshot bukti transfer Anda.</p>
              )}
              {form.proof_url ? (
                <div className="space-y-2">
                  <img src={form.proof_url} alt="bukti" className="w-full max-h-48 object-contain rounded-lg border" />
                  <Button type="button" variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, proof_url: "" }))}>Ganti Foto</Button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-2 border-2 border-dashed rounded-xl p-6 hover:bg-muted/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{uploading ? 'Mengupload...' : 'Klik untuk upload bukti transfer'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                </label>
              )}
            </div>
          )}

          <Button type="submit" className="w-full gap-2" disabled={submitting || uploading}>
            <Heart className="h-4 w-4" /> {submitting ? 'Mengirim...' : 'Kirim Donasi'}
          </Button>
        </form>
      </div>
    </div>
  );
}