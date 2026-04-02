import { useState, useEffect } from "react";
import { base44 } from "@/api/apiClient";
import PageHeader from "../../components/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Package } from "lucide-react";
import { toast } from "sonner";

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
];

const PLANS = ["trial", "monthly", "yearly"];

export default function AdminPackages() {
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    setLoading(true);
    const data = await base44.entities.PlanFeatures.list();
    const planMap = {};
    PLANS.forEach(p => {
      const existing = data.find(d => d.plan === p);
      planMap[p] = {
        id: existing?.id,
        plan: p,
        features: existing?.features || [],
        description: existing?.description || "",
        price: existing?.price || 0,
        max_mosques: existing?.max_mosques !== undefined ? existing.max_mosques : -1,
        storage_gb: existing?.storage_gb !== undefined ? existing.storage_gb : -1,
      };
    });
    setPlans(planMap);
    setLoading(false);
  }

  async function handleSave(planKey) {
    setSaving(true);
    try {
      const plan = plans[planKey];
      if (plan.id) {
        await base44.entities.PlanFeatures.update(plan.id, plan);
      } else {
        await base44.entities.PlanFeatures.create(plan);
      }
      toast.success(`Paket ${planKey} berhasil disimpan`);
      await loadPlans();
    } catch (err) {
      toast.error("Error: " + err.message);
    } finally {
      setSaving(false);
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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Manajemen Paket & Fitur" description="Atur fitur yang tersedia untuk setiap paket langganan" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {PLANS.map(planKey => (
          <div key={planKey} className="bg-card rounded-xl border p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="font-semibold capitalize text-lg">{planKey}</h3>
              <Badge variant="secondary" className="ml-auto capitalize">{planKey}</Badge>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs">Deskripsi</Label>
                <input
                  type="text"
                  value={plans[planKey].description}
                  onChange={e => setPlans(prev => ({
                    ...prev,
                    [planKey]: { ...prev[planKey], description: e.target.value }
                  }))}
                  placeholder="Deskripsi paket"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <Label className="text-xs">Harga Per Tahun (Rp)</Label>
                <input
                  type="number"
                  value={plans[planKey].price}
                  onChange={e => setPlans(prev => ({
                    ...prev,
                    [planKey]: { ...prev[planKey], price: Number(e.target.value) }
                  }))}
                  placeholder="0"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <Label className="text-xs">Max Masjid (-1 = unlimited)</Label>
                <input
                  type="number"
                  value={plans[planKey].max_mosques}
                  onChange={e => setPlans(prev => ({
                    ...prev,
                    [planKey]: { ...prev[planKey], max_mosques: Number(e.target.value) }
                  }))}
                  placeholder="-1"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <Label className="text-xs">Storage GB (-1 = unlimited)</Label>
                <input
                  type="number"
                  value={plans[planKey].storage_gb}
                  onChange={e => setPlans(prev => ({
                    ...prev,
                    [planKey]: { ...prev[planKey], storage_gb: Number(e.target.value) }
                  }))}
                  placeholder="-1"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="pt-2 border-t">
              <Label className="text-xs font-semibold">Fitur Aktif</Label>
              <div className="mt-3 space-y-2">
                {AVAILABLE_FEATURES.map(feature => (
                  <label key={feature} className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded transition-colors">
                    <Checkbox
                      checked={plans[planKey].features.includes(feature)}
                      onCheckedChange={() => toggleFeature(planKey, feature)}
                    />
                    <span className="text-xs">{feature}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button
              onClick={() => handleSave(planKey)}
              disabled={saving}
              className="w-full gap-2"
            >
              <Save className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-2">📌 Info:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Trial: Paket gratis untuk masjid baru (30 hari)</li>
          <li>Monthly: Paket bulanan dengan harga lebih mahal</li>
          <li>Yearly: Paket tahunan dengan harga lebih murah</li>
          <li>Centang fitur yang ingin diaktifkan untuk setiap paket</li>
          <li>Max Mosques: Jumlah masjid yang bisa didaftar (use -1 untuk unlimited)</li>
        </ul>
      </div>
    </div>
  );
}