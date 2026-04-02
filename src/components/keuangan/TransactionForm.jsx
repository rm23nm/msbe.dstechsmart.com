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

const incomeCategories = [
  "Donasi", "Zakat", "Infak", "Wakaf", "Sewa Fasilitas", "Kotak Amal", "Jumat", "Lainnya"
];

const expenseCategories = [
  "Operasional", "Listrik & Air", "Perbaikan", "Kebersihan", "Honor Imam/Muadzin", 
  "Kegiatan Sosial", "Perlengkapan", "Pembangunan", "Lainnya"
];

export default function TransactionForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState({
    type: item?.type || "income",
    category: item?.category || "",
    amount: item?.amount || "",
    description: item?.description || "",
    date: item?.date || new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);

  const categories = form.type === "income" ? incomeCategories : expenseCategories;

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...form, amount: Number(form.amount) });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Jenis</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v, category: "" })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Pemasukan</SelectItem>
              <SelectItem value="expense">Pengeluaran</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tanggal</Label>
          <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Kategori</Label>
        <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
          <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
          <SelectContent>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Jumlah (Rp)</Label>
        <Input 
          type="number" 
          placeholder="0" 
          value={form.amount} 
          onChange={(e) => setForm({ ...form, amount: e.target.value })} 
          required 
        />
      </div>

      <div className="space-y-2">
        <Label>Keterangan</Label>
        <Textarea 
          placeholder="Deskripsi transaksi..." 
          value={form.description} 
          onChange={(e) => setForm({ ...form, description: e.target.value })} 
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={saving || !form.category || !form.amount}>
          {saving ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}