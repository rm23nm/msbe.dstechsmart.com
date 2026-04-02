import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import { useMosqueContext } from "@/lib/useMosqueContext";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Plus, Pencil, Trash2, Download, Wrench, AlertTriangle, CheckCircle, Upload } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["tanah","bangunan","kendaraan","elektronik","perabot","perlengkapan_ibadah","lainnya"];
const CONDITIONS = ["baik","rusak_ringan","rusak_berat","tidak_layak"];
const STATUSES = ["aktif","tidak_aktif","dipinjam","dijual"];

const conditionConfig = {
  baik: { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle, label: "Baik" },
  rusak_ringan: { color: "bg-yellow-100 text-yellow-700", icon: AlertTriangle, label: "Rusak Ringan" },
  rusak_berat: { color: "bg-red-100 text-red-700", icon: AlertTriangle, label: "Rusak Berat" },
  tidak_layak: { color: "bg-gray-100 text-gray-600", icon: AlertTriangle, label: "Tidak Layak" },
};

function formatRp(n) { return n ? "Rp " + Number(n).toLocaleString("id-ID") : "-"; }

function isMaintenanceDue(next_maintenance) {
  if (!next_maintenance) return false;
  return new Date(next_maintenance) <= new Date(Date.now() + 7 * 86400000);
}

