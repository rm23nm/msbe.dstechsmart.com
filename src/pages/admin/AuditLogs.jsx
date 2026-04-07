import React, { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import { useAuth } from "@/lib/AuthContext";
import { useMosqueContext } from "@/lib/useMosqueContext";
import { useLocation } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  History, 
  User, 
  Clock, 
  FileText, 
  Trash2, 
  Edit3, 
  PlusCircle, 
  ShieldAlert,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function AuditLogs() {
  const { currentMosque } = useMosqueContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [mosques, setMosques] = useState([]); 
  const [selectedMosqueId, setSelectedMosqueId] = useState(""); 
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const location = useLocation();
  const isSuper = user?.role === "superadmin";
  const isAdminView = location.pathname.startsWith("/admin");
  const isMosqueView = location.pathname === "/audit-logs";

  useEffect(() => {
    if (isAdminView && isSuper) {
      loadMosques();
      loadLogs(selectedMosqueId);
    } else if (currentMosque) {
      // Locked to current mosque
      loadLogs(currentMosque.id);
    }
  }, [currentMosque, isAdminView, isSuper, selectedMosqueId]);

  async function loadMosques() {
    try {
      const data = await smartApi.entities.Mosque.list();
      setMosques(data);
    } catch (e) {
      console.error("Gagal memuat daftar masjid:", e);
    }
  }

  async function loadLogs(mosqueId) {
    setLoading(true);
    try {
      // Mengambil histori berdasarkan filter masjid (khusus 'SYSTEM' untuk log pusat tanpa mosque_id)
      const filter = mosqueId === "SYSTEM" ? { mosque_id: null } : mosqueId ? { mosque_id: mosqueId } : {};
      const data = await smartApi.entities.AuditLog.filter(
        filter, 
        '-createdAt', 
        500
      );
      setLogs(data);
    } catch (e) {
      console.error("Gagal memuat log:", e);
    } finally {
      setLoading(false);
    }
  }

  const getActionIcon = (action) => {
    switch (action) {
      case 'ADD': return <PlusCircle className="h-4 w-4 text-emerald-500" />;
      case 'EDIT': return <Edit3 className="h-4 w-4 text-blue-500" />;
      case 'DELETE': return <Trash2 className="h-4 w-4 text-red-500" />;
      default: return <History className="h-4 w-4 text-slate-400" />;
    }
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'ADD': return <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-100">TAMBAH</Badge>;
      case 'EDIT': return <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-100">UBAH</Badge>;
      case 'DELETE': return <Badge variant="outline" className="text-red-600 bg-red-50 border-red-100">HAPUS</Badge>;
      default: return <Badge variant="secondary">{action}</Badge>;
    }
  };

  const filteredLogs = logs.filter(log => 
    log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Riwayat Aktivitas Utama" 
        description="Pantau setiap aksi penambahan, perubahan, dan penghapusan data masjid Bapak."
      />

      <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-2xl border shadow-sm">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Cari pengurus atau aktivitas..." 
            className="pl-9 rounded-xl border-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isAdminView && isSuper && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Filter Masjid:</span>
            <select 
              className="px-4 py-2 rounded-xl border border-slate-200 bg-emerald-50 text-emerald-900 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none min-w-[240px]"
              value={selectedMosqueId}
              onChange={(e) => setSelectedMosqueId(e.target.value)}
            >
              <option value="">Seluruh Masjid & Sistem</option>
              <option value="SYSTEM" className="font-black italic">⭐ Aktivitas Pusat (Sistem)</option>
              {mosques.length > 0 && (
                <optgroup label="Daftar Masjid">
                  {mosques.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        )}

        <div className="text-xs text-muted-foreground font-medium ml-auto">
          Menampilkan {filteredLogs.length} jejak aktivitas terbaru
        </div>
      </div>

      <div className="bg-card rounded-2xl border shadow-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="w-[180px] font-bold text-slate-900">Waktu</TableHead>
              <TableHead className="w-[180px] font-bold text-slate-900">Pengurus</TableHead>
              <TableHead className="w-[120px] font-bold text-slate-900">Aksi</TableHead>
              <TableHead className="w-[120px] font-bold text-slate-900">Modul</TableHead>
              <TableHead className="font-bold text-slate-900">Keterangan Aktivitas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground animate-pulse">Sistem Membaca Buku Induk...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                      <ShieldAlert className="h-8 w-8 text-slate-300" />
                    </div>
                    <p>Belum ada jejak aktivitas yang tercatat.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="text-xs font-medium text-slate-500 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {format(new Date(log.createdAt), "d MMM yyyy, HH:mm", { locale: id })}
                    </div>
                  </TableCell>
                   <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                        {log.user_name?.[0] || <User className="h-3 w-3" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-slate-900">{log.user_name}</span>
                        {!log.mosque_id && <span className="text-[9px] font-black text-emerald-600 uppercase italic leading-none mt-0.5">Admin Pusat</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      {getActionBadge(log.action)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-600 border-none">
                      {log.entity}
                    </Badge>
                  </TableCell>
                   <TableCell className="text-sm text-slate-700 font-medium">
                    <div className="flex flex-col gap-1">
                      {log.description}
                      {log.mosque_id && isSuper && (
                        <span className="text-[9px] text-slate-400 font-bold uppercase italic">
                          Mosque ID: {log.mosque_id.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
