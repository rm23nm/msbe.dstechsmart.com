import { useState } from "react";
import { smartApi } from "@/api/apiClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X } from "lucide-react";

const ROLES = [
  { value: "jamaah", label: "Jamaah" },
  { value: "pengurus", label: "Pengurus" },
  { value: "bendahara", label: "Bendahara" },
  { value: "admin_masjid", label: "Admin Masjid" },
];

const DEFAULT_CATEGORIES = ["Aktif Kajian", "Donatur", "Remaja Masjid", "Ibu-Ibu Pengajian", "Bapak-Bapak", "PHBI", "Tahfidz"];

export default function JamaahForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState({
    user_name: item?.user_name || "",
    user_email: item?.user_email || "",
    phone: item?.phone || "",
    whatsapp: item?.whatsapp || "",
    address: item?.address || "",
    role: item?.role || "jamaah",
    photo_url: item?.photo_url || "",
    birth_date: item?.birth_date || "",
    categories: item?.categories || [],
    status: item?.status || "active",
  });
  const [loading, setLoading] = useState(false);
  const [catInput, setCatInput] = useState("");

  function addCategory(cat) {
    if (!cat || form.categories.includes(cat)) return;
    setForm(p => ({ ...p, categories: [...p.categories, cat] }));
    setCatInput("");
  }

  function removeCategory(cat) {
    setForm(p => ({ ...p, categories: p.categories.filter(c => c !== cat) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    await onSave(form);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
      {/* Photo */}
      <div className="flex items-center gap-3">
        {form.photo_url
          ? <img src={form.photo_url} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-primary/20" />
          : <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">{(form.user_name || "?")[0].toUpperCase()}</div>
        }
        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm hover:bg-muted">
          <Upload className="h-4 w-4" /> Upload Foto
          <input type="file" accept="image/*" className="hidden" onChange={async e => {
            const file = e.target.files[0]; if (!file) return;
            const { file_url } = await smartApi.integrations.Core.UploadFile({ file });
            setForm(p => ({ ...p, photo_url: file_url }));
          }} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div><Label>Nama Lengkap *</Label><Input className="mt-1" required value={form.user_name} onChange={e => setForm(p => ({ ...p, user_name: e.target.value }))} /></div>
        <div><Label>Email *</Label><Input className="mt-1" type="email" required value={form.user_email} onChange={e => setForm(p => ({ ...p, user_email: e.target.value }))} /></div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div><Label>Telepon</Label><Input className="mt-1" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="08xxx" /></div>
        <div><Label>WhatsApp</Label><Input className="mt-1" value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} placeholder="628xxx" /></div>
      </div>

      <div><Label>Alamat</Label><Input className="mt-1" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>

      <div className="grid grid-cols-2 gap-3">
        <div><Label>Tanggal Lahir</Label><Input className="mt-1" type="date" value={form.birth_date} onChange={e => setForm(p => ({ ...p, birth_date: e.target.value }))} /></div>
        <div><Label>Peran</Label>
          <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {/* Categories */}
      <div>
        <Label>Kategori Jamaah</Label>
        <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
          {form.categories.map(c => (
            <span key={c} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
              {c}
              <button type="button" onClick={() => removeCategory(c)}><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={catInput} onChange={e => setCatInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCategory(catInput); } }}
            placeholder="Ketik kategori..." className="flex-1" />
          <Button type="button" variant="outline" size="sm" onClick={() => addCategory(catInput)}>+</Button>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {DEFAULT_CATEGORIES.filter(c => !form.categories.includes(c)).map(c => (
            <button key={c} type="button" onClick={() => addCategory(c)}
              className="text-xs px-2 py-0.5 rounded-full border border-dashed text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              + {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1" disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
      </div>
    </form>
  );
}