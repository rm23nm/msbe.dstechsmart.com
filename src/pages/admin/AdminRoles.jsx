import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import PageHeader from "@/components/PageHeader";
import { ShieldAlert, Plus, Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";

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

const STANDARD_ROLES = ["superadmin", "admin_masjid", "bendahara", "pengurus", "user", "jamaah"];

export default function AdminRoles() {
  const [rolePermissions, setRolePermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [editingPermissions, setEditingPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await smartApi.entities.RolePermission.list();
      setRolePermissions(data);
      if (data.length > 0 && !selectedRole) {
        handleSelectRole(data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Create default if not exist when selecting an empty role from dropdown
  const handleSelectRoleName = async (roleName) => {
    let rp = rolePermissions.find(r => r.role_name === roleName);
    if (!rp) {
      // Create it
      rp = await smartApi.entities.RolePermission.create({
        role_name: roleName,
        permissions: "{}"
      });
      setRolePermissions([...rolePermissions, rp]);
    }
    handleSelectRole(rp);
  };

  const handleSelectRole = (rp) => {
    setSelectedRole(rp);
    try {
      setEditingPermissions(JSON.parse(rp.permissions || "{}"));
    } catch {
      setEditingPermissions({});
    }
  };

  const togglePermission = (menuId, action) => {
    setEditingPermissions(prev => {
      const updated = { ...prev };
      if (!updated[menuId]) {
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
      await smartApi.entities.RolePermission.update(selectedRole.id, {
        permissions: JSON.stringify(editingPermissions)
      });
      toast({ title: "Berhasil disimpan", description: "Pengaturan hak akses berhasil di-update." });
      loadData();
    } catch (e) {
      toast({ title: "Gagal menyimpan", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Pengaturan Hak Akses (Role)" 
        description="Atur modul apa saja yang bisa dilihat, diubah, atau dihapus oleh setiap role (Superadmin, Jamaah, dsb)." 
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card rounded-xl border p-4 space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">Pilih Role</h3>
            <Select 
              value={selectedRole?.role_name} 
              onValueChange={handleSelectRoleName}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Role" />
              </SelectTrigger>
              <SelectContent>
                {STANDARD_ROLES.map(r => (
                  <SelectItem key={r} value={r}>
                    {r === "user" ? "user (Umum)" : r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-xs text-muted-foreground pt-4 border-t">
            Info: Role <b>superadmin</b> umumnya diberikan akses penuh ke semua modul. Role <b>jamaah</b> dan <b>user</b> sebaiknya hanya memiliki akses View ke Dashboard Jamaah / Info Publik.
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
                      const perms = editingPermissions[menu.id] || { view: false, edit: false, delete: false };
                      return (
                        <tr key={menu.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="p-4 font-medium">{menu.label}</td>
                          <td className="text-center p-4">
                            <Checkbox 
                              checked={perms.view} 
                              onCheckedChange={() => togglePermission(menu.id, "view")} 
                            />
                          </td>
                          <td className="text-center p-4">
                            <Checkbox 
                              checked={perms.edit} 
                              onCheckedChange={() => togglePermission(menu.id, "edit")} 
                            />
                          </td>
                          <td className="text-center p-4">
                            <Checkbox 
                              checked={perms.delete} 
                              onCheckedChange={() => togglePermission(menu.id, "delete")} 
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
