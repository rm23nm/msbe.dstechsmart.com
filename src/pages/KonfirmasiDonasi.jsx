import { useState, useEffect } from "react";
import { base44 } from "@/api/apiClient";
import { useMosqueContext } from "@/lib/useMosqueContext";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const CATEGORY_LABELS = {
  zakat: "Zakat", infak: "Infak", sedekah: "Sedekah",
  kotak_amal: "Kotak Amal", wakaf: "Wakaf", lainnya: "Lainnya"
};

function formatRp(n) { return "Rp " + (n || 0).toLocaleString("id-ID"); }

export default function KonfirmasiDonasi() {
  const { currentMosque, loading, isBendahara, isMosqueAdmin, isAdmin } = useMosqueContext();
  const [donations, setDonations] = useState([]);
  const [tab, setTab] = useState("pending");
  const [previewItem, setPreviewItem] = useState(null);

  const canConfirm = isBendahara || isMosqueAdmin || isAdmin;

  useEffect(() => {
    if (currentMosque) loadData();
  }, [currentMosque]);

  async function loadData() {
    const data = await base44.entities.Donation.filter({ mosque_id: currentMosque.id }, '-created_date', 100);
    setDonations(data);
  }

  async function confirm(donation) {
    const user = await base44.auth.me();
    await base44.entities.Donation.update(donation.id, {
      status: 'confirmed',
      confirmed_by: user.email,
      confirmed_at: new Date().toISOString()
    });
    // Auto-create transaction
    await base44.entities.Transaction.create({
      mosque_id: currentMosque.id,
      type: 'income',
      category: donation.category,
      amount: donation.amount,
      description: `Donasi dari ${donation.donor_name} (${CATEGORY_LABELS[donation.category]})`,
      date: new Date().toISOString().split('T')[0],
      recorded_by: user.email
    });
    toast.success("Donasi dikonfirmasi dan saldo diperbarui");
    loadData();
  }

  async function reject(donation) {
    await base44.entities.Donation.update(donation.id, { status: 'rejected' });
    toast.success("Donasi ditolak");
    loadData();
  }

  if (loading || !currentMosque) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const filtered = donations.filter(d => d.status === tab);
  const totalConfirmed = donations.filter(d => d.status === 'confirmed').reduce((s, d) => s + (d.amount || 0), 0);
  const totalPending = donations.filter(d => d.status === 'pending').reduce((s, d) => s + (d.amount || 0), 0);

  const donationUrl = `${window.location.origin}/donasi/${currentMosque.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(donationUrl)}`;

  return (
    <div className="space-y-6">
      <PageHeader title="Donasi & Konfirmasi" description="Kelola dan konfirmasi donasi jamaah" />

      {/* QR + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-4 flex items-center gap-4">
          <img src={qrUrl} alt="QR" className="w-20 h-20 rounded-lg shrink-0" />
          <div>
            <p className="font-semibold text-sm">QR Donasi Masjid</p>
            <p className="text-xs text-muted-foreground mb-1">Bagikan ke jamaah</p>
            <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(donationUrl) && toast.success("Link disalin")}>
              Salin Link
            </Button>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Donasi Terkonfirmasi</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatRp(totalConfirmed)}</p>
          <p className="text-xs text-muted-foreground">{donations.filter(d => d.status === 'confirmed').length} transaksi</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Menunggu Konfirmasi</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{formatRp(totalPending)}</p>
          <p className="text-xs text-muted-foreground">{donations.filter(d => d.status === 'pending').length} donasi pending</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {['pending', 'confirmed', 'rejected'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {t === 'pending' ? 'Menunggu' : t === 'confirmed' ? 'Terkonfirmasi' : 'Ditolak'}
            {t === 'pending' && donations.filter(d => d.status === 'pending').length > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">{donations.filter(d => d.status === 'pending').length}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Tidak ada donasi {tab === 'pending' ? 'yang menunggu konfirmasi' : tab}</div>
        ) : filtered.map(d => (
          <div key={d.id} className="bg-card border rounded-xl p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold">{d.donor_name}</p>
                <Badge variant={d.category === 'zakat' ? 'default' : 'secondary'}>{CATEGORY_LABELS[d.category]}</Badge>
                <span className="text-xs text-muted-foreground">{d.payment_method?.replace('_', ' ')}</span>
              </div>
              <p className="text-xl font-bold text-primary mt-1">{formatRp(d.amount)}</p>
              {d.donor_email && <p className="text-xs text-muted-foreground">{d.donor_email} {d.donor_phone && `• ${d.donor_phone}`}</p>}
              {d.notes && <p className="text-xs text-muted-foreground italic mt-0.5">"{d.notes}"</p>}
              <p className="text-xs text-muted-foreground mt-0.5">{new Date(d.created_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              {d.proof_url && (
                <Button size="sm" variant="outline" onClick={() => setPreviewItem(d)}>
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              {canConfirm && tab === 'pending' && (
                <>
                  <Button size="sm" onClick={() => confirm(d)} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle className="h-4 w-4" /> Konfirmasi
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => reject(d)}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </>
              )}
              {d.confirmed_by && (
                <p className="text-xs text-muted-foreground self-center">✓ {d.confirmed_by}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Bukti Transfer — {previewItem?.donor_name}</DialogTitle></DialogHeader>
          {previewItem?.proof_url && (
            <img src={previewItem.proof_url} alt="bukti" className="w-full rounded-lg border" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}