import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import { 
  Key, Plus, ShieldCheck, ShieldAlert, Copy, ExternalLink, 
  Terminal, Server, Globe, CheckCircle2, Info, Ticket, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AdminLicenses() {
  const [licenses, setLicenses] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [mosques, setMosques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  
  const [newLicense, setNewLicense] = useState({ 
    key: `MS-${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
    mosque_id: "",
    domain: "" 
  });

  const [newVoucher, setNewVoucher] = useState({
    code: "",
    discount_type: "fixed",
    discount_value: 0,
    max_usage: 10
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [licList, msqList, vchList] = await Promise.all([
        smartApi.entities.License.list(),
        smartApi.entities.Mosque.list(),
        smartApi.entities.Voucher.list()
      ]);
      setLicenses(licList || []);
      setMosques(msqList || []);
      setVouchers(vchList || []);
    } catch (e) {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLicense = async () => {
    if (!newLicense.mosque_id) return toast.error("Pilih masjid terlebih dahulu");
    try {
      await smartApi.entities.License.create(newLicense);
      toast.success("Lisensi berhasil dirilis!");
      setIsAddOpen(false);
      loadData();
    } catch (e) {
      toast.error("Gagal menambahkan lisensi");
    }
  };

  const handleAddVoucher = async () => {
    if (!newVoucher.code) return toast.error("Kode voucher wajib diisi");
    try {
      await smartApi.entities.Voucher.create({
        ...newVoucher,
        discount_value: parseFloat(newVoucher.discount_value),
        max_usage: parseInt(newVoucher.max_usage)
      });
      toast.success("Voucher berhasil dibuat!");
      setShowVoucherModal(false);
      loadData();
    } catch (e) {
      toast.error("Gagal membuat voucher");
    }
  };

  const handleDeleteVoucher = async (id) => {
    if (!confirm("Hapus voucher ini?")) return;
    try {
      await smartApi.entities.Voucher.delete(id);
      toast.success("Voucher dihapus");
      loadData();
    } catch (e) { toast.error("Gagal menghapus"); }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Teks berhasil disalin!");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
            <Key className="w-10 h-10 text-emerald-500" />
            Manajemen Aktivasi & Voucher
            <Badge className="bg-emerald-100 text-emerald-700 border-none ml-2 text-xs font-black uppercase tracking-tighter">Fitur Whitelist Domain</Badge>
          </h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">Kelola lisensi standalone (White-Label / Whitelist) dan kampanye diskon digital Bapak.</p>
        </div>
        
        <div className="flex gap-3">
          <Button onClick={() => setShowVoucherModal(true)} variant="outline" className="h-12 px-6 rounded-xl border-slate-200 gap-2">
            <Ticket className="w-4 h-4" /> Buat Voucher
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 h-12 px-6 rounded-xl shadow-lg shadow-emerald-600/20 gap-2 font-bold">
                <Plus className="w-5 h-5" /> Rilis Lisensi Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white border-none rounded-2xl shadow-2xl">
              <DialogHeader><DialogTitle className="text-2xl font-bold">Terbitkan Lisensi Khusus</DialogTitle></DialogHeader>
              <div className="space-y-6 py-4 text-slate-700">
                <div className="space-y-2">
                  <label className="text-sm font-bold">Pilih Masjid Tujuan</label>
                  <Select value={newLicense.mosque_id} onValueChange={(v) => setNewLicense({...newLicense, mosque_id: v})}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Pilih Masjid" /></SelectTrigger>
                    <SelectContent>
                      {mosques.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400">Kunci Lisensi (Otomatis)</label>
                  <Input value={newLicense.key} readOnly className="h-12 bg-slate-50 border-none font-mono text-emerald-600 text-lg" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Domain Client (Opsional)</label>
                  <Input placeholder="masjid-raya.com" value={newLicense.domain} onChange={(e) => setNewLicense({...newLicense, domain: e.target.value})} className="h-12 rounded-xl" />
                </div>
                <Button onClick={handleAddLicense} className="w-full bg-emerald-600 hover:bg-emerald-700 h-14 rounded-xl text-lg font-bold">Aktivasi Kode</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Table Section (2/3) */}
        <div className="lg:col-span-2 space-y-12">
          {/* Licenses Table */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/50">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
               <h2 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest text-xs">Aktivasi Terdaftar</h2>
               <Badge className="bg-emerald-100 text-emerald-700 border-none">{licenses.length} Aktif</Badge>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/20 border-b border-slate-100 text-[10px] uppercase font-black tracking-widest text-slate-400">
                  <th className="px-6 py-4">Masjid Client</th>
                  <th className="px-6 py-4">License Key</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {licenses.map((lic) => (
                  <tr key={lic.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 capitalize leading-none">{lic.mosque?.name || "N/A"}</div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-bold italic uppercase"><Globe className="w-2.5 h-2.5" /> {lic.domain || "GLOBAL"}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-emerald-600 font-bold">{lic.key}</td>
                    <td className="px-6 py-4 text-center">
                       <Button variant="ghost" size="icon" onClick={() => copyToClipboard(lic.key)} className="hover:bg-emerald-50 rounded-lg group">
                          <Copy className="w-4 h-4 text-slate-300 group-hover:text-emerald-500" />
                       </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vouchers Panel */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-xl">
             <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <h2 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest text-xs">Vouchers Diskon</h2>
             </div>
             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {vouchers.map(v => (
                  <div key={v.id} className="p-5 rounded-2xl border border-slate-50 bg-slate-50/30 flex justify-between items-center">
                    <div>
                      <div className="text-[10px] font-black text-emerald-500 tracking-tighter uppercase mb-0.5">{v.code}</div>
                      <div className="text-xl font-black text-slate-900">
                        {v.discount_type === 'percent' ? `${v.discount_value}%` : `Rp ${v.discount_value.toLocaleString()}`}
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Kuota: {v.current_usage}/{v.max_usage}</p>
                    </div>
                    <button onClick={() => handleDeleteVoucher(v.id)} className="p-2 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {vouchers.length === 0 && <p className="col-span-2 py-4 text-center text-xs text-slate-400 italic">Belum ada promo aktif.</p>}
             </div>
          </div>
        </div>

        {/* Guidance Section (1/3) */}
        <div className="space-y-6">
            <h3 className="text-xl font-black flex items-center gap-2 mb-6">
              <Server className="w-6 h-6 text-emerald-400" /> Panduan Whitelist Client
            </h3>
            <div className="space-y-8 relative z-10">
              <div className="space-y-3">
                <p className="text-[10px] uppercase font-black tracking-widest text-emerald-400">Tahap 1: Packaging (Sub-Produk)</p>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[11px] leading-relaxed mb-3 text-slate-400">Jalankan <code className="bg-emerald-500/20 text-emerald-400 px-1 rounded font-mono">SIAP_DEPLOY.bat</code> untuk membungkus folder <code className="text-white font-bold">sub_masjidkusmart</code>.</p>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard("SIAP_DEPLOY.bat")} className="bg-white/5 border-white/10 text-[10px] gap-2 h-8 w-full font-bold uppercase transition-all hover:bg-emerald-500 hover:text-white">
                     <Copy className="w-3 h-3" /> SIAP_DEPLOY.bat
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] uppercase font-black tracking-widest text-emerald-400">Tahap 2: Config Whitelist (.env)</p>
                <div className="bg-black/40 p-4 rounded-2xl font-mono text-[9px] text-emerald-100 leading-relaxed border border-white/5 relative group/btn">
                  <pre className="opacity-80"># Aktifkan Mode Mandiri (Whitelist){"\n"}VITE_SINGLE_MOSQUE_MODE=true{"\n"}# Pangkalan Server Pusat Bapak{"\n"}LICENSE_SERVER_URL=https://msbe.dstechsmart.com</pre>
                  <Copy className="absolute top-2 right-2 w-3 h-3 opacity-0 group-hover/btn:opacity-50 cursor-pointer" onClick={() => copyToClipboard("VITE_SINGLE_MOSQUE_MODE=true\nLICENSE_SERVER_URL=https://msbe.dstechsmart.com")} />
                </div>
              </div>
              <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                 <p className="text-[10px] text-emerald-400 font-bold leading-tight flex items-center gap-2 italic">
                   <Info className="w-3 h-3" /> Pastikan Domain Client sudah di-pointing (A Record) ke IP Server Bapak.
                 </p>
              </div>
            </div>
        </div>
      </div>

      {/* Modal Voucher */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 border border-slate-100">
            <h3 className="text-2xl font-black text-slate-900 mb-6">Voucher Baru</h3>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Kode Voucher</Label>
                <Input value={newVoucher.code} onChange={e => setNewVoucher({...newVoucher, code: e.target.value.toUpperCase()})} placeholder="PROMO50" className="h-12 rounded-xl font-black uppercase text-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Tipe</Label>
                  <select className="w-full h-12 border border-slate-200 rounded-xl px-4 text-sm font-bold appearance-none outline-none focus:ring-2 ring-emerald-500" value={newVoucher.discount_type} onChange={e => setNewVoucher({...newVoucher, discount_type: e.target.value})}>
                     <option value="fixed">Rupiah (Rp)</option>
                     <option value="percent">Persen (%)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Nilai</Label>
                  <Input type="number" value={newVoucher.discount_value} onChange={e => setNewVoucher({...newVoucher, discount_value: e.target.value})} className="h-12 rounded-xl font-bold" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Kuota Pakai</Label>
                <Input type="number" value={newVoucher.max_usage} onChange={e => setNewVoucher({...newVoucher, max_usage: e.target.value})} className="h-12 rounded-xl" />
              </div>
            </div>
            <div className="flex gap-3 mt-10">
               <Button variant="ghost" onClick={() => setShowVoucherModal(false)} className="flex-1 h-12 rounded-xl font-bold">Batal</Button>
               <Button onClick={handleAddVoucher} className="flex-1 bg-emerald-500 hover:bg-emerald-600 h-12 rounded-xl text-white font-black shadow-lg shadow-emerald-500/20">Simpan</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
