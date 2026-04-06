import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import PageHeader from "@/components/PageHeader";
import { ShieldAlert, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useMosqueContext } from "@/lib/useMosqueContext";

const AVAILABLE_MENUS = [
  // Mosque Menus
  { id: "dashboard", label: "Dashboard Masjid" },
  { id: "keuangan", label: "Keuangan" },
  { id: "laporan-keuangan", label: "Laporan Keuangan" },
  { id: "kegiatan", label: "Kegiatan" },
  { id: "aset", label: "Aset Masjid" },
  { id: "jamaah", label: "Jamaah" },
  { id: "jamaah-dashboard", label: "Portal Jamaah" },
  { id: "analitik", label: "Analitik" },
  { id: "ai-analitik", label: "AI Analitik" },
  { id: "donasi-masjid", label: "Donasi Masjid" },
  { id: "absensi", label: "Absensi" },
  { id: "pengumuman", label: "Pengumuman" },
  { id: "info-publik", label: "Info Publik" },
  { id: "telegram", label: "Integrasi Telegram" },
  { id: "portfolio", label: "Portofolio Digital" },
  { id: "tv", label: "TV Masjid Smart" },
  { id: "pengaturan", label: "Pengaturan Masjid" },
  
  // Superadmin Menus
  { id: "admin", label: "Superadmin: Dashboard" },
  { id: "admin-mosques", label: "Superadmin: Kelola Masjid" },
  { id: "admin-users", label: "Superadmin: Pengguna" },
  { id: "admin-billing", label: "Superadmin: Billing" },
  { id: "admin-packages", label: "Superadmin: Paket & Fitur" },
  { id: "admin-reports", label: "Superadmin: Laporan" },
  { id: "admin-settings", label: "Superadmin: Pengatura Aplikasi" },
  { id: "admin-roles", label: "Superadmin: Hak Akses Role" }
];

const DEFAULT_ROLES = ["superadmin", "admin_masjid", "bendahara", "pengurus", "user", "jamaah", "ketua_dkm", "sekretaris", "imam", "marbot", "amil", "humas"];

