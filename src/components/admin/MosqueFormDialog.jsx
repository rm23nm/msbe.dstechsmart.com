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
      subscription_start: item?.subscription_start || "",
      subscription_end: item?.subscription_end || "",
      status: item?.status || "active",
    });
  }, [item, open]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Masjid' : 'Tambah Masjid'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>Nama Masjid</Label>
            <Input value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Alamat</Label>
            <Input value={form.address || ""} onChange={e => setForm({ ...form, address: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kota</Label>
              <Input value={form.city || ""} onChange={e => setForm({ ...form, city: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Provinsi</Label>
              <Input value={form.province || ""} onChange={e => setForm({ ...form, province: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telepon</Label>
              <Input value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Paket Langganan</Label>
              <Select value={form.subscription_plan} onValueChange={v => setForm({ ...form, subscription_plan: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                  <SelectItem value="yearly">Tahunan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status Langganan</Label>
              <Select value={form.subscription_status} onValueChange={v => setForm({ ...form, subscription_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Input type="date" value={form.subscription_start || ""} onChange={e => setForm({ ...form, subscription_start: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Berakhir Langganan</Label>
              <Input type="date" value={form.subscription_end || ""} onChange={e => setForm({ ...form, subscription_end: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={saving || !form.name}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}