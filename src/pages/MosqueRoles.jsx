import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import PageHeader from "@/components/PageHeader";
import { ShieldAlert, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useMosqueContext } from "@/lib/useMosqueContext";

const MOSQUE_MENUS = [
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
  { id: "portfolio", label: "Portofolio Digital" },
  { id: "tv", label: "TV Masjid Smart" },
  { id: "telegram", label: "Integrasi Telegram" },
  { id: "pengaturan", label: "Pengaturan Masjid" }
];

const PROTECTED_ROLES = ["superadmin", "admin_masjid"];

export default function MosqueRoles() {
  const { currentMosque, rolePermissions: globalRolePermissions, reload } = useMosqueContext();
  const [localRoles, setLocalRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [editingPermissions, setEditingPermissions] = useState({});
  const [loading, setLoading] = useState(false);

  // Filter menus based on active features
  const activeFeatures = currentMosque?.plan_features || [];
  const filteredMenus = MOSQUE_MENUS.filter(menu => {
    // If it's a core feature or in plan_features
    if (["dashboard", "pengaturan", "jamaah-dashboard", "info-publik"].includes(menu.id)) return true;
    return activeFeatures.includes(menu.label);
  });

  useEffect(() => {
    if (globalRolePermissions) {
      // Smart Merge: For each role name, prioritize Local Mosque Data over Global Template
      const data = globalRolePermissions || [];
      const mergedRoles = [];
      const roleNames = Array.from(new Set(data.map(r => r.role_name)));
      
      roleNames.forEach(name => {
        const local = data.find(r => r.role_name === name && r.mosque_id !== null && r.mosque_id === currentMosque?.id);
        const globalRole = data.find(r => r.role_name === name && r.mosque_id === null);
        
        if (local) {
          mergedRoles.push({ ...local, has_override: true });
        } else if (globalRole) {
          mergedRoles.push({ ...globalRole, has_override: false });
        }
      });

      setLocalRoles(mergedRoles);

      // Sinkronkan data selectedRole jika sedang dibuka
      if (selectedRole) {
        const fresh = mergedRoles.find(r => r.role_name === selectedRole.role_name);
        if (fresh) {
          setSelectedRole(fresh);
          // Load fresh permissions into editor
          try {
            const perms = typeof fresh.permissions === 'string' ? JSON.parse(fresh.permissions) : (fresh.permissions || {});
            setEditingPermissions(perms);
          } catch(e) { setEditingPermissions({}); }
        }
      } else if (mergedRoles.length > 0) {
        handleSelectRole(mergedRoles[0]);
      }
    }
  }, [currentMosque, globalRolePermissions]);

  async function loadData() {
    // Context handles the data, we just react
  }

  const handleAddNewRole = async () => {
    const name = prompt("Masukkan nama role baru (contoh: sekretaris):");
    if (!name) return;
    const roleKey = name.toLowerCase().replace(/\s+/g, '_');
    if (globalRolePermissions.find(r => r.role_name === roleKey)) return toast.error("Role sudah ada.");

    try {
       const newRp = await smartApi.auth.saveRole({
         role_name: roleKey,
         permissions: "{}",
         is_local: true
       });
       toast.success(`Role ${roleKey} berhasil dibuat.`);
       if (reload) reload();
    } catch (e) {
       toast.error("Gagal tambah role: " + e.message);
    }
  };

  const handleDeleteRole = async (name, mosqueId) => {
    if (PROTECTED_ROLES.includes(name)) return toast.error("Role sistem tidak bisa dihapus.");
    if (!mosqueId) return toast.error("Role Template dari Pusat tidak bisa dihapus.");
    
    if (!confirm(`Hapus role kustom "${name}"?`)) return;
    
    try {
      await smartApi.auth.deleteRole(name, true);
      toast.success(`Role ${name} berhasil dihapus`);
      setSelectedRole(null);
      if (reload) reload();
    } catch (e) {
      toast.error("Gagal hapus role: " + e.message);
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
      // Safety guard against malformed data
      if (!updated[menuId] || typeof updated[menuId] !== 'object') {
        updated[menuId] = { view: false, edit: false, delete: false };
      }
      updated[menuId][action] = !updated[menuId][action];
      return updated;
    });
  };

  const savePermissions = async () => {
    if (!selectedRole || !currentMosque) return;
    setLoading(true);
    try {
      await smartApi.auth.saveRole({
        role_name: selectedRole.role_name,
        mosque_id: currentMosque.id,
        permissions: JSON.stringify(editingPermissions || {})
      });
      
      toast.success("Hak akses staff berhasil diperbarui ✅");
      
      // Jeda agar DB commit
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
        title="Pengaturan Hak Akses Staff" 
        description="Atur modul apa saja yang bisa diakses oleh pengurus atau staff masjid anda." 
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card rounded-xl border p-4 space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase">Role Pengurus</h3>
              <div className="space-y-1">
                {localRoles.map(rp => (
                  <button 
                    key={`${rp.mosque_id}-${rp.role_name}`}
                    onClick={() => handleSelectRole(rp)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-colors ${selectedRole?.role_name === rp.role_name && selectedRole?.mosque_id === rp.mosque_id ? 'bg-primary/10 text-primary border border-primary/20' : 'hover:bg-muted text-foreground'}`}
                  >
                    <div className="flex items-center gap-2">
                       <span className="capitalize">{rp.role_name}</span>
                       {!rp.mosque_id && <Badge variant="outline" className="text-[9px] px-1 h-3.5 opacity-50">Template</Badge>}
                    </div>
                    {rp.mosque_id && !PROTECTED_ROLES.includes(rp.role_name) && (
                      <Trash2 
                        className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive transition-colors" 
                        onClick={(e) => { e.stopPropagation(); handleDeleteRole(rp.role_name, rp.mosque_id); }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Button variant="outline" className="w-full gap-2 border-dashed" onClick={handleAddNewRole}>
               <Plus className="h-4 w-4" /> Tambah Role Staff
            </Button>
          </div>
          
          <div className="text-[10px] text-muted-foreground pt-4 border-t leading-relaxed">
            Info: Role dengan label <b>Template</b> adalah role standar dari sistem. Jika anda mengubahnya, perubahan hanya berlaku untuk masjid anda.
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
                  <Save className="h-4 w-4" /> Simpan Hak Akses
                </Button>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="text-left font-semibold p-4">Modul / Fitur</th>
                      <th className="text-center font-semibold p-4 w-28">Akses (View)</th>
                      <th className="text-center font-semibold p-4 w-28">Ubah (Edit)</th>
                      <th className="text-center font-semibold p-4 w-28">Hapus (Delete)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMenus.map(menu => {
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
              {filteredMenus.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                   Tidak ada fitur yang tersedia untuk diatur hak aksesnya.
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground h-full flex flex-col items-center justify-center">
              <ShieldAlert className="h-12 w-12 opacity-20 mb-4" />
              <p>Pilih Role Pengurus di samping.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
