import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import { formatDate } from "@/lib/formatCurrency";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Search, KeyRound, Mail } from "lucide-react";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [resetLoading, setResetLoading] = useState(null);
  
  // State for changing password modal
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const data = await smartApi.entities.User.list('-created_date');
    setUsers(data);
    setLoading(false);
  }

  async function handleInvite() {
    if (!inviteEmail) return;
    setInviting(true);
    await smartApi.users.inviteUser(inviteEmail, "user");
    toast.success(`Undangan dikirim ke ${inviteEmail}`);
    setInviteEmail("");
    setShowInvite(false);
    setInviting(false);
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

  // Handle generic reset email as well
  async function handleResetPassword(email) {
    setResetLoading(email);
    try {
      await smartApi.integrations.Core.SendEmail({
        to: email,
        subject: "Reset Password - MasjidKu",
        body: `Halo,\n\nAnda menerima email ini karena admin MasjidKu meminta reset password untuk akun Anda.\n\nUntuk mereset password, silakan buka halaman login MasjidKu dan klik tombol "Lupa Password", lalu masukkan email Anda: ${email}\n\nJika Anda tidak meminta reset password, abaikan email ini.\n\nSalam,\nTim MasjidKu`
      });
      toast.success(`Email panduan reset password dikirim ke ${email}`);
    } catch (error) {
      toast.error(`Gagal mengirim email ke ${email}`);
    } finally {
      setResetLoading(null);
    }
  }

  const filtered = users.filter(u =>
    !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Pengguna" description={`${users.length} pengguna terdaftar`}>
        <Button onClick={() => setShowInvite(true)} className="gap-2">
          <Mail className="h-4 w-4" /> Undang Pengguna
        </Button>
      </PageHeader>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cari pengguna..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="Belum Ada Pengguna" />
      ) : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Bergabung</TableHead>
                  <TableHead className="w-40 text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name || '-'}</TableCell>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                        {u.role === 'admin' ? 'Super Admin' : 'User'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(u.created_date)}</TableCell>
                    <TableCell className="text-center flex justify-center gap-2">
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => openChangePasswordDialog(u)}>
                        <KeyRound className="h-3 w-3 mr-1" /> Ganti PW
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Undang Pengguna Baru</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <label className="text-sm font-medium">Email</label>
            <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@masjid.id" />
            <p className="text-xs text-muted-foreground">Pengguna akan menerima email undangan untuk bergabung.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowInvite(false)}>Batal</Button>
              <Button onClick={handleInvite} disabled={inviting}>{inviting ? 'Mengirim...' : 'Kirim Undangan'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Ganti Password Pengguna</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm">Mengubah password untuk akun: <strong>{selectedUserForPassword?.email}</strong></p>
            <label className="text-sm font-medium">Password Baru</label>
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Masukkan password baru..." />
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setShowChangePassword(false)}>Batal</Button>
              <Button onClick={handleAdminChangePassword} disabled={changingPassword}>{changingPassword ? 'Menyimpan...' : 'Simpan Password'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}