import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import PageHeader from "../../components/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Save, Package, Ticket, Plus, Trash2, Tag, Calendar, Users, Percent, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/formatCurrency";

const AVAILABLE_FEATURES = [
  "Jadwal Shalat & Jumat",
  "Manajemen Keuangan",
  "Kelola Data Jamaah",
  "Inventory Aset Masjid",
  "Halaman Publik Masjid",
  "Digital Signage (Public TV)",
  "Pengumuman & Notifikasi",
  "AI Analytics & Insights",
  "Manajemen Donasi & Zakat",
  "Laporan & Analytics",
  "Manajemen Kegiatan",
  "Absensi & Tracking Kehadiran",
  "Integrasi Telegram & AI Bot",
  "Al-Quran & Tafsir Digital",
  "Scan Struk AI (Gemini)",
  "Update Kustom Domain Mandiri",
  "Team Support Cepat",
  "Team Support Khusus",
];

export default function AdminPackages() {
  const [activeTab, setActiveTab] = useState("paket");
  const [plans, setPlans] = useState({});
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newVoucher, setNewVoucher] = useState({
    code: "",
    discount: 0,
    type: "percentage",
    expiry_date: "",
    max_uses: -1
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const planData = await smartApi.entities.PlanFeatures.list();
      const planMap = {};
      
      planData.forEach(existing => {
        let featuresArr = [];
        if (existing?.features) {
          try { featuresArr = JSON.parse(existing.features); } 
          catch (_) { featuresArr = existing.features ? existing.features.split(',').map(f => f.trim()).filter(Boolean) : []; }
        }
        planMap[existing.plan] = {
          id: existing?.id,
          plan: existing.plan,
          name: existing?.name || existing.plan,
          features: Array.isArray(featuresArr) ? featuresArr : [],
          description: existing?.description || "",
          price: existing?.price || 0,
          original_price: existing?.original_price || 0,
          max_mosques: existing?.max_mosques !== undefined ? existing.max_mosques : -1,
          storage_gb: existing?.storage_gb !== undefined ? existing.storage_gb : -1,
        };
      });
      setPlans(planMap);

      const voucherData = await smartApi.entities.Voucher.list();
      setVouchers(voucherData || []);
    } catch (err) {
      toast.error("Gagal memuat data: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePlan(planKey) {
    setSaving(true);
    try {
      const plan = plans[planKey];
      const payload = {
        ...plan,
        features: JSON.stringify(plan.features || []),
      };
      if (plan.id) {
        await smartApi.entities.PlanFeatures.update(plan.id, payload);
      } else {
        await smartApi.entities.PlanFeatures.create(payload);
      }
      toast.success(`Paket "${planKey}" berhasil disimpan`);
      await loadData();
    } catch (err) {
      toast.error("Gagal menyimpan: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePlan(id, name) {
     if (!confirm(`Hapus paket "${name}"? Masjid yang berlangganan paket ini mungkin akan kehilangan akses.`)) return;
     try {
       await smartApi.entities.PlanFeatures.delete(id);
       toast.success("Paket dihapus");
       await loadData();
     } catch (err) {
       toast.error("Gagal menghapus");
     }
  }

  async function handleAddPlan() {
    const name = prompt("Masukkan ID paket (contoh: ramadhan_promo):");
    if (!name) return;
    const planKey = name.toLowerCase().replace(/\s+/g, '_');
    if (plans[planKey]) return toast.error("ID paket ini sudah ada");
    
    setPlans(prev => ({
      ...prev,
      [planKey]: {
        plan: planKey,
        name: name,
        features: [],
        description: "",
        price: 0,
        original_price: 0,
        max_mosques: -1,
        storage_gb: -1
      }
    }));
  }

  async function handleCreateVoucher() {
    if (!newVoucher.code) return toast.error("Kode voucher wajib diisi");
    try {
      const payload = {
        ...newVoucher,
        code: newVoucher.code.toUpperCase(),
        discount: Number(newVoucher.discount),
        max_uses: Number(newVoucher.max_uses),
        status: "active"
      };
      await smartApi.entities.Voucher.create(payload);
      toast.success("Voucher berhasil dibuat");
      setNewVoucher({ code: "", discount: 0, type: "percentage", expiry_date: "", max_uses: -1 });
      await loadData();
    } catch (err) {
      toast.error("Gagal membuat voucher: " + err.message);
    }
  }

  async function handleDeleteVoucher(id) {
    if (!confirm("Hapus voucher ini?")) return;
    try {
      await smartApi.entities.Voucher.delete(id);
      toast.success("Voucher dihapus");
      await loadData();
    } catch (err) {
      toast.error("Gagal menghapus");
    }
  }

  function toggleFeature(planKey, feature) {
    setPlans(prev => ({
      ...prev,
      [planKey]: {
        ...prev[planKey],
        features: prev[planKey].features.includes(feature)
          ? prev[planKey].features.filter(f => f !== feature)
          : [...prev[planKey].features, feature]
      }
    }));
  }

  if (loading) return <div>Memuat data...</div>;

  return (
    <div className="space-y-6 pb-20">
      <PageHeader title="Manajemen Paket & Voucher" description="Atur harga dan kode promo layanan" />

      <div className="flex gap-2 bg-muted p-1 rounded-xl w-fit">
        <button onClick={() => setActiveTab("paket")} className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'paket' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground'}`}>
           Paket Langganan
        </button>
        <button onClick={() => setActiveTab("voucher")} className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'voucher' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground'}`}>
           Master Voucher
        </button>
      </div>

      {activeTab === "paket" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.keys(plans).map(planKey => (
            <div key={planKey} className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow relative group/card">
              <div className="flex items-center justify-between mb-4 pb-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold truncate" title={plans[planKey].name}>{plans[planKey].name}</h3>
                    <Badge variant="outline" className="text-[10px] uppercase">{planKey}</Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                   {plans[planKey].id && (
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover/card:opacity-100 transition-opacity" onClick={() => handleDeletePlan(plans[planKey].id, plans[planKey].name)}>
                        <Trash2 className="h-4 w-4" />
                     </Button>
                   )}
                   <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSavePlan(planKey)} disabled={saving}>
                      <Save className="h-4 w-4" />
                   </Button>
                </div>
              </div>

              <div className="space-y-4 mb-4">
                <div>
                  <Label className="text-xs font-semibold">Nama Tampilan</Label>
                  <Input 
                    value={plans[planKey].name} 
                    onChange={e => setPlans({...plans, [planKey]: {...plans[planKey], name: e.target.value}})}
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Deskripsi</Label>
                  <Input 
                    value={plans[planKey].description} 
                    onChange={e => setPlans({...plans, [planKey]: {...plans[planKey], description: e.target.value}})}
                    placeholder="Deskripsi singkat..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Harga Normal (Rp)</Label>
                    <Input 
                      type="number"
                      value={plans[planKey].original_price} 
                      onChange={e => setPlans({...plans, [planKey]: {...plans[planKey], original_price: Number(e.target.value)}})}
                      className="text-slate-400 line-through"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-primary">Harga Promo (Rp)</Label>
                    <Input 
                      type="number"
                      value={plans[planKey].price} 
                      onChange={e => setPlans({...plans, [planKey]: {...plans[planKey], price: Number(e.target.value)}})}
                      className="font-bold text-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Limit Masjid</Label>
                    <Input 
                      type="number"
                      value={plans[planKey].max_mosques || 0} 
                      onChange={e => setPlans({...plans, [planKey]: {...plans[planKey], max_mosques: Number(e.target.value)}})}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Storage (GB)</Label>
                    <Input 
                      type="number"
                      value={plans[planKey].storage_gb || 0} 
                      onChange={e => setPlans({...plans, [planKey]: {...plans[planKey], storage_gb: Number(e.target.value)}})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 mt-2 border-t pt-2">
                <Label className="text-xs font-bold mb-2 block">Daftar Fitur</Label>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {AVAILABLE_FEATURES.map(f => (
                    <label key={f} className="flex items-center gap-2 p-1.5 hover:bg-muted rounded text-xs cursor-pointer">
                      <Checkbox 
                        checked={plans[planKey].features.includes(f)}
                        onCheckedChange={() => toggleFeature(planKey, f)}
                      />
                      <span>{f}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}
          
          <button onClick={handleAddPlan} className="border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 rounded-2xl flex flex-col items-center justify-center p-8 transition-all group min-h-[460px]">
             <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
             </div>
             <p className="font-bold text-muted-foreground group-hover:text-primary">Tambah Paket Baru</p>
             <p className="text-xs text-muted-foreground/60 mt-1">Buat skema langganan kustom</p>
          </button>
        </div>
      )}

      {activeTab === "voucher" && (
        <div className="space-y-8">
          <div className="bg-card border rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold flex items-center gap-2 mb-6">
              <Plus className="h-5 w-5 text-primary" /> Tambah Voucher Baru
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div className="space-y-2">
                <Label>Kode Voucher</Label>
                <Input placeholder="MASJIDKU50" value={newVoucher.code} onChange={e => setNewVoucher({...newVoucher, code: e.target.value.toUpperCase()})} />
              </div>
              <div className="space-y-2">
                <Label>Diskon</Label>
                <div className="flex gap-2">
                   <select className="border rounded bg-muted text-xs p-1" value={newVoucher.type} onChange={e => setNewVoucher({...newVoucher, type: e.target.value})}>
                      <option value="percentage">%</option>
                      <option value="nominal">Rp</option>
                   </select>
                   <Input type="number" placeholder="0.5 / 50000" value={newVoucher.discount} onChange={e => setNewVoucher({...newVoucher, discount: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tgl Expired</Label>
                <Input type="date" value={newVoucher.expiry_date} onChange={e => setNewVoucher({...newVoucher, expiry_date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Max Pakai</Label>
                <Input type="number" value={newVoucher.max_uses} onChange={e => setNewVoucher({...newVoucher, max_uses: e.target.value})} />
              </div>
              <Button className="w-full gap-2" onClick={handleCreateVoucher}>
                <Ticket className="h-4 w-4" /> Simpan
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             {vouchers.map(v => (
               <div key={v.id} className="bg-card border rounded-xl p-5 shadow-sm space-y-3 relative group">
                  <button onClick={() => handleDeleteVoucher(v.id)} className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded-lg">
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-2">
                     <Tag className="h-4 w-4 text-primary" />
                     <span className="font-bold text-lg tracking-wider text-primary">{v.code}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                     <div className="bg-muted p-2 rounded-lg flex items-center gap-2">
                        {v.type === 'percentage' ? <Percent className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
                        {v.type === 'percentage' ? (v.discount * 100) + '%' : formatCurrency(v.discount)}
                     </div>
                     <div className="bg-muted p-2 rounded-lg flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {v.expiry_date ? v.expiry_date : 'No Exp'}
                     </div>
                     <div className="bg-muted p-2 rounded-lg flex items-center gap-2 col-span-2">
                        <Users className="h-3 w-3" />
                        Terpakai: {v.used_count || 0} / {v.max_uses === -1 ? '∞' : v.max_uses}
                     </div>
                  </div>
                  <Badge variant={v.status === 'active' ? 'default' : 'secondary'} className="w-full justify-center py-1">
                    {v.status === 'active' ? 'Aktif' : 'Non-aktif'}
                  </Badge>
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
}
