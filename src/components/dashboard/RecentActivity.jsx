import React, { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import { useAuth } from "@/lib/AuthContext";
import { 
  History, 
  User, 
  Clock, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  ShieldAlert 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

export default function RecentActivity({ mosqueId, limit = 5, showFilter = false, mosques = [] }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMid, setSelectedMid] = useState(mosqueId || "");
  const { user } = useAuth();

  useEffect(() => {
    loadLogs(selectedMid);
  }, [selectedMid, mosqueId]);

  async function loadLogs(mid) {
    setLoading(true);
    try {
      // Logic: 
      // 1. If mid is "SYSTEM" -> Filter for mosque_id: null (system-level)
      // 2. If mid is a specific mosque ID -> Filter by that mosque.
      // 3. If mid is empty/null AND superadmin -> Get all (empty filter).
      const filter = mid === "SYSTEM" ? { mosque_id: null } : mid ? { mosque_id: mid } : {};
      const data = await smartApi.entities.AuditLog.filter(
        filter, 
        '-createdAt', 
        limit
      );
      setLogs(data || []);
    } catch (e) {
      console.error("Gagal memuat aktivitas:", e);
    } finally {
      setLoading(false);
    }
  }

  const getActionIcon = (action) => {
    switch (action) {
      case 'ADD': case 'SYSTEM_ADD': return <PlusCircle className="h-3 w-3 text-emerald-500" />;
      case 'EDIT': return <Edit3 className="h-3 w-3 text-blue-500" />;
      case 'DELETE': return <Trash2 className="h-3 w-3 text-red-500" />;
      default: return <History className="h-3 w-3 text-slate-400" />;
    }
  };

  return (
    <div className="bg-card/60 backdrop-blur-sm rounded-3xl border p-6 shadow-sm flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100">
            <History className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg tracking-tight">Jejak Aktivitas</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aksi terbaru dalam sistem</p>
          </div>
        </div>

        {showFilter && user?.role === 'superadmin' && (
          <select 
            className="text-xs font-bold border-none bg-emerald-50 text-emerald-700 rounded-xl px-3 py-2 outline-none focus:ring-2 ring-primary/20"
            value={selectedMid}
            onChange={(e) => setSelectedMid(e.target.value)}
          >
            <option value="">Seluruh Aktivitas</option>
            <option value="SYSTEM" className="font-black text-emerald-900 italic">⭐ Aktivitas Pusat (Sistem)</option>
            <optgroup label="Filter Per Masjid">
              {mosques.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </optgroup>
          </select>
        )}
      </div>

      <div className="flex-1 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <ShieldAlert className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-xs font-medium uppercase tracking-tight">Belum ada catatan aktivitas.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {logs.map((log, idx) => (
              <motion.div 
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-2xl hover:bg-white/50 transition-colors group"
              >
                <div className="mt-1">
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-black italic tracking-tighter text-slate-800 uppercase truncate">
                      {log.user_name}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
                      <Clock className="h-2.5 w-2.5" />
                      {format(new Date(log.createdAt), "HH:mm", { locale: id })}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium line-clamp-1 group-hover:line-clamp-none transition-all">
                    {log.description}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                     <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase">
                        {log.entity}
                     </span>
                     {!log.mosque_id ? (
                        <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                          ⭐ Pusat
                        </span>
                     ) : !mosqueId && (
                       <span className="text-[8px] font-bold text-indigo-400 truncate max-w-[80px]">
                          • MS:{log.mosque_id.slice(0,5)}
                       </span>
                     )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {!loading && logs.length > 0 && (
        <button 
          onClick={() => window.location.href='/audit-logs'}
          className="mt-4 w-full py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-dashed border-slate-200 hover:border-indigo-100"
        >
          Lihat Seluruh Riwayat
        </button>
      )}
    </div>
  );
}
