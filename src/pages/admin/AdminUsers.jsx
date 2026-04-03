import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import { formatDate } from "@/lib/formatCurrency";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Users, Search, KeyRound, Mail, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Admin Invitation
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  
  // Manual Password Reset
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await smartApi.entities.User.list('-created_at'); // Menggunakan created_at sesuai schema mysql
      setUsers(data);
    } catch (e) {
      toast.error("Gagal memuat data pengguna");
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite() {
    if (!inviteEmail) return;
    setInviting(true);
    try {
      // Mocking invitation or using a real endpoint if available
      toast.success(`Fitur undangan akan segera tersedia. Email ${inviteEmail} dicatat.`);
      setInviteEmail("");
      setShowInvite(false);
    } catch (error) {
      toast.error("Gagal mengirim undangan");
    } finally {
      setInviting(false);
    }
  }

  async function handleManualReset() {
    if (!selectedUser || !newPassword) return;
    if (newPassword.length < 6) return toast.error("Password minimal 6 karakter");
    
    setResetting(true);
    try {
      const res = await smartApi.admin.resetUserPassword(selectedUser.id, newPassword);
      toast.success(res.message);
      setShowResetDialog(false);
      setNewPassword("");
      setSelectedUser(null);
    } catch (error) {
      toast.error(error.response?.data?.error || "Gagal mereset password pengguna");
    } finally {
      setResetting(false);
    }
  }

  const filtered = users.filter(u =>
    !search || 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Manajemen Pengguna" description={`${users.length} pengguna terdaftar di platform`}>
        <Button onClick={() => setShowInvite(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Mail className="h-4 w-4" /> Undang Pengguna
        </Button>
      </PageHeader>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cari nama atau email..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="Belum Ada Pengguna" />
      ) : (
        <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold">Nama Lengkap</TableHead>
                  <TableHead className="font-semibold">Alamat Email</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold">Terdaftar</TableHead>
                  <TableHead className="font-semibold text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(u => (
                  <TableRow key={u.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium">{u.full_name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{u.email}</span>
                        {u.phone && <span className="text-[10px] text-muted-foreground">{u.phone}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={(u.role === 'admin' || u.role === 'superadmin') ? 'default' : 'secondary'}
                        className={(u.role === 'admin' || u.role === 'superadmin') ? "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200" : ""}
                      >
                        {(u.role === 'admin' || u.role === 'superadmin') ? 'Super Admin' : u.role === 'mosque_admin' ? 'Pengurus' : 'Jamaah'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.created_at ? formatDate(u.created_at) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-2 text-xs border-amber-200 text-amber-700 hover:bg-amber-50" 
                        onClick={() => { setSelectedUser(u); setShowResetDialog(true); }}
                      >
                        <KeyRound className="h-3.5 w-3.5" /> Ganti Password
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Dialog Reset Password Manual */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              Reset Password Manual
            </DialogTitle>
            <DialogDescription>
              Ubah password untuk user <strong>{selectedUser?.email}</strong>. 
              Tindakan ini juga akan menonaktifkan Autentikasi 2FA (jika aktif).
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Password Baru</label>
              <Input 
                type="password" 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                placeholder="Masukkan password baru..." 
                autoFocus
              />
              <p className="text-[10px] text-muted-foreground italic">
                * Pastikan Anda memberikan password ini kepada user terkait setelah berhasil diubah.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowResetDialog(false)}>Batal</Button>
            <Button 
              className="bg-amber-600 hover:bg-amber-700"
              onClick={handleManualReset} 
              disabled={resetting || !newPassword}
            >
              {resetting ? 'Memproses...' : 'Ubah Password Sekarang'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Invite User */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Undang Pengguna Baru</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Tujuan</label>
              <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@contoh.com" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Link pendaftaran akan dikirimkan ke alamat email di atas.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>Batal</Button>
            <Button onClick={handleInvite} disabled={inviting}>{inviting ? 'Mengirim...' : 'Kirim Undangan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}