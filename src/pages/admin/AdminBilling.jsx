import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import { formatCurrency, formatDate } from "@/lib/formatCurrency";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import MosqueFormDialog from "../../components/admin/MosqueFormDialog";
import { toast } from "sonner";
import { CreditCard, TrendingUp, AlertCircle, Plus, Pencil, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminBilling() {
  const [mosques, setMosques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMosqueForm, setShowMosqueForm] = useState(false);
  const [editMosque, setEditMosque] = useState(null);
  const [showManualBilling, setShowManualBilling] = useState(false);
  const [billingTarget, setBillingTarget] = useState(null);
  const [billingForm, setBillingForm] = useState({ plan: "yearly", duration: "1", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const data = await smartApi.entities.Mosque.list();
    setMosques(data);
    setLoading(false);
  }

  async function handleSaveMosque(data) {
    if (editMosque) {
      await smartApi.entities.Mosque.update(editMosque.id, data);
      toast.success("Data masjid berhasil diperbarui");
    } else {
      await smartApi.entities.Mosque.create(data);
      toast.success("Masjid baru berhasil ditambahkan");
    }
    setShowMosqueForm(false);
    setEditMosque(null);
    await loadData();
  }

  async function handleActivateBilling() {
    if (!billingTarget) return;
    setSaving(true);
    try {
      const months = billingForm.plan === "yearly"
        ? parseInt(billingForm.duration) * 12
        : parseInt(billingForm.duration);
      const end = new Date();
      end.setMonth(end.getMonth() + months);

      await smartApi.entities.Mosque.update(billingTarget.id, {
        subscription_plan: billingForm.plan,
        subscription_status: "active",
        subscription_start: new Date().toISOString(),
        subscription_end: end.toISOString(),
      });
      toast.success(`Langganan ${billingTarget.name} berhasil diaktifkan hingga ${end.toLocaleDateString("id-ID")}`);
      setShowManualBilling(false);
      setBillingTarget(null);
      await loadData();
    } catch (err) {
      toast.error("Gagal mengaktifkan langganan: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  function openBilling(mosque) {
    setBillingTarget(mosque);
    setBillingForm({ plan: mosque.subscription_plan || "yearly", duration: "1", notes: "" });
    setShowManualBilling(true);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const monthlyPrice = 150000;
  const yearlyPrice = 1500000;

  const activeMonthly = mosques.filter(m => m.subscription_plan === "monthly" && m.subscription_status === "active");
  const activeYearly = mosques.filter(m => m.subscription_plan === "yearly" && m.subscription_status === "active");
  const expiring = mosques.filter(m => {
    if (!m.subscription_end) return false;
    const end = new Date(m.subscription_end);
    const diff = (end - new Date()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff < 30;
  });

  const totalMRR = activeMonthly.length * monthlyPrice + activeYearly.length * (yearlyPrice / 12);

  return (
    <div className="space-y-6">
      <PageHeader title="Billing & Langganan" description="Kelola langganan dan pembayaran masjid">
        <Button onClick={() => { setEditMosque(null); setShowMosqueForm(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Tambah Masjid
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="MRR (Monthly)" value={formatCurrency(totalMRR)} icon={TrendingUp} trendUp />
        <StatCard title="Langganan Bulanan" value={activeMonthly.length} icon={CreditCard} subtitle={formatCurrency(monthlyPrice) + "/bln"} />
        <StatCard title="Langganan Tahunan" value={activeYearly.length} icon={CreditCard} subtitle={formatCurrency(yearlyPrice) + "/thn"} />
        <StatCard title="Segera Berakhir" value={expiring.length} icon={AlertCircle} subtitle="< 30 hari" />
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Detail Langganan Masjid ({mosques.length} total)</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Masjid</TableHead>
                <TableHead>Kota</TableHead>
                <TableHead>Paket</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mulai</TableHead>
                <TableHead>Berakhir</TableHead>
                <TableHead className="w-28">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mosques.map(m => {
                const isExpired = m.subscription_end && new Date(m.subscription_end) < new Date();
                const expiresoon = m.subscription_end && !isExpired && (() => {
                  const diff = (new Date(m.subscription_end) - new Date()) / (1000 * 60 * 60 * 24);
                  return diff < 30;
                })();
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-sm">{m.city || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {m.subscription_plan || "trial"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          m.subscription_status === "active" && !isExpired
                            ? "default"
                            : isExpired
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {isExpired ? "Expired" : expiresoon ? "⚠ Hampir Habis" : m.subscription_status || "trial"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {m.subscription_start ? formatDate(m.subscription_start) : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {m.subscription_end ? formatDate(m.subscription_end) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" title="Edit masjid" onClick={() => { setEditMosque(m); setShowMosqueForm(true); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1" onClick={() => openBilling(m)}>
                          <CheckCircle className="h-3 w-3" />
                          {isExpired || !m.subscription_end ? "Aktifkan" : "Perpanjang"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Manual Billing Activation Dialog */}
      <Dialog open={showManualBilling} onOpenChange={setShowManualBilling}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Aktifkan Langganan Manual
            </DialogTitle>
          </DialogHeader>
          {billingTarget && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p className="font-medium">{billingTarget.name}</p>
                <p className="text-muted-foreground">{billingTarget.city}</p>
              </div>
              <div className="space-y-2">
                <Label>Paket Langganan</Label>
                <Select value={billingForm.plan} onValueChange={v => setBillingForm(f => ({ ...f, plan: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Bulanan ({formatCurrency(monthlyPrice)}/bulan)</SelectItem>
                    <SelectItem value="yearly">Tahunan ({formatCurrency(yearlyPrice)}/tahun)</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Durasi {billingForm.plan === "yearly" ? "(Tahun)" : "(Bulan)"}</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={billingForm.duration}
                  onChange={e => setBillingForm(f => ({ ...f, duration: e.target.value }))}
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <p className="font-medium">Ringkasan Aktivasi (Manual)</p>
                <p>Paket: {billingForm.plan} × {billingForm.duration} {billingForm.plan === "yearly" ? "tahun" : "bulan"}</p>
                <p>Total: {formatCurrency((billingForm.plan === "yearly" ? yearlyPrice : monthlyPrice) * parseInt(billingForm.duration || 1))}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                ⚠️ Ini adalah aktivasi manual (tanpa payment gateway). Pastikan pembayaran telah dikonfirmasi secara offline sebelum mengaktifkan.
              </p>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowManualBilling(false)}>Batal</Button>
                <Button className="flex-1" onClick={handleActivateBilling} disabled={saving}>
                  {saving ? "Memproses..." : "Aktifkan Sekarang"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <MosqueFormDialog
        open={showMosqueForm}
        onOpenChange={(open) => { setShowMosqueForm(open); if (!open) setEditMosque(null); }}
        item={editMosque}
        onSave={handleSaveMosque}
      />
    </div>
  );
}