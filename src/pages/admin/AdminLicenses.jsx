import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import { 
  Key, Plus, ShieldCheck, ShieldAlert, Copy, ExternalLink, 
  Terminal, Server, Globe, CheckCircle2, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";

export default function AdminLicenses() {
  const [licenses, setLicenses] = useState([]);
  const [mosques, setMosques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newLicense, setNewLicense] = useState({ 
    key: `MS-${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
    mosque_id: "",
    domain: "" 
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [licList, msqList] = await Promise.all([
        smartApi.entities.License.list(),
        smartApi.entities.Mosque.list()
      ]);
      setLicenses(licList || []);
      setMosques(msqList || []);
    } catch (e) {
      toast.error("Gagal memuat data lisensi");
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Teks berhasil disalin!");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Key className="w-10 h-10 text-emerald-500" />
            Manajemen Lisensi Sub-Produk
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Kelola kunci aktivasi dan pantau instalasi standalone (White-Label).</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 h-12 px-6 rounded-xl shadow-lg shadow-emerald-600/20 gap-2">
              <Plus className="w-5 h-5" /> Rilis Lisensi Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-none rounded-2xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Terbitkan Lisensi Khusus</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pilih Masjid Tujuan</label>
                <Select value={newLicense.mosque_id} onValueChange={(v) => setNewLicense({...newLicense, mosque_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Pilih Masjid" /></SelectTrigger>
                  <SelectContent>
                    {mosques.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Kunci Lisensi (Dihasilkan Otomatis)</label>
                <Input value={newLicense.key} readOnly className="bg-slate-50 dark:bg-slate-800 border-none font-mono text-emerald-600" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Domain Client (Opsional)</label>
                <Input 
                  placeholder="masjid-raya.com" 
                  value={newLicense.domain} 
                  onChange={(e) => setNewLicense({...newLicense, domain: e.target.value})}
                  className="rounded-xl border-slate-200 dark:border-slate-800"
                />
                <p className="text-[10px] text-slate-400">Lisensi hanya akan berlaku di domain ini.</p>
              </div>
              <Button onClick={handleAddLicense} className="w-full bg-emerald-600 h-12 rounded-xl text-lg font-bold">Aktivasi Kode</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Table Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/50">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-5 text-sm font-bold uppercase tracking-wider text-slate-400">Masjid Client</th>
                  <th className="px-6 py-5 text-sm font-bold uppercase tracking-wider text-slate-400">License Key</th>
                  <th className="px-6 py-5 text-sm font-bold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-6 py-5 text-sm font-bold uppercase tracking-wider text-slate-400">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {licenses.map((lic) => (
                  <tr key={lic.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-5 cursor-default">
                      <div className="font-bold text-slate-800 dark:text-white capitalize">{lic.mosque?.name || "N/A"}</div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {lic.domain || "Semua Domain"}
                      </div>
                    </td>
                    <td className="px-6 py-5 font-mono text-sm text-emerald-600 font-bold">{lic.key}</td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        lic.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      }`}>
                        {lic.status === "active" ? "PROD ACTIVE" : "REVOKED"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(lic.key)} title="Copy Key">
                          <Copy className="w-4 h-4 text-slate-400 hover:text-emerald-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {licenses.length === 0 && !loading && (
                  <tr><td colSpan="4" className="text-center py-20 text-slate-300 italic">Belum ada lisensi yang dirilis.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Guidance Section */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Key className="w-32 h-32" /></div>
            <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
              <Server className="w-6 h-6" /> Panduan Instalasi Sub-Produk
            </h3>
            <div className="space-y-6 text-sm text-indigo-100 relative z-10 leading-relaxed">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-black">1</div>
                <div>Paste kode lisensi di file <code className="bg-white/10 px-1 rounded text-white-100">.env</code> server client.</div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-black">2</div>
                <div>Set <code className="bg-white/10 px-1 rounded text-white-100">VITE_SINGLE_MOSQUE_MODE=true</code></div>
              </div>
              <div className="flex gap-4 border-t border-white/10 pt-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-400 text-emerald-900 flex items-center justify-center font-black"><CheckCircle2 className="w-5 h-5" /></div>
                <div className="text-xs">
                  <p className="font-bold text-white uppercase tracking-wider mb-2">Verifikasi Berhasil?</p>
                  <p>Aplikasi akan otomatis mengunci UI dan mengganti branding ke nama masjid berlisensi.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2rem] text-slate-300 border border-slate-800 shadow-xl">
             <div className="flex items-center gap-2 mb-6 text-emerald-500">
               <Terminal className="w-6 h-6" />
               <span className="font-bold text-sm uppercase tracking-widest">Update Terminal</span>
             </div>
             <div className="bg-black/50 p-4 rounded-xl font-mono text-[11px] leading-relaxed relative group">
                <pre className="whitespace-pre-wrap break-all text-slate-400">
                  cd /www/wwwroot/ms.client.com && git pull origin main && npm install && npm run build && pm2 restart all
                </pre>
                <button 
                  onClick={() => copyToClipboard("cd /www/wwwroot/ms.client.com && git pull origin main && npm install && npm run build && pm2 restart all")}
                  className="absolute top-2 right-2 p-2 hover:bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Copy className="w-4 h-4" />
                </button>
             </div>
             <p className="text-[10px] mt-4 text-slate-500 italic flex gap-2">
               <Info className="w-3 h-3" /> Jalankan ini di VPS client untuk update fitur terbaru dari pusat.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
