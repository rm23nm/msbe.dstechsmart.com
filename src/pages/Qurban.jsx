import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import { useMosqueContext } from "@/lib/useMosqueContext";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Beef, UserPlus, Trash2, Search, CheckCircle2, AlertCircle, FileText, Download, Users, History, Settings2, Plus, Award } from "lucide-react";
import { toast } from "sonner";
import CertificateModal from "@/components/qurban/CertificateModal";

const ANIMAL_TYPES = ["Sapi", "Kambing", "Domba", "Unta"];
const STATUS_CONFIG = {
  available: { color: "bg-emerald-100 text-emerald-700", label: "Tersedia" },
  full: { color: "bg-blue-100 text-blue-700", label: "Slot Penuh" },
  slaughtered: { color: "bg-amber-100 text-amber-700", label: "Sudah Disembelih" },
  distributed: { color: "bg-slate-100 text-slate-700", label: "Sudah Disalurkan" },
};

function formatRp(n) { return n ? "Rp " + Number(n).toLocaleString("id-ID") : "Rp 0"; }

export default function Qurban() {
  const { currentMosque: mosque } = useMosqueContext();
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modals
  const [openAnimal, setOpenAnimal] = useState(false);
  const [openShohibul, setOpenShohibul] = useState(false);
  const [openCertificate, setOpenCertificate] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  
  // Forms
  const [animalForm, setAnimalForm] = useState({ type: "Sapi", price: 0, total_slots: 7, status: "available" });
  const [shohibulForm, setShohibulForm] = useState({ name: "", phone: "", amount_paid: 0, payment_status: "paid", registration_date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    load();
  }, [mosque?.id]);

  const load = async () => {
    if (!mosque?.id) return;
    try {
      const data = await smartApi.entities.QurbanAnimal.filter({ mosque_id: mosque.id }, { include: { participants: true } });
      setAnimals(data);
    } catch (e) {
      toast.error("Gagal memuat data qurban");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAnimal = async () => {
    try {
      await smartApi.entities.QurbanAnimal.create({ ...animalForm, mosque_id: mosque.id, total_slots: Number(animalForm.total_slots), price: Number(animalForm.price) });
      toast.success("Hewan qurban berhasil ditambahkan");
      setOpenAnimal(false);
      load();
    } catch (e) { toast.error("Gagal menyimpan data"); }
  };

  const handleAddShohibul = async () => {
    if (!selectedAnimal || !shohibulForm.name) return toast.error("Nama wajib diisi");
    try {
      await smartApi.entities.QurbanParticipant.create({
        ...shohibulForm,
        mosque_id: mosque.id,
        animal_id: selectedAnimal.id,
        amount_paid: Number(shohibulForm.amount_paid)
      });
      
      // Update animal status if full
      if (selectedAnimal.participants.length + 1 >= selectedAnimal.total_slots) {
        await smartApi.entities.QurbanAnimal.update(selectedAnimal.id, { status: "full" });
      }
      
      toast.success(`Pekurban ${shohibulForm.name} berhasil didaftarkan`);
      setOpenShohibul(false);
      load();
    } catch (e) { toast.error("Gagal mendaftarkan pekurban"); }
  };

  const handleUpdateStatus = async (animalId, newStatus) => {
    try {
      await smartApi.entities.QurbanAnimal.update(animalId, { status: newStatus });
      toast.success("Status hewan diperbarui");
      load();
    } catch (e) { toast.error("Gagal memperbarui status"); }
  };

  const totalShohibul = animals.reduce((acc, curr) => acc + (curr.participants?.length || 0), 0);

  const filteredAnimals = animals.filter(a => 
    a.type.toLowerCase().includes(search.toLowerCase()) || 
    a.participants?.some(p => p.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Manajemen Qurban" description="Kelola stok hewan, patungan grup, dan pendaftaran pekurban (Shohibul)">
        <Button onClick={() => { setAnimalForm({ type: "Sapi", price: 0, total_slots: 7, status: "available" }); setOpenAnimal(true); }} className="gap-2 rounded-2xl smart-gold-gradient text-white shadow-lg border-0 font-bold">
          <Plus className="h-4 w-4" /> Stok Hewan Baru
        </Button>
      </PageHeader>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-[2rem] p-6 shadow-sm">
           <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Total Hewan</p>
           <p className="text-2xl font-black italic tracking-tighter text-emerald-950">{animals.length} Unit</p>
        </div>
        <div className="bg-white border rounded-[2rem] p-6 shadow-sm">
           <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Total Pekurban</p>
           <p className="text-2xl font-black italic tracking-tighter text-emerald-950">{totalShohibul} Orang</p>
        </div>
        <div className="bg-white border rounded-[2rem] p-6 shadow-sm">
           <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Siap Sembelih</p>
           <p className="text-2xl font-black italic tracking-tighter text-blue-600">{animals.filter(a => a.status === 'full').length} Hewan</p>
        </div>
        <div className="bg-white border rounded-[2rem] p-6 shadow-sm">
           <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Sudah Selesai</p>
           <p className="text-2xl font-black italic tracking-tighter text-amber-600">{animals.filter(a => a.status === 'slaughtered').length} Hewan</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Cari hewan atau pekurban..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-2xl h-12" />
        </div>
      </div>

      {filteredAnimals.length === 0 ? (
        <EmptyState icon={Beef} title="Belum Ada Stok" description="Mulai dengan menambahkan stok hewan qurban (Sapi/Kambing)." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAnimals.map(a => (
            <div key={a.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all p-6 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Beef className="h-32 w-32" />
              </div>
              
              <div className="flex items-start justify-between mb-6">
                 <div>
                    <div className="flex items-center gap-2 mb-1">
                       <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">{a.type}</p>
                       <Badge variant="outline" className={`text-[10px] rounded-full px-3 ${STATUS_CONFIG[a.status]?.color}`}>
                         {STATUS_CONFIG[a.status]?.label}
                       </Badge>
                    </div>
                    <h3 className="text-xl font-black italic tracking-tighter uppercase">{a.type} #{a.id.slice(-4).toUpperCase()}</h3>
                    <p className="text-sm font-bold text-slate-400">{formatRp(a.price)} / Unit</p>
                 </div>
                 
                 <div className="flex flex-col items-end">
                    <p className="text-[10px] font-black uppercase text-slate-300">Slot Terisi</p>
                    <p className="text-2xl font-black italic tracking-tighter text-emerald-600">{a.participants?.length || 0} / {a.total_slots}</p>
                 </div>
              </div>

              {/* Progress Bar Slots */}
              <div className="flex gap-1 mb-6">
                {Array.from({ length: a.total_slots }).map((_, i) => (
                  <div key={i} className={`h-2 flex-1 rounded-full ${i < (a.participants?.length || 0) ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                ))}
              </div>

              {/* Shohibul List */}
              <div className="space-y-2 mb-6">
                 <p className="text-[10px] font-black uppercase text-slate-400 ml-2">Shohibul Qurban:</p>
                 <div className="space-y-3">
                    {a.participants?.map((p, idx) => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group/item hover:bg-white hover:shadow-sm transition-all">
                        <div className="flex items-center gap-3">
                          <div className="text-xs font-black text-slate-300">#0{idx + 1}</div>
                          <div>
                            <p className="text-sm font-black italic tracking-tighter uppercase text-slate-700">{p.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">Lunas: {formatRp(p.amount_paid)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover/item:opacity-100 transition-all">
                           <Button variant="ghost" size="sm" 
                             onClick={() => {
                               setSelectedParticipant({...p, animalType: a.type});
                               setOpenCertificate(true);
                             }}
                             className="h-8 px-3 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-bold text-[10px] uppercase gap-2 shadow-sm border border-emerald-100"
                           >
                             <Award className="h-3 w-3" /> Sertifikat
                           </Button>
                           <Button variant="ghost" size="sm" className="h-8 w-8 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 p-0">
                              <Trash2 className="h-3 w-3" />
                           </Button>
                        </div>
                      </div>
                    ))}
                    {(a.participants?.length || 0) < a.total_slots && (
                       <Button variant="ghost" className="w-full h-10 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 hover:border-emerald-200 hover:text-emerald-500 hover:bg-emerald-50 text-[10px] font-black uppercase" onClick={() => { setSelectedAnimal(a); setOpenShohibul(true); }}>
                          <UserPlus className="h-3 w-3 mr-2" /> Tambah Pekurban
                       </Button>
                    )}
                 </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                 <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl h-9 text-[10px] font-black uppercase border-slate-200 font-bold">
                       <FileText className="h-3 w-3 mr-1" /> Daftar
                    </Button>
                    {a.status === 'full' && (
                       <Button size="sm" onClick={() => handleUpdateStatus(a.id, 'slaughtered')} className="rounded-xl h-9 text-[10px] font-black uppercase bg-slate-900 text-white font-bold">
                          Sembelih Hewan
                       </Button>
                    )}
                 </div>
                 <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-300 hover:text-red-500 rounded-xl">
                    <Trash2 className="h-4 w-4" />
                 </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Animal Form Dialog */}
      <Dialog open={openAnimal} onOpenChange={setOpenAnimal}>
        <DialogContent className="rounded-[3rem] p-8 max-w-sm">
          <DialogHeader><DialogTitle className="text-2xl font-black italic tracking-tighter uppercase">Stok Hewan Baru</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-2 text-slate-400">Jenis Hewan</Label>
                <Select value={animalForm.type} onValueChange={v => setAnimalForm({...animalForm, type: v})}>
                  <SelectTrigger className="rounded-2xl h-12 uppercase font-black italic"><SelectValue /></SelectTrigger>
                  <SelectContent>{ANIMAL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase ml-2 text-slate-400">Harga Per Unit</Label>
                   <Input type="number" value={animalForm.price} onChange={e => setAnimalForm({...animalForm, price: e.target.value})} className="rounded-2xl h-12" />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase ml-2 text-slate-400">Total Slot (Patungan)</Label>
                   <Input type="number" value={animalForm.total_slots} onChange={e => setAnimalForm({...animalForm, total_slots: e.target.value})} className="rounded-2xl h-12" />
                </div>
             </div>
             
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-2 text-slate-400">Catatan (Berat/Asal)</Label>
                <Input value={animalForm.notes || ""} onChange={e => setAnimalForm({...animalForm, notes: e.target.value})} className="rounded-2xl h-12" placeholder="Contoh: Sapi Madura ~400kg" />
             </div>
             
             <Button onClick={handleSaveAnimal} className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black italic tracking-tighter text-xl mt-4 shadow-xl shadow-emerald-100">
                TAMBAH STOK HEWAN
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shohibul Form Dialog */}
      <Dialog open={openShohibul} onOpenChange={setOpenShohibul}>
        <DialogContent className="rounded-[3rem] p-8 max-w-sm">
          <DialogHeader><DialogTitle className="text-2xl font-black italic tracking-tighter uppercase text-center">Pendaftaran Pekurban</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Mendaftar untuk:</p>
                <p className="text-sm font-black italic uppercase tracking-tighter">{selectedAnimal?.type} #{selectedAnimal?.id.slice(-4).toUpperCase()}</p>
             </div>
             
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-2 text-slate-400">Nama Lengkap Pekurban (Shohibul)</Label>
                <Input value={shohibulForm.name} onChange={e => setShohibulForm({...shohibulForm, name: e.target.value})} className="rounded-2xl h-12 uppercase font-black" placeholder="Contoh: Fulan bin Fulan" />
             </div>
             
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-2 text-slate-400">No. WhatsApp</Label>
                <Input value={shohibulForm.phone || ""} onChange={e => setShohibulForm({...shohibulForm, phone: e.target.value})} className="rounded-2xl h-12" placeholder="08..." />
             </div>

             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase ml-2 text-slate-400">Status Pembayaran</Label>
                <Select value={shohibulForm.payment_status} onValueChange={v => setShohibulForm({...shohibulForm, payment_status: v})}>
                  <SelectTrigger className="rounded-2xl h-12 uppercase font-black italic"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">LUNAS</SelectItem>
                    <SelectItem value="pending">PENDING / DP</SelectItem>
                  </SelectContent>
                </Select>
             </div>

             <Button onClick={handleAddShohibul} className="w-full h-16 rounded-[2rem] bg-emerald-950 text-white font-black italic tracking-tighter text-xl mt-4 shadow-2xl">
                DAFTARKAN PEKURBAN
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CertificateModal 
        open={openCertificate} 
        onOpenChange={setOpenCertificate} 
        data={selectedParticipant} 
        mosque={mosque} 
      />
    </div>
  );
}
