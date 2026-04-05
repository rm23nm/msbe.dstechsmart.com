import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import PageHeader from "../../components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Send, Users, Search, Filter, MessageSquare, 
  CheckCircle2, Clock, AlertTriangle, Building2, ExternalLink,
  ChevronRight, Play, Pause, RotateCcw, Check
} from "lucide-react";
import { toast } from "sonner";

export default function AdminBroadcast() {
  const [mosques, setMosques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [message, setMessage] = useState(
    "Halo Admin {nama_masjid},\n\nKami dari tim MasjidKu Smart ingin memberikan penawaran spesial untuk upgrade paket langganan Anda yang akan berakhir pada {tgl_berakhir}.\n\nHubungi kami untuk info lebih lanjut."
  );
  
  const [selectedIds, setSelectedIds] = useState([]);
  const [broadcastState, setBroadcastState] = useState({ 
    isActive: false, 
    currentIndex: 0, 
    sentIds: [] 
  });

  useEffect(() => {
    loadMosques();
  }, []);

  async function loadMosques() {
    setLoading(true);
    try {
      const data = await smartApi.entities.Mosque.list();
      setMosques(data || []);
    } catch (err) {
      toast.error("Gagal memuat data masjid");
    } finally {
      setLoading(false);
    }
  }

  const filteredMosques = mosques.filter(m => {
    const now = new Date();
    const expiry = m.subscription_end ? new Date(m.subscription_end) : null;
    const isExpired = expiry && expiry < now;
    const isTrial = m.subscription_plan === 'trial' || !m.subscription_plan;
    const isActive = m.subscription_status === 'active' || (isTrial && !isExpired);

    let match = true;
    if (filterStatus === 'trial_active') match = isTrial && !isExpired;
    else if (filterStatus === 'trial_expired') match = isTrial && isExpired;
    else if (filterStatus === 'active') match = !isTrial && !isExpired;
    else if (filterStatus === 'expired') match = !isTrial && isExpired;

    const matchSearch = m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      m.phone?.includes(searchTerm);
    
    return match && matchSearch;
  });

  const getStatusBadge = (m) => {
    const now = new Date();
    const expiry = m.subscription_end ? new Date(m.subscription_end) : null;
    const isExpired = expiry && expiry < now;
    const isTrial = m.subscription_plan === 'trial' || !m.subscription_plan;
    if (isTrial) return isExpired ? <Badge variant="destructive" className="text-[9px]">Trial Exp</Badge> : <Badge variant="secondary" className="text-[9px]">Trial Aktif</Badge>;
    return isExpired ? <Badge variant="destructive" className="text-[9px]">Berbayar Exp</Badge> : <Badge variant="default" className="text-[9px]">Berbayar Aktif</Badge>;
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(filteredMosques.map(m => m.id));
    else setSelectedIds([]);
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const formatMessage = (m, msg) => {
    let formatted = msg;
    formatted = formatted.replace(/{nama_masjid}/g, m.name || "Masjid");
    formatted = formatted.replace(/{nama_admin}/g, m.email?.split('@')[0] || "Admin");
    formatted = formatted.replace(/{tgl_berakhir}/g, m.subscription_end ? new Date(m.subscription_end).toLocaleDateString('id-ID') : "-");
    return formatted;
  };

  const openWhatsApp = (m) => {
    if (!m.phone) return toast.error("Nomor telepon tidak tersedia");
    const cleanPhone = m.phone.replace(/[^0-9]/g, "").replace(/^0/, "62");
    const text = formatMessage(m, message);
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
    
    // Auto-mark as sent for current index if broadcast is active
    if (broadcastState.isActive) {
       setBroadcastState(prev => ({
          ...prev,
          sentIds: [...new Set([...prev.sentIds, m.id])]
       }));
    }
  };

  const currentRecipient = broadcastState.isActive ? mosques.find(m => m.id === selectedIds[broadcastState.currentIndex]) : null;

  const nextRecipient = () => {
    if (broadcastState.currentIndex < selectedIds.length - 1) {
      setBroadcastState(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
    } else {
      setBroadcastState(prev => ({ ...prev, isActive: false }));
      toast.success("Broadcast Selesai!");
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader 
        title="WhatsApp Helper Broadcast" 
        description="Fitur bantuan pengiriman pesan massal satu demi satu agar aman dari blokir WhatsApp Web" 
      />

      {/* Broadcast Mode Header */}
      {broadcastState.isActive && currentRecipient && (
        <div className="bg-primary text-primary-foreground rounded-2xl p-6 shadow-xl animate-in slide-in-from-top duration-500 sticky top-4 z-50">
           <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                 <div className="bg-white/20 p-3 rounded-xl">
                    <MessageSquare className="h-6 w-6" />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold">Sedang Mengirim ke: {currentRecipient.name}</h2>
                    <p className="text-sm opacity-80">Antrean: {broadcastState.currentIndex + 1} dari {selectedIds.length} Penerima</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <Button variant="secondary" onClick={() => openWhatsApp(currentRecipient)} className="gap-2 font-bold h-12 px-6">
                    <Send className="h-4 w-4" /> Buka WA & Kirim
                 </Button>
                 <Button onClick={nextRecipient} variant="outline" className="h-12 px-6 bg-white/10 hover:bg-white/20 border-white/20">
                    Selesai & Lanjut <ChevronRight className="h-4 w-4 ml-1" />
                 </Button>
                 <Button size="icon" variant="destructive" onClick={() => setBroadcastState(prev => ({...prev, isActive: false}))}>
                    <Pause className="h-4 w-4" />
                 </Button>
              </div>
           </div>
           
           <div className="mt-6 h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-300" 
                style={{ width: `${((broadcastState.sentIds.length) / selectedIds.length) * 100}%` }}
              />
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Message Editor */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card border rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-primary" /> Template Pesan
            </h3>
            <Textarea 
              value={message} 
              onChange={e => setMessage(e.target.value)}
              className="min-h-[180px] text-sm mb-4 leading-relaxed"
              placeholder="Tulis pesan promo di sini..."
            />
            <div className="space-y-1.5 text-[10px] text-muted-foreground p-3 bg-muted rounded-xl">
              <p className="font-bold text-foreground">Placeholder:</p>
              <ul className="grid grid-cols-2 gap-x-2 gap-y-1 italic">
                <li><code>{`{nama_masjid}`}</code></li>
                <li><code>{`{nama_admin}`}</code></li>
                <li><code>{`{tgl_berakhir}`}</code></li>
              </ul>
            </div>
            
            <div className="mt-6 space-y-2">
               <Button 
                disabled={selectedIds.length === 0 || broadcastState.isActive}
                className="w-full gap-2 h-11"
                onClick={() => setBroadcastState({ isActive: true, currentIndex: 0, sentIds: [] })}
               >
                  <Play className="h-4 w-4" /> Mulai Broadcast Massal
               </Button>
               {broadcastState.sentIds.length > 0 && (
                 <Button variant="ghost" size="sm" className="w-full text-[10px] gap-2 opacity-50" onClick={() => setBroadcastState({isActive: false, currentIndex: 0, sentIds: []})}>
                   <RotateCcw className="h-3 w-3" /> Reset Progres Kirim
                 </Button>
               )}
            </div>
            
            <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100 text-[10px] text-amber-800 leading-relaxed italic">
               <AlertTriangle className="h-3 w-3 mb-1" />
               WhatsApp tidak mengizinkan pengiriman otomatis tanpa API berbayar. Gunakan mode broadcast ini untuk membantu pre-fill pesan satu demi satu dengan aman.
            </div>
          </div>
        </div>

        {/* Right: Recipient List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Cari masjid atau telepon..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="border rounded-lg px-3 py-2 text-xs bg-background min-w-[120px]"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="all">Semua Status</option>
                <option value="trial_active">Trial Aktif</option>
                <option value="trial_expired">Trial Exp</option>
                <option value="active">Berbayar Aktif</option>
                <option value="expired">Berbayar Exp</option>
              </select>
            </div>

            <div className="flex items-center justify-between mb-4 px-1">
               <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll} 
                    checked={selectedIds.length === filteredMosques.length && filteredMosques.length > 0} 
                    className="w-4 h-4 rounded border-slate-300 pointer-events-auto" 
                  />
                  <span className="text-xs font-bold text-slate-700">{selectedIds.length} Terpilih</span>
               </div>
            </div>

            <div className="border rounded-xl overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-[11px]">
                <thead className="bg-muted text-muted-foreground sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 text-left w-10">Sel</th>
                    <th className="px-4 py-3 text-left">Masjid</th>
                    <th className="px-4 py-3 text-left">Kontak</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Progres</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredMosques.map((m, idx) => {
                    const isCurrent = broadcastState.isActive && selectedIds[broadcastState.currentIndex] === m.id;
                    const isSent = broadcastState.sentIds.includes(m.id);
                    
                    return (
                      <tr key={m.id} className={`hover:bg-muted/30 transition-colors ${selectedIds.includes(m.id) ? 'bg-primary/5' : ''} ${isCurrent ? 'ring-2 ring-inset ring-primary z-10 bg-primary/10' : ''}`}>
                        <td className="px-4 py-3 text-center">
                          <input 
                            type="checkbox" 
                            className="rounded w-4 h-4" 
                            checked={selectedIds.includes(m.id)}
                            onChange={() => toggleSelect(m.id)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className={`font-bold ${isCurrent ? 'text-primary' : 'text-slate-800'}`}>{m.name}</div>
                          <div className="text-[9px] text-muted-foreground opacity-60 italic">{m.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-700">{m.phone || "No HP"}</div>
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(m)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isSent ? (
                            <div className="flex items-center justify-end gap-1 text-emerald-600 font-bold">
                               <CheckCircle2 className="h-3.5 w-3.5" /> Terkirim
                            </div>
                          ) : isCurrent ? (
                             <Badge variant="outline" className="animate-pulse bg-primary/20 text-primary border-primary">Kirim Sekarang...</Badge>
                          ) : (
                             <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600" onClick={() => openWhatsApp(m)}>
                               <Send className="h-3.5 w-3.5" />
                             </Button>
                          ) }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
