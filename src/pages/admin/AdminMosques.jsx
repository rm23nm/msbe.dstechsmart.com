import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import { formatDate } from "@/lib/formatCurrency";
import MosqueFormDialog from "../../components/admin/MosqueFormDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Building2, Search, Pencil, Trash2, ExternalLink, ShieldCheck, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminMosques() {
  const [mosques, setMosques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await smartApi.entities.Mosque.list('-created_date');
      setMosques(data || []);
    } catch (e) {} finally { setLoading(false); }
  }

  async function handleSave(data) {
    if (editItem) {
      await smartApi.entities.Mosque.update(editItem.id, data);
    } else {
      await smartApi.entities.Mosque.create(data);
    }
    setShowForm(false);
    setEditItem(null);
    loadData();
  }

  async function handleDelete(id) {
    if (window.confirm("Hapus masjid ini dari ekosistem Smart?")) {
      await smartApi.entities.Mosque.delete(id);
      loadData();
    }
  }

  const filtered = mosques.filter(m => !search || m.name?.toLowerCase().includes(search.toLowerCase()) || m.city?.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-black italic tracking-tighter uppercase text-slate-800 font-heading">Registri Masjid</h1>
           <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mt-1 pl-1">{mosques.length} Entitas Smart Terdaftar</p>
        </div>
        <Button 
          onClick={() => { setEditItem(null); setShowForm(true); }} 
          className="h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black italic tracking-tighter uppercase shadow-xl shadow-emerald-100 group transition-all"
        >
          <Plus className="h-5 w-5 mr-3 group-hover:rotate-90 transition-transform duration-500" /> Tambah Entitas Baru
        </Button>
      </div>

      <div className="relative max-w-sm group">
        <div className="absolute inset-0 bg-emerald-100 opacity-20 blur-xl group-focus-within:opacity-40 transition-opacity" />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
        <Input 
          placeholder="Cari Istana/Masjid..." 
          className="h-14 pl-12 rounded-2xl border-white/80 bg-white/40 backdrop-blur-xl font-bold italic tracking-tight shadow-sm text-lg focus:ring-emerald-500/20"
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
           <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Menyelaraskan Data...</p>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
           <div className="bg-white/40 backdrop-blur-md rounded-[3rem] p-12 border border-dashed border-slate-200 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                 <Building2 className="h-10 w-10 text-slate-200" />
              </div>
              <h3 className="text-xl font-black italic tracking-tighter text-slate-400 uppercase">Belum Ada Entitas</h3>
           </div>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <div className="hidden lg:grid grid-cols-6 px-8 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
             <div className="col-span-2">Informasi Masjid</div>
             <div>Wilayah</div>
             <div>Paket Layanan</div>
             <div>Status Kontrak</div>
             <div className="text-right">Aksi Manajemen</div>
          </div>
          
          <AnimatePresence mode="popLayout">
            {filtered.map((m, idx) => (
              <motion.div 
                key={m.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                className="group relative bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/80 p-6 shadow-sm hover:shadow-2xl hover:shadow-emerald-100 transition-all duration-500 grid grid-cols-1 lg:grid-cols-6 items-center gap-4 hover:border-emerald-200"
              >
                {/* Decorative Side Glow */}
                <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-emerald-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="lg:col-span-2 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center border p-2 flex-shrink-0 group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                    <img src={m.logo_url || "/favicon.png?v=2"} className="w-full h-full object-contain" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-lg font-black italic tracking-tighter text-slate-800 uppercase leading-none group-hover:text-emerald-700 transition-colors">{m.name}</h4>
                    <Link to={`/masjid/${m.slug || m.id}`} target="_blank" className="text-[10px] text-slate-400 hover:text-emerald-600 flex items-center gap-1 mt-1 font-bold uppercase tracking-wider">
                      ms.dstechsmart.com/{m.slug || m.id} <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-500 font-bold text-sm italic">
                   <MapPin className="h-4 w-4 text-slate-300" /> {m.city || '-'}
                </div>

                <div>
                   <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 rounded-xl px-3 py-1 font-black italic tracking-tighter uppercase text-[10px]">
                      {m.subscription_plan || 'TRIAL EDITION'}
                   </Badge>
                </div>

                <div>
                   {m.subscription_status === 'active' ? (
                     <div className="flex items-center gap-2 text-emerald-600 font-black italic tracking-tighter uppercase text-xs">
                        <ShieldCheck className="h-4 w-4" /> TERVERIFIKASI
                     </div>
                   ) : (
                     <div className="text-slate-400 font-black italic tracking-tighter uppercase text-xs">OFF-Smart</div>
                   )}
                   <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{m.subscription_end ? `HINGGA ${formatDate(m.subscription_end)}` : 'MASA PERCOBAAN'}</p>
                </div>

                <div className="flex justify-end gap-2 px-2">
                   <Button size="icon" variant="ghost" onClick={() => { setEditItem(m); setShowForm(true); }} className="h-10 w-10 rounded-xl hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all border border-transparent hover:border-emerald-100 group/btn">
                      <Pencil className="h-4 w-4 group-hover/btn:scale-110" />
                   </Button>
                   <Button size="icon" variant="ghost" onClick={() => handleDelete(m.id)} className="h-10 w-10 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all border border-transparent hover:border-red-100 group/btn">
                      <Trash2 className="h-4 w-4 group-hover/btn:scale-110" />
                   </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <MosqueFormDialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditItem(null); }} item={editItem} onSave={handleSave} />
    </motion.div>
  );
}
