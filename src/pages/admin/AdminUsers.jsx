import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import { formatDate } from "@/lib/formatCurrency";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Search, KeyRound, Mail, ShieldCheck, UserCog, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import ActionConfirm from "@/components/ActionConfirm";
import { useMosqueContext } from "@/lib/useMosqueContext";

const ROLES = [
  { value: "superadmin", label: "Super Admin" },
  { value: "admin_masjid", label: "Admin Masjid" },
  { value: "pengurus", label: "Pengurus / DKM" },
  { value: "bendahara", label: "Bendahara" },
  { value: "ketua_dkm", label: "Ketua DKM" },
  { value: "sekretaris", label: "Sekretaris" },
  { value: "imam", label: "Imam" },
  { value: "marbot", label: "Marbot / Marudin" },
  { value: "amil", label: "Amil Zakat" },
  { value: "humas", label: "Humas / IT Admin" },
  { value: "donatur", label: "Donatur" },
  { value: "jamaah", label: "Jamaah" },
  { value: "user", label: "User Umum" }
];

export default function AdminUsers() {
  const { currentMosque } = useMosqueContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // States for Security Smart
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // New Edit States
  const [showConfirmEdit, setShowConfirmEdit] = useState(false);
  const [editType, setEditType] = useState(null); // "role" | "password"
  const [pendingUpdate, setPendingUpdate] = useState(null);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("user");
  const [updatingRole, setUpdatingRole] = useState(false);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (currentMosque) loadData();
  }, [currentMosque]);

  async function loadData() {
    setLoading(true);
    try {
      const data = await smartApi.entities.User.list();
      setUsers(data);
    } catch (e) {
      toast.error("Gagal memuat data pengguna");
    } finally {
      setLoading(false);
    }
  }

  async function executeDelete() {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await smartApi.entities.User.delete(userToDelete.id);
      toast.success(`🗑️ ${userToDelete.full_name || userToDelete.email} berhasil dihapus`);
      setShowConfirmDelete(false);
      setUserToDelete(null);
      loadData();
    } catch (e) {
      toast.error("Gagal menghapus pengguna");
    } finally {
      setDeleting(false);
    }
  }

  async function executeEdit() {
    if (editType === "role") {
      setUpdatingRole(true);
      try {
        await smartApi.entities.MosqueMember.update(editingUser.id, { role: selectedRole });
        toast.success(`✅ Role ${editingUser.user_email} diperbarui menjadi ${selectedRole}`);
        setShowRoleDialog(false);
        setShowConfirmEdit(false);
        loadData();
      } catch (e) {
        toast.error("Gagal memperbarui role");
      } finally {
        setUpdatingRole(false);
      }
    } else if (editType === "password") {
      setChangingPassword(true);
      try {
        await smartApi.auth.adminChangePassword({ userId: selectedUserForPassword.user_id || selectedUserForPassword.id, newPassword });
        toast.success(`✅ Password untuk ${selectedUserForPassword.user_email} berhasil diubah.`);
        setShowChangePassword(false);
        setShowConfirmEdit(false);
      } catch (e) {
        toast.error("Gagal mengubah password: " + e.message);
      } finally {
        setChangingPassword(false);
      }
    }
  }

  function handleUpdateRole() {
    setEditType("role");
    setShowConfirmEdit(true);
  }

  function handleAdminChangePassword() {
    if (!newPassword) {
      toast.error("Password baru wajib diisi");
      return;
    }
    setEditType("password");
    setShowConfirmEdit(true);
  }

  async function handleInvite() {
    if (!inviteEmail) return;
    setInviting(true);
    try {
       await smartApi.users.inviteUser(inviteEmail, "user");
       toast.success(`Undangan dikirim ke ${inviteEmail}`);
       setInviteEmail("");
       setShowInvite(false);
    } catch (e) {
       toast.error("Gagal mengirim undangan");
    } finally {
       setInviting(false);
    }
  }

  function openChangePasswordDialog(user) {
    setSelectedUserForPassword(user);
    setNewPassword("");
    setShowChangePassword(true);
  }

  async function handleAdminChangePassword() {
    if (!newPassword) {
      toast.error("Password baru wajib diisi");
      return;
    }
    setChangingPassword(true);
    try {
      await smartApi.auth.adminChangePassword({ userId: selectedUserForPassword.id, newPassword });
      toast.success(`Password untuk ${selectedUserForPassword.email} berhasil diubah.`);
      setShowChangePassword(false);
    } catch (error) {
      toast.error(error.message || "Gagal mengubah password");
    } finally {
      setChangingPassword(false);
    }
  }

  function openRoleDialog(user) {
     setEditingUser(user);
     setSelectedRole(user.role || "user");
     setShowRoleDialog(true);
  }

  async function handleUpdateRole() {
     setUpdatingRole(true);
     try {
        await smartApi.entities.User.update(editingUser.id, { role: selectedRole });
        toast.success(`Role ${editingUser.email} diperbarui menjadi ${selectedRole}`);
        setShowRoleDialog(false);
        loadData();
     } catch (e) {
        toast.error("Gagal memperbarui role");
     } finally {
        setUpdatingRole(false);
     }
  }

  const filtered = users.filter(u =>
    !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Manajemen Akses & Pengguna" description={`${users.length} personil terdaftar di sistem`}>
        <Button onClick={() => setShowInvite(true)} className="gap-2 shadow-lg shadow-primary/20">
          <Mail className="h-4 w-4" /> Undang Pengguna
        </Button>
      </PageHeader>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cari nama atau email..." className="pl-9 rounded-xl border-slate-200" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="Belum Ada Pengguna" />
      ) : (
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold">Nama & Email</TableHead>
                  <TableHead className="font-bold">Otorisasi (Role)</TableHead>
                  <TableHead className="font-bold">Bergabung</TableHead>
                  <TableHead className="w-60 text-right pr-6 font-bold">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(u => (
                  <TableRow key={u.id} className="hover:bg-slate-50/50">
                    <TableCell>
                       <div className="font-bold text-slate-900">{u.full_name || '-'}</div>
                       <div className="text-xs text-slate-400">{u.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={u.role === 'admin' ? 'default' : 'secondary'}
                        className={`capitalize px-3 py-1 ${u.role === 'admin' ? 'bg-indigo-600 shadow-sm' : ''}`}
                      >
                        {u.role === 'admin' ? <ShieldCheck className="h-3 w-3 mr-1" /> : null}
                        {u.role === 'admin' ? 'Super Admin' : (u.role?.replace('_', ' ') || 'User')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500 font-medium">{formatDate(u.createdAt)}</TableCell>
                    <TableCell className="text-right pr-4 space-x-2">
                      <Button size="sm" variant="outline" className="h-8 px-3 text-xs gap-1.5 border-slate-200 hover:bg-slate-100" onClick={() => openRoleDialog(u)}>
                        <UserCog className="h-3.5 w-3.5" /> Otorisasi
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 px-3 text-xs gap-1.5 text-slate-500 hover:text-indigo-600" onClick={() => openChangePasswordDialog(u)}>
                        <KeyRound className="h-3.5 w-3.5" /> Ganti Password
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 px-3 text-xs gap-1.5 text-red-500 hover:text-red-700 hover:bg-red-50" 
                        onClick={() => {
                          setUserToDelete(u);
                          setShowConfirmDelete(true);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Hapus
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <ActionConfirm 
        open={showConfirmDelete}
        onOpenChange={setShowConfirmDelete}
        onConfirm={executeDelete}
        title="Hapus Pengguna?"
        description={`Apakah Bapak yakin ingin menghapus ${userToDelete?.full_name || userToDelete?.email} dari sistem masjid?`}
        requirePin={true}
        loading={deleting}
      />

      <ActionConfirm 
        open={showConfirmEdit}
        onOpenChange={setShowConfirmEdit}
        onConfirm={executeEdit}
        title="Konfirmasi Perubahan"
        description={editType === 'role' ? "Apakah Bapak yakin ingin mengubah hak akses (Role) pengurus ini?" : "Apakah Bapak yakin ingin mereset password pengurus ini?"}
        confirmText="Ya, Simpan Perubahan"
        variant="default"
        requirePin={true}
        loading={updatingRole || changingPassword}
      />

      {/* Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
         <DialogContent className="max-w-sm rounded-[2rem] p-8">
            <DialogHeader>
               <DialogTitle className="text-2xl font-black">Ubah Otorisasi</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
               <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">Pengguna</label>
                  <div className="p-4 bg-slate-50 rounded-2xl border flex items-center gap-3">
                     <div className="w-10 h-10 bg-white rounded-full border flex items-center justify-center font-bold text-primary">
                        {editingUser?.full_name?.[0] || 'U'}
                     </div>
                      <div className="flex-1 min-w-0">
                         <p className="font-bold text-sm truncate">{editingUser?.full_name}</p>
                         <p className="text-xs text-slate-400 truncate">{editingUser?.email}</p>
                      </div>
                  </div>
               </div>
               
               <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">Otorisasi Baru (Role)</label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                     <SelectTrigger className="rounded-xl h-12 border-slate-200 focus:ring-primary/20">
                        <SelectValue placeholder="Pilih Role" />
                     </SelectTrigger>
                     <SelectContent className="rounded-xl shadow-2xl">
                        {ROLES.map(r => (
                           <SelectItem key={r.value} value={r.value} className="text-xs font-semibold py-3 cursor-pointer">
                              {r.label}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>

               <Button 
                onClick={handleUpdateRole} 
                className="w-full h-12 rounded-2xl font-bold shadow-lg shadow-primary/20" 
                disabled={updatingRole}
               >
                  {updatingRole ? "Memperbarui..." : "Update Otorisasi"}
               </Button>
            </div>
         </DialogContent>
      </Dialog>

      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-sm rounded-[2rem] p-8">
          <DialogHeader><DialogTitle className="text-xl font-bold">Undang Pengguna Baru</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Tujuan</label>
            <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@masjid.id" className="h-12 rounded-xl focus:ring-primary/20 border-slate-200" />
            <p className="text-xs text-muted-foreground bg-slate-50 p-3 rounded-xl">📧 Pengguna akan menerima email undangan untuk login ke platform MasjidKu Smart.</p>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" className="rounded-xl px-6" onClick={() => setShowInvite(false)}>Batal</Button>
              <Button onClick={handleInvite} disabled={inviting} className="rounded-xl px-8">{inviting ? 'Mengirim...' : 'Kirim Undangan'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="max-w-sm rounded-[2rem] p-8">
          <DialogHeader><DialogTitle className="text-xl font-bold">Reset Password</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-xs text-slate-500">Mengubah paksa password akun: <span className="font-bold text-slate-900 border-b">{selectedUserForPassword?.email}</span></p>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password Baru</label>
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Masukkan password minimal 6 karakter..." className="h-12 rounded-xl focus:ring-primary/20 border-slate-200" />
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" className="rounded-xl px-6" onClick={() => setShowChangePassword(false)}>Batal</Button>
              <Button onClick={handleAdminChangePassword} disabled={changingPassword} className="rounded-xl px-8">{changingPassword ? 'Menyimpan...' : 'Simpan Password'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
