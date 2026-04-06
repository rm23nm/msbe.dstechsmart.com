import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function generateSlug(name) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .substring(0, 50) +
    "-" +
    Date.now().toString(36)
  );
}

export default function MosqueFormDialog({ open, onOpenChange, item, onSave }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      name: item?.name || "",
      address: item?.address || "",
      city: item?.city || "",
      province: item?.province || "",
      phone: item?.phone || "",
      email: item?.email || "",
      subscription_plan: item?.subscription_plan || "trial",
      subscription_status: item?.subscription_status || "trial",
      subscription_start: item?.subscription_start
        ? new Date(item.subscription_start).toISOString().split("T")[0]
        : "",
      subscription_end: item?.subscription_end
        ? new Date(item.subscription_end).toISOString().split("T")[0]
        : "",
      status: item?.status || "active",
    });
  }, [item, open]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form };
    // Auto-generate slug for new mosques
    if (!item) {
      payload.slug = generateSlug(form.name);
    }
    // Convert date strings to ISO (backend expects DateTime)
    if (payload.subscription_start) {
      payload.subscription_start = new Date(payload.subscription_start).toISOString();
    } else {
      delete payload.subscription_start;
    }
    if (payload.subscription_end) {
      payload.subscription_end = new Date(payload.subscription_end).toISOString();
    } else {
      delete payload.subscription_end;
    }
    await onSave(payload);
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Masjid" : "Tambah Masjid Baru"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label>
              Nama Masjid <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Masjid Al-Ikhlas"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>
              Alamat <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.address || ""}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Jl. Contoh No.1"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Kota <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.city || ""}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Jakarta"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Provinsi</Label>
              <Input
                value={form.province || ""}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
                placeholder="DKI Jakarta"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telepon</Label>
              <Input
                value={form.phone || ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="021-xxx"
              />
            </div>
            <div className="space-y-2">
              <Label>Email Masjid / Akun Admin <span className="text-destructive">*</span></Label>
              <Input
                type="email"
                value={form.email || ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@masjid.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Password Admin {!item && <span className="text-destructive">*</span>}</Label>
              <Input
                type="password"
                value={form.admin_password || ""}
                onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
                placeholder={item ? "Kosongkan jika tidak diubah" : "Password untuk login admin"}
                required={!item}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {item ? "Isi kolom ini jika ingin mereset password admin masjid." : "Password untuk akun admin_masjid awal."}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Paket Langganan</Label>
              <Select
                value={form.subscription_plan}
                onValueChange={(v) => setForm({ ...form, subscription_plan: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial (Free)</SelectItem>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                  <SelectItem value="triwulan">Triwulan (3 Bulan)</SelectItem>
                  <SelectItem value="semester">Semester (6 Bulan)</SelectItem>
                  <SelectItem value="yearly">Tahunan</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status Langganan</Label>
              <Select
                value={form.subscription_status}
                onValueChange={(v) => setForm({ ...form, subscription_status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="expired">Kedaluwarsa</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mulai Langganan</Label>
              <Input
                type="date"
                value={form.subscription_start || ""}
                onChange={(e) => setForm({ ...form, subscription_start: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Berakhir Langganan</Label>
              <Input
                type="date"
                value={form.subscription_end || ""}
                onChange={(e) => setForm({ ...form, subscription_end: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={saving || !form.name || !form.address || !form.city}
            >
              {saving ? "Menyimpan..." : item ? "Simpan Perubahan" : "Buat Masjid"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
