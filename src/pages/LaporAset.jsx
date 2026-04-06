import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { smartApi } from "@/api/apiClient";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  Package, 
  ChevronLeft, 
  History,
  ShieldCheck,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function LaporAset() {
  const { qrId } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reporting, setReporting] = useState(false);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("rusak_ringan"); // or 'pelayanan'

  useEffect(() => {
    loadAsset();
  }, [qrId]);

  const loadAsset = async () => {
    try {
      const data = await smartApi.entities.Asset.filter({ qr_code_id: qrId });
      if (data.length > 0) {
        setAsset(data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!description) return toast.error("Silakan berikan deskripsi laporan.");
    setReporting(true);
    try {
      // 1. Create Maintenance Record
      await smartApi.entities.AssetMaintenance.create({
        asset_id: asset.id,
        maintenance_date: new Date().toISOString().split('T')[0],
        description: `[LAPOR SCAN] ${description}`,
        status: status === "baik" ? "selesai" : "direncanakan",
        cost: 0
      });

      // 2. Update Asset Condition
      await smartApi.entities.Asset.update(asset.id, {
        condition: status,
        maintenance_notes: description
      });

      toast.success("Laporan berhasil dikirim! Jazakallah.");
      setDescription("");
      loadAsset();
    } catch (e) {
      toast.error("Gagal mengirim laporan.");
    } finally {
      setReporting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  if (!asset) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-white">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4">
        <AlertTriangle className="w-10 h-10" />
      </div>
      <h2 className="text-xl font-black italic tracking-tighter">ASET TIDAK DITEMUKAN</h2>
      <p className="text-slate-400 text-sm mt-1">QR Code tidak valid atau aset telah dihapus.</p>
      <Button variant="ghost" onClick={() => navigate(-1)} className="mt-6">Kembali</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header Info */}
      <div className="bg-emerald-600 text-white p-6 rounded-b-[2.5rem] shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-black italic tracking-tighter uppercase">PORTAL MAINTENANCE</h1>
        </div>
        
        <div className="flex gap-4 items-end">
           <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/20 backdrop-blur-md border border-white/20 p-1 flex items-center justify-center">
              {asset.photo_url ? (
                <img src={asset.photo_url} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Package className="w-10 h-10 opacity-40" />
              )}
           </div>
           <div className="flex-1 pb-1">
              <h2 className="text-xl font-black leading-tight truncate">{asset.name}</h2>
              <div className="flex items-center gap-1 opacity-80 text-[10px] font-bold uppercase tracking-widest mt-1">
                <MapPin className="w-3 h-3" /> {asset.location || "Tanpa Lokasi"}
              </div>
           </div>
        </div>
      </div>

      <div className="p-6 space-y-6 -mt-6">
        {/* Status Card */}
        <motion.div 
           initial={{ y: 20, opacity: 0 }} 
           animate={{ y: 0, opacity: 1 }}
           className="bg-white p-5 rounded-[2rem] shadow-xl border border-slate-100"
        >
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">KONDISI SAAT INI</p>
           <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${asset.condition === 'baik' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                 {asset.condition === 'baik' ? <CheckCircle2 className="w-6 h-6" /> : <Wrench className="w-6 h-6" />}
              </div>
              <div>
                 <p className="font-black text-slate-900 uppercase italic tracking-tighter text-lg leading-none">{asset.condition.replace('_', ' ')}</p>
                 <p className="text-xs text-slate-400 font-medium">Terakhir dicek: {asset.last_maintenance || "Belum ada record"}</p>
              </div>
           </div>
        </motion.div>

        {/* Report Form */}
        <div className="space-y-4">
           <div className="flex items-center gap-2 px-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Laporkan Perubahan / Servis</p>
           </div>
           
           <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setStatus("baik")}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${status === 'baik' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-100 bg-white text-slate-400'}`}
              >
                <CheckCircle2 className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase tracking-widest">Selesai Servis</span>
              </button>
              <button 
                onClick={() => setStatus("rusak_ringan")}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${status === 'rusak_ringan' ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-slate-100 bg-white text-slate-400'}`}
              >
                <Wrench className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase tracking-widest">Perlu Servis</span>
              </button>
           </div>

           <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100">
              <Textarea 
                placeholder="Tuliskan detail perbaikan atau keluhan di sini..."
                className="border-0 focus-visible:ring-0 resize-none min-h-[120px] text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
           </div>

           <Button 
             disabled={reporting}
             onClick={handleSubmit}
             className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-black italic tracking-tighter text-lg shadow-xl"
           >
             {reporting ? "Mengirim..." : <><Send className="w-5 h-5 mr-2" /> KIRIM LAPORAN</>}
           </Button>
        </div>
      </div>
    </div>
  );
}
