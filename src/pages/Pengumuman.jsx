import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import { useMosqueContext } from "@/lib/useMosqueContext";
import { formatDate } from "@/lib/formatCurrency";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import { Button } from "@/components/ui/button";
import { Plus, Megaphone, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Pengumuman() {
  const { currentMosque, loading, isPengurus } = useMosqueContext();
  const [announcements, setAnnouncements] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);

  useEffect(() => {
    if (currentMosque) loadData();
  }, [currentMosque]);

  async function loadData() {
    setDataLoading(true);
    const anns = await smartApi.entities.Announcement.filter({ mosque_id: currentMosque.id }, '-created_date', 50);
    setAnnouncements(anns);
    setDataLoading(false);
  }

  async function handleSave(data) {
    if (editItem) {
      await smartApi.entities.Announcement.update(editItem.id, data);
    } else {
      await smartApi.entities.Announcement.create({ ...data, mosque_id: currentMosque.id });
    }
    setShowForm(false);
    setEditItem(null);
    loadData();
  }

  async function handleDelete(id) {
    await smartApi.entities.Announcement.delete(id);
    loadData();
  }

  if (loading || !currentMosque) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const priorityLabels = { high: "Penting", medium: "Sedang", low: "Biasa" };
  const priorityColors = { high: "bg-red-100 text-red-700", medium: "bg-amber-100 text-amber-700", low: "bg-blue-100 text-blue-700" };

  return (
    <div className="space-y-6">
      <PageHeader title="Pengumuman" description="Kelola pengumuman masjid">
        {isPengurus && (
          <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Buat Pengumuman
          </Button>
        )}
      </PageHeader>

      {dataLoading ? (
        <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
      ) : announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="Belum Ada Pengumuman" description="Buat pengumuman untuk jamaah" />
      ) : (
        <div className="space-y-4">
          {announcements.map(a => (
            <div key={a.id} className="bg-card rounded-xl border p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{a.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityColors[a.priority] || priorityColors.low}`}>
                      {priorityLabels[a.priority] || "Biasa"}
                    </span>
                    <Badge variant={a.status === 'published' ? 'default' : 'secondary'}>
                      {a.status === 'published' ? 'Terbit' : a.status === 'draft' ? 'Draft' : 'Arsip'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">{formatDate(a.created_date)}</p>
                </div>
                {isPengurus && (
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditItem(a); setShowForm(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditItem(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Pengumuman' : 'Buat Pengumuman'}</DialogTitle>
          </DialogHeader>
          <AnnouncementForm item={editItem} onSave={handleSave} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AnnouncementForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: item?.title || "",
    content: item?.content || "",
    priority: item?.priority || "low",
    status: item?.status || "published",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Judul</Label>
        <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Judul pengumuman" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Prioritas</Label>
          <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Biasa</SelectItem>
              <SelectItem value="medium">Sedang</SelectItem>
              <SelectItem value="high">Penting</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Terbit</SelectItem>
              <SelectItem value="archived">Arsip</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Isi Pengumuman</Label>
        <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required placeholder="Tulis isi pengumuman..." rows={5} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={saving || !form.title || !form.content}>
          {saving ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}