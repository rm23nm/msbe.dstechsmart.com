import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const types = [
  { value: "shalat", label: "Shalat" },
  { value: "kajian", label: "Kajian" },
  { value: "pengajian", label: "Pengajian" },
  { value: "ramadhan", label: "Ramadhan" },
  { value: "idul_adha", label: "Idul Adha" },
  { value: "idul_fitri", label: "Idul Fitri" },
  { value: "sosial", label: "Kegiatan Sosial" },
  { value: "rapat", label: "Rapat" },
  { value: "lainnya", label: "Lainnya" },
];

export default function ActivityForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: item?.title || "",
    description: item?.description || "",
    type: item?.type || "kajian",
    date: item?.date || new Date().toISOString().split('T')[0],
    time_start: item?.time_start || "",
    time_end: item?.time_end || "",
    location: item?.location || "",
    imam: item?.imam || "",
    muadzin: item?.muadzin || "",
    status: item?.status || "upcoming",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="space-y-2">
        <Label>Judul Kegiatan</Label>
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Nama kegiatan" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Jenis</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {types.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Mendatang</SelectItem>
              <SelectItem value="ongoing">Berlangsung</SelectItem>
              <SelectItem value="completed">Selesai</SelectItem>
              <SelectItem value="cancelled">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Tanggal</Label>
          <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label>Jam Mulai</Label>
          <Input type="time" value={form.time_start} onChange={(e) => setForm({ ...form, time_start: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Jam Selesai</Label>
          <Input type="time" value={form.time_end} onChange={(e) => setForm({ ...form, time_end: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Imam / Pemateri</Label>
          <Input value={form.imam} onChange={(e) => setForm({ ...form, imam: e.target.value })} placeholder="Nama imam" />
        </div>
        <div className="space-y-2">
          <Label>Muadzin</Label>
          <Input value={form.muadzin} onChange={(e) => setForm({ ...form, muadzin: e.target.value })} placeholder="Nama muadzin" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Lokasi</Label>
        <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Lokasi kegiatan" />
      </div>

      <div className="space-y-2">
        <Label>Deskripsi</Label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi kegiatan..." rows={3} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={saving || !form.title}>
          {saving ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}