export default function AdminRoles() {
  const { rolePermissions, hasPermission, reload } = useMosqueContext();
  const [localRoles, setLocalRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [editingPermissions, setEditingPermissions] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (rolePermissions) {
      setLocalRoles(rolePermissions);
      // If we have a selected role, update its permissions from the fresh list
      if (selectedRole) {
        const fresh = rolePermissions.find(r => r.role_name === selectedRole.role_name && r.mosque_id === selectedRole.mosque_id);
        if (fresh) handleSelectRole(fresh);
      } else if (rolePermissions.length > 0) {
        handleSelectRole(rolePermissions[0]);
      }
    }
  }, [rolePermissions]);

  async function loadData() {
    // Context already handles loading, we just reactive to rolePermissions
  }

  const handleSelectRoleName = async (roleName) => {
    let rp = rolePermissions.find(r => r.role_name === roleName);
    if (rp) handleSelectRole(rp);
  };

  const handleAddNewRole = async () => {
    const name = prompt("Masukkan nama role baru (contoh: koordinator_it):");
    if (!name) return;
    const roleKey = name.toLowerCase().replace(/\s+/g, '_');
    if (rolePermissions.find(r => r.role_name === roleKey)) return toast.error("Role sudah ada.");

    try {
       const newRp = await smartApi.auth.saveRole({
         role_name: roleKey,
         permissions: "{}"
       });
       toast.success(`Role ${roleKey} berhasil dibuat.`);
       if (reload) reload();
    } catch (e) {
       toast.error("Gagal tambah role: " + e.message);
    }
  };

  const handleDeleteRole = async (id, name) => {
    if (DEFAULT_ROLES.includes(name)) return toast.error("Role sistem tidak bisa dihapus.");
    if (!confirm(`Hapus role "${name}"? Reset hak akses ke role ini tidak bisa dibatalkan.`)) return;
    
    try {
      await smartApi.auth.deleteRole(name, false); // Admin deletes non-local (global) by default if they are superadmin
      toast.success(`Role ${name} dihapus`);
      setSelectedRole(null);
      if (reload) reload();
    } catch (e) {
      toast.error("Gagal hapus: " + e.message);
    }
  };

  const handleSelectRole = (rp) => {
    setSelectedRole(rp);
    try {
      if (!rp || !rp.permissions) {
        setEditingPermissions({});
      } else if (typeof rp.permissions === "string") {
        setEditingPermissions(JSON.parse(rp.permissions) || {});
      } else {
        setEditingPermissions(rp.permissions || {});
      }
    } catch {
      setEditingPermissions({});
    }
  };

  const togglePermission = (menuId, action) => {
    if (!menuId) return;
    setEditingPermissions(prev => {
      const updated = { ...(prev || {}) };
      // Ensure the entry for this menuId is a valid object before toggling
      if (!updated[menuId] || typeof updated[menuId] !== 'object') {
        updated[menuId] = { view: false, edit: false, delete: false };
      }
      updated[menuId][action] = !updated[menuId][action];
      return updated;
    });
  };

  const savePermissions = async () => {
    if (!selectedRole) return;
    setLoading(true);
    try {
      await smartApi.auth.saveRole({
        role_name: selectedRole.role_name,
        mosque_id: selectedRole.mosque_id || null,
        permissions: JSON.stringify(editingPermissions || {})
      });
      
      toast.success("Hak akses berhasil diperbarui ✅");
      
      // Delay sedikit agar DB sempat commit
      setTimeout(() => {
        if (reload) reload();
      }, 500);
      
    } catch (e) {
      console.error("[SAVE ERROR]", e);
      toast.error("Gagal simpan: " + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Pengaturan Hak Akses (Role)" 
        description="Atur modul apa saja yang bisa dilihat, diubah, atau dihapus oleh setiap role (Superadmin, Jamaah, dsb)." 
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card rounded-xl border p-4 space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase">Role Utama Sistem</h3>
              <div className="space-y-1">
                {localRoles.map(rp => (
                  <button 
                    key={`${rp.mosque_id}-${rp.role_name}`}
                    onClick={() => handleSelectRole(rp)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-colors ${selectedRole?.role_name === rp.role_name && selectedRole?.mosque_id === rp.mosque_id ? 'bg-primary/10 text-primary border border-primary/20' : 'hover:bg-muted text-foreground'}`}
                  >
                    <span className="capitalize">{rp.role_name}</span>
                    {!DEFAULT_ROLES.includes(rp.role_name) && (
                      <Trash2 
                        className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive transition-colors" 
                        onClick={(e) => { e.stopPropagation(); handleDeleteRole(rp.id, rp.role_name); }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Button variant="outline" className="w-full gap-2 border-dashed" onClick={handleAddNewRole}>
               <Plus className="h-4 w-4" /> Tambah Role Kustom
            </Button>
          </div>
          
          <div className="text-[10px] text-muted-foreground pt-4 border-t leading-relaxed">
            Role <b>superadmin</b> memiliki akses penuh. Role <b>jamaah</b> sebaiknya hanya memiliki akses View ke Dashboard Jamaah / Info Publik.
          </div>
        </div>

        <div className="md:col-span-3 bg-card rounded-xl border overflow-hidden">
          {selectedRole ? (
            <div>
              <div className="p-4 border-b bg-muted/20 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-lg">Hak Akses: <Badge className="capitalize">{selectedRole.role_name}</Badge></h2>
                </div>
                <Button onClick={savePermissions} disabled={loading} size="sm" className="gap-2">
                  <Save className="h-4 w-4" /> Simpan Perubahan
                </Button>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="text-left font-semibold p-4">Modul / Menu</th>
                      <th className="text-center font-semibold p-4 w-28">Melihat (View)</th>
                      <th className="text-center font-semibold p-4 w-28">Ubah (Edit)</th>
                      <th className="text-center font-semibold p-4 w-28">Hapus (Delete)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {AVAILABLE_MENUS.map(menu => {
                      const perms = (editingPermissions && editingPermissions[menu.id]) || { view: false, edit: false, delete: false };
                      return (
                        <tr key={menu.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="p-4 font-medium">{menu.label}</td>
                          <td className="p-4 text-center">
                            <Checkbox 
                              checked={!!perms.view}
                              onCheckedChange={() => togglePermission(menu.id, 'view')}
                            />
                          </td>
                          <td className="p-4 text-center">
                            <Checkbox 
                              checked={!!perms.edit}
                              onCheckedChange={() => togglePermission(menu.id, 'edit')}
                            />
                          </td>
                          <td className="p-4 text-center">
                            <Checkbox 
                              checked={!!perms.delete}
                              onCheckedChange={() => togglePermission(menu.id, 'delete')}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground h-full flex flex-col items-center justify-center">
              <ShieldAlert className="h-12 w-12 opacity-20 mb-4" />
              <p>Pilih Role di samping untuk mengatur hak aksesnya.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