export default function Aset() {
  const { currentMosque: mosque, isMosqueAdmin, isAdmin } = useMosqueContext();
  const [assets, setAssets] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState("semua");
  const [form, setForm] = useState({});

  const canEdit = isMosqueAdmin || isAdmin;

  const load = async () => {
    if (!mosque?.id) return;
    const data = await smartApi.entities.Asset.filter({ mosque_id: mosque.id });
    setAssets(data);
  };

  useEffect(() => { load(); }, [mosque?.id]);

  const openNew = () => {
    setEditing(null);
    setForm({ category: "lainnya", condition: "baik", status: "aktif" });
    setOpen(true);
  };
  const openEdit = (a) => { setEditing(a); setForm({ ...a }); setOpen(true); };

  const handleSave = async () => {
    const data = { ...form, mosque_id: mosque.id };
    if (editing?.id) await smartApi.entities.Asset.update(editing.id, data);
    else await smartApi.entities.Asset.create(data);
    setOpen(false);
    toast.success("Aset tersimpan");
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus aset ini?")) return;
    await smartApi.entities.Asset.delete(id);
    toast.success("Aset dihapus");
    load();
  };

  function exportCSV() {
    const rows = [["Nama","Kategori","Kondisi","Status","Lokasi","Nilai Perolehan","Nilai Saat Ini","Tgl Perolehan","Jadwal Pemeliharaan","Pemeliharaan Terakhir","Pemeliharaan Berikutnya","Keterangan"]];
    assets.forEach(a => rows.push([
      a.name, a.category, a.condition, a.status, a.location || "",
      a.acquisition_value || "", a.current_value || "", a.acquisition_date || "",
      a.maintenance_schedule || "", a.last_maintenance || "", a.next_maintenance || "",
      a.description || ""
    ]));
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `aset-${mosque?.name || "masjid"}.csv`; a.click();
  }

  const filtered = tab === "semua" ? assets
    : tab === "pemeliharaan" ? assets.filter(a => isMaintenanceDue(a.next_maintenance))
    : assets.filter(a => a.category === tab);

  const dueCount = assets.filter(a => isMaintenanceDue(a.next_maintenance)).length;

  const totalValue = assets.reduce((s, a) => s + (a.current_value || a.acquisition_value || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Inventaris Aset" description="Kelola dan pantau semua aset masjid">
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
              <Download className="h-4 w-4" /> Export Laporan
            </Button>
          )}
          {canEdit && (
            <Button onClick={openNew} className="gap-2">
              <Plus className="h-4 w-4" /> Tambah Aset
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Total Aset</p>
          <p className="text-2xl font-bold">{assets.length}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Kondisi Baik</p>
          <p className="text-2xl font-bold text-emerald-600">{assets.filter(a => a.condition === "baik").length}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Perlu Pemeliharaan</p>
          <p className="text-2xl font-bold text-amber-500">{dueCount}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Total Nilai Aset</p>
          <p className="text-lg font-bold">{formatRp(totalValue)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {["semua","pemeliharaan",...CATEGORIES].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${tab === t ? "bg-primary text-white border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}>
            {t === "semua" ? `Semua (${assets.length})`
              : t === "pemeliharaan" ? `⚠️ Pemeliharaan (${dueCount})`
              : t.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="Belum ada aset" description="Mulai tambahkan aset masjid Anda">
          {canEdit && <Button onClick={openNew}><Plus className="h-4 w-4" /> Tambah Aset</Button>}
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(a => {
            const cond = conditionConfig[a.condition] || conditionConfig.baik;
            const due = isMaintenanceDue(a.next_maintenance);
            return (
              <div key={a.id} className={`bg-card rounded-xl border p-4 space-y-3 hover:shadow-md transition-shadow ${due ? "border-amber-300" : ""}`}>
                {a.photo_url && (
                  <img src={a.photo_url} alt={a.name} className="w-full h-32 object-cover rounded-lg" />
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-semibold">{a.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{a.category?.replace(/_/g," ")} {a.location ? `• ${a.location}` : ""}</p>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(a.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cond.color}`}>
                    {a.condition?.replace(/_/g," ")}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{a.status}</span>
                  {due && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium flex items-center gap-1"><Wrench className="h-3 w-3" />Jadwal Pemeliharaan</span>}
                </div>

                {(a.acquisition_value || a.current_value) && (
                  <p className="text-xs text-muted-foreground">Nilai: {formatRp(a.current_value || a.acquisition_value)}</p>
                )}

                {a.maintenance_schedule && (
                  <div className="bg-muted/50 rounded-lg p-2 text-xs space-y-0.5">
                    <p className="font-medium text-muted-foreground flex items-center gap-1"><Wrench className="h-3 w-3" />Pemeliharaan: {a.maintenance_schedule}</p>
                    {a.last_maintenance && <p className="text-muted-foreground">Terakhir: {a.last_maintenance}</p>}
                    {a.next_maintenance && <p className={due ? "text-amber-600 font-semibold" : "text-muted-foreground"}>Berikutnya: {a.next_maintenance}</p>}
                  </div>
                )}

                {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog Form */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Aset" : "Tambah Aset"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nama Aset *</Label><Input className="mt-1" value={form.name || ""} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Kategori</Label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g," ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Kondisi</Label>
                <Select value={form.condition} onValueChange={v => setForm(p => ({ ...p, condition: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CONDITIONS.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g," ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Lokasi Penyimpanan</Label><Input className="mt-1" value={form.location || ""} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Gudang, Ruang A..." /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nilai Perolehan (Rp)</Label><Input className="mt-1" type="number" value={form.acquisition_value || ""} onChange={e => setForm(p => ({ ...p, acquisition_value: Number(e.target.value) }))} /></div>
              <div><Label>Nilai Saat Ini (Rp)</Label><Input className="mt-1" type="number" value={form.current_value || ""} onChange={e => setForm(p => ({ ...p, current_value: Number(e.target.value) }))} /></div>
            </div>
            <div><Label>Tanggal Perolehan</Label><Input className="mt-1" type="date" value={form.acquisition_date || ""} onChange={e => setForm(p => ({ ...p, acquisition_date: e.target.value }))} /></div>

            {/* Maintenance */}
            <div className="border-t pt-3">
              <p className="text-sm font-semibold mb-2 flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" />Jadwal Pemeliharaan</p>
              <div><Label>Frekuensi Pemeliharaan</Label><Input className="mt-1" value={form.maintenance_schedule || ""} onChange={e => setForm(p => ({ ...p, maintenance_schedule: e.target.value }))} placeholder="Contoh: Setiap 3 bulan, Tahunan..." /></div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div><Label>Pemeliharaan Terakhir</Label><Input className="mt-1" type="date" value={form.last_maintenance || ""} onChange={e => setForm(p => ({ ...p, last_maintenance: e.target.value }))} /></div>
                <div><Label>Pemeliharaan Berikutnya</Label><Input className="mt-1" type="date" value={form.next_maintenance || ""} onChange={e => setForm(p => ({ ...p, next_maintenance: e.target.value }))} /></div>
              </div>
              <div className="mt-2"><Label>Catatan Pemeliharaan</Label><Textarea className="mt-1" rows={2} value={form.maintenance_notes || ""} onChange={e => setForm(p => ({ ...p, maintenance_notes: e.target.value }))} /></div>
            </div>

            <div><Label>Keterangan</Label><Textarea className="mt-1" rows={2} value={form.description || ""} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>

            {/* Photo */}
            <div>
              <Label>Foto Aset</Label>
              <div className="flex gap-2 mt-1">
                {form.photo_url && <img src={form.photo_url} alt="" className="w-16 h-16 rounded-lg object-cover border" />}
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm hover:bg-muted">
                  <Upload className="h-4 w-4" /> Upload Foto
                  <input type="file" accept="image/*" className="hidden" onChange={async e => {
                    const file = e.target.files[0]; if (!file) return;
                    const { file_url } = await smartApi.integrations.Core.UploadFile({ file });
                    setForm(p => ({ ...p, photo_url: file_url }));
                  }} />
                </label>
              </div>
            </div>

            <Button className="w-full" onClick={handleSave}>Simpan Aset</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}