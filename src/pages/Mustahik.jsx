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
import { 
  Users, Plus, Pencil, Trash2, Heart, ShieldCheck, Search, HandHelping, 
  Landmark, History, Upload, Image as ImageIcon, CheckCircle2, X 
} from "lucide-react";
import { toast } from "sonner";

const ASNAF_CATEGORIES = [
  "Fakir", "Miskin", "Amil", "Mu'allaf", "Riqab", "Gharim", "Fisabilillah", "Ibnu Sabil"
];

const STATUS_CONFIG = {
  pending: { color: "bg-amber-100 text-amber-700", label: "Menunggu Verifikasi" },
  verified: { color: "bg-emerald-100 text-emerald-700", label: "Terverifikasi" },
  rejected: { color: "bg-red-100 text-red-700", label: "Ditolak" },
};

function formatRp(n) { return n ? "Rp " + Number(n).toLocaleString("id-ID") : "Rp 0"; }

export default function Mustahik() {
  const { currentMosque: mosque } = useMosqueContext();
  const [mustahiks, setMustahiks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("semua");
  
  // Modals
  const [openForm, setOpenForm] = useState(false);
  const [openAid, setOpenAid] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedMustahik, setSelectedMustahik] = useState(null);
  
  const [form, setForm] = useState({});
  const [aidForm, setAidForm] = useState({ 
    amount: 0, 
    source_type: "infaq", 
    distribution_date: new Date().toISOString().split('T')[0],
    photo_url: "",
    notes: "" 
  });
  const [aidHistory, setAidHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    load();
  }, [mosque?.id]);

  const load = async () => {
    if (!mosque?.id) return;
    try {
      const data = await smartApi.entities.Mustahik.filter({ mosque_id: mosque.id });
      setMustahiks(data);
    } catch (e) {
      toast.error("Gagal memuat data mustahik");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMustahik = async () => {
    const data = { ...form, mosque_id: mosque.id };
    try {
      if (editing?.id) await smartApi.entities.Mustahik.update(editing.id, data);
      else await smartApi.entities.Mustahik.create(data);
      toast.success("Data mustahik berhasil disimpan");
      setOpenForm(false);
      load();
    } catch (e) { toast.error("Gagal menyimpan data"); }
  };

  const handleDistributeAid = async () => {
    if (!selectedMustahik || !aidForm.amount) return toast.error("Lengkapi data bantuan");
    try {
      await smartApi.entities.AidDistribution.create({
        ...aidForm,
        mosque_id: mosque.id,
        mustahik_id: selectedMustahik.id,
        amount: Number(aidForm.amount)
      });
      // Update last aid date
      await smartApi.entities.Mustahik.update(selectedMustahik.id, {
        last_aid_date: aidForm.distribution_date
      });
      toast.success(`Bantuan berhasil disalurkan ke ${selectedMustahik.name}`);
      setOpenAid(false);
      setAidForm({ amount: 0, source_type: "infaq", distribution_date: new Date().toISOString().split('T')[0], photo_url: "", notes: "" });
      load();
    } catch (e) { toast.error("Gagal menyalurkan bantuan"); }
  };

  const loadHistory = async (mustahikId) => {
    setLoadingHistory(true);
    try {
      const data = await smartApi.entities.AidDistribution.filter({ mustahik_id: mustahikId }, "-distribution_date");
      setAidHistory(data);
    } catch (e) {
      toast.error("Gagal memuat riwayat");
    } finally {
      setLoadingHistory(false);
    }
  };

  const filtered = mustahiks.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === "semua" || m.asnaf_category.toLowerCase() === tab.toLowerCase();
    return matchSearch && matchTab;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Manajemen Mustahik" description="Data penerima manfaat zakat dan bantuan sosial">
        <Button onClick={() => { setEditing(null); setForm({ asnaf_category: "Miskin", status: "pending" }); setOpenForm(true); }} className="gap-2 rounded-2xl shadow-lg shadow-emerald-100">
          <Plus className="h-4 w-4" /> Tambah Mustahik
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Users className="h-6 w-6" /></div>
            <div>
              <p className="text-xs font-black uppercase text-slate-400">Total Mustahik</p>
              <p className="text-2xl font-black italic tracking-tighter">{mustahiks.length} Orang</p>
            </div>
          </div>
        </div>
        <div className="bg-white border rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><ShieldCheck className="h-6 w-6" /></div>
            <div>
              <p className="text-xs font-black uppercase text-slate-400">Terverifikasi</p>
              <p className="text-2xl font-black italic tracking-tighter text-emerald-600">{mustahiks.filter(m => m.status === 'verified').length} Orang</p>
            </div>
          </div>
        </div>
        <div className="bg-white border rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><HandHelping className="h-6 w-6" /></div>
            <div>
              <p className="text-xs font-black uppercase text-slate-400">Menunggu Survey</p>
              <p className="text-2xl font-black italic tracking-tighter text-amber-500">{mustahiks.filter(m => m.status === 'pending').length} Orang</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl overflow-x-auto w-full md:w-auto">
          {["semua", ...ASNAF_CATEGORIES].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all whitespace-nowrap ${tab === t ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
           <Input placeholder="Cari nama..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-2xl border-slate-200" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Heart} title="Data Kosong" description="Belum ada mustahik yang terdaftar di kategori ini." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(m => (
            <div key={m.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all p-6 group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                      {m.name.charAt(0)}
                   </div>
                   <div>
                      <h3 className="font-black italic tracking-tighter uppercase text-slate-800">{m.name}</h3>
                      <p className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">{m.asnaf_category}</p>
                   </div>
                </div>
                <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${STATUS_CONFIG[m.status]?.color}`}>
                  {STATUS_CONFIG[m.status]?.label}
                </span>
              </div>

              <div className="space-y-2 mb-6">
                 <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Landmark className="h-3 w-3" />
                    <span>{m.address || "Alamat tidak tersedia"}</span>
                 </div>
                 <div className="flex items-center gap-2 text-xs text-slate-500">
                    <History className="h-3 w-3" />
                    <span>Bantuan Terakhir: {m.last_aid_date || "Belum ada"}</span>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                 <Button variant="outline" size="sm" onClick={() => { setEditing(m); setForm({ ...m }); loadHistory(m.id); setOpenForm(true); }} className="rounded-xl border-slate-200 h-10 font-bold text-xs uppercase">
                    <Pencil className="h-3 w-3 mr-2" /> Detail & Riwayat
                 </Button>
                 <Button size="sm" disabled={m.status !== 'verified'} onClick={() => { setSelectedMustahik(m); setOpenAid(true); }} className="rounded-xl h-10 font-black italic tracking-tighter uppercase text-xs">
                    <HandHelping className="h-3 w-3 mr-2" /> Salurkan
                 </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="rounded-[3rem] p-8 max-w-lg">
          <DialogHeader><DialogTitle className="text-2xl font-black italic tracking-tighter uppercase">{editing ? "Edit Profile Mustahik" : "Tambah Mustahik Baru"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Nama Lengkap</Label>
                <Input value={form.name || ""} onChange={e => setForm({...form, name: e.target.value})} className="rounded-2xl h-12" placeholder="Nama..." />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">No. HP/Kontak</Label>
                <Input value={form.phone || ""} onChange={e => setForm({...form, phone: e.target.value})} className="rounded-2xl h-12" placeholder="08..." />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Kategori Asnaf</Label>
                <Select value={form.asnaf_category} onValueChange={v => setForm({...form, asnaf_category: v})}>
                  <SelectTrigger className="rounded-2xl h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>{ASNAF_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Status Verifikasi</Label>
                <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                  <SelectTrigger className="rounded-2xl h-12 text-emerald-600 font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Menunggu Survey</SelectItem>
                    <SelectItem value="verified">Terverifikasi</SelectItem>
                    <SelectItem value="rejected">Ditolak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
               <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Alamat Tinggal</Label>
               <Input value={form.address || ""} onChange={e => setForm({...form, address: e.target.value})} className="rounded-2xl h-12" />
            </div>
            <div className="space-y-2">
               <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Catatan Kelayakan (Hasil Survey)</Label>
               <Textarea value={form.notes || ""} onChange={e => setForm({...form, notes: e.target.value})} className="rounded-2xl min-h-[100px]" placeholder="Kondisi ekonomi, tanggungan, dll..." />
            </div>
            <Button onClick={handleSaveMustahik} className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black italic tracking-tighter text-xl mt-4 shadow-xl shadow-emerald-100">
               SIMPAN DATA AMANAH
            </Button>

            {editing && (
              <div className="mt-8 pt-8 border-t border-slate-100">
                <h4 className="text-xl font-black italic tracking-tighter uppercase mb-4 flex items-center gap-2">
                  <History className="h-5 w-5 text-emerald-600" /> Riwayat Penyaluran
                </h4>
                {loadingHistory ? (
                  <div className="text-center py-4 text-xs italic text-slate-400">Memuat riwayat...</div>
                ) : aidHistory.length === 0 ? (
                  <div className="bg-slate-50 rounded-2xl p-6 text-center text-xs text-slate-400 italic">
                    Belum ada catatan bantuan untuk mustahik ini.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {aidHistory.map(h => (
                      <div key={h.id} className="bg-white border rounded-2xl p-4 shadow-sm flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          {h.photo_url ? (
                            <div className="w-12 h-12 rounded-xl overflow-hidden border shadow-sm flex-shrink-0">
                               <img src={h.photo_url} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0">
                               <ImageIcon className="h-5 w-5 text-slate-300" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-black italic tracking-tighter text-slate-800 uppercase">{formatRp(h.amount)}</p>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{h.source_type.replace('_',' ')} • {h.distribution_date}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-[9px] uppercase font-black">Disalurkan</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Aid Distribution Dialog */}
      <Dialog open={openAid} onOpenChange={setOpenAid}>
        <DialogContent className="rounded-[3rem] p-8 max-w-sm">
          <DialogHeader><DialogTitle className="text-2xl font-black italic tracking-tighter uppercase text-center">Salurkan Bantuan</DialogTitle></DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="space-y-2 text-left">
               <Label className="text-[10px] font-black ml-2 uppercase tracking-widest text-slate-400">Bantuan (Rp / Nilai Barang)</Label>
               <Input type="number" value={aidForm.amount} onChange={e => setAidForm({...aidForm, amount: e.target.value})} className="rounded-2xl h-14 text-center text-2xl font-black italic tracking-tighter shadow-inner" />
            </div>

            <div className="space-y-3 text-left">
               <Label className="text-[10px] font-black ml-2 uppercase tracking-widest text-slate-400">Foto Bukti Penyerahan Amanah</Label>
               <div className="flex gap-3">
                  {aidForm.photo_url ? (
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-lg flex-shrink-0">
                       <img src={aidForm.photo_url} className="w-full h-full object-cover" />
                       <button onClick={() => setAidForm({...aidForm, photo_url: ""})} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-xl"><X className="h-3 w-3"/></button>
                    </div>
                  ) : (
                    <label className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-all flex-shrink-0">
                       <Upload className="h-5 w-5 text-slate-400" />
                       <input type="file" accept="image/*" className="hidden" 
                         onChange={async e => {
                           const file = e.target.files[0];
                           if (!file) return;
                           toast.loading("Mengunggah foto...");
                           try {
                             const { file_url } = await smartApi.integrations.Core.UploadFile({ file });
                             setAidForm(f => ({ ...f, photo_url: file_url }));
                             toast.dismiss();
                             toast.success("Foto amanah berhasil diunggah");
                           } catch (err) { toast.dismiss(); toast.error("Gagal upload"); }
                         }}
                       />
                    </label>
                  )}
                  <Input 
                    value={aidForm.photo_url} 
                    onChange={e => setAidForm({...aidForm, photo_url: e.target.value})}
                    placeholder="Atau tempel link foto bukti..." 
                    className="rounded-2xl h-16 text-[10px] font-medium"
                  />
               </div>
            </div>

            <div className="space-y-2 text-left">
               <Label className="text-[10px] font-black ml-2 uppercase tracking-widest text-slate-400">Catatan Khusus Penyerahan</Label>
               <Textarea value={aidForm.notes} onChange={e => setAidForm({...aidForm, notes: e.target.value})} className="rounded-2xl h-20 text-xs" placeholder="Misal: Diterima oleh istrinya..." />
            </div>

            <div className="space-y-2 text-left">
               <Label className="text-[10px] font-black ml-2 uppercase tracking-widest text-slate-400">Sumber Dana Berkah</Label>
               <Select value={aidForm.source_type} onValueChange={v => setAidForm({...aidForm, source_type: v})}>
                  <SelectTrigger className="rounded-2xl h-14 uppercase font-black italic text-sm shadow-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="zakat_maal" className="font-bold">ZAKAT MAAL</SelectItem>
                    <SelectItem value="zakat_fitrah" className="font-bold">ZAKAT FITRAH</SelectItem>
                    <SelectItem value="infaq" className="font-bold">INFAQ UMUM</SelectItem>
                    <SelectItem value="shodaqoh" className="font-bold">SHODAQOH</SelectItem>
                  </SelectContent>
               </Select>
            </div>
            
            <Button onClick={handleDistributeAid} className="w-full h-16 rounded-[2rem] bg-slate-900 hover:bg-black text-white font-black italic tracking-tighter text-2xl mt-4 shadow-2xl scale-100 hover:scale-[1.02] active:scale-95 transition-all">
               <CheckCircle2 className="h-6 w-6 mr-2 text-emerald-400" /> KONFIRMASI SALURKAN
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
