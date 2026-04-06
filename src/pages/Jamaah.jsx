import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import { useMosqueContext } from "@/lib/useMosqueContext";
import { useLanguage } from "@/lib/useLanguage";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import JamaahForm from "../components/jamaah/JamaahForm";
import StatCard from "../components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Users, Pencil, Trash2, Search, KeyRound, Download, LayoutGrid, List, UserCheck, UserCog, Send, MessageSquare, Mail } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const roleColors = {
  admin_masjid: "bg-purple-100 text-purple-700",
  bendahara: "bg-amber-100 text-amber-700",
  pengurus: "bg-blue-100 text-blue-700",
  jamaah: "bg-gray-100 text-gray-600",
};

export default function Jamaah() {
  const { currentMosque, loading, isMosqueAdmin, isAdmin } = useMosqueContext();
  const { t } = useLanguage();
  const [members, setMembers] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [viewMode, setViewMode] = useState("table"); // table | card
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState({ subject: "", body: "", channel: "email", filterCategory: "all" });
  const [broadcasting, setBroadcasting] = useState(false);
  
  // State for changing password
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const roleLabels = {
    admin_masjid: t("roleAdmin"),
    bendahara: t("roleBendahara"),
    pengurus: t("rolePengurus"),
    jamaah: t("roleJamaah"),
  };

  useEffect(() => {
    if (currentMosque) loadData();
  }, [currentMosque]);

  async function loadData() {
    setDataLoading(true);
    const mems = await smartApi.entities.MosqueMember.filter({ mosque_id: currentMosque.id }, "user_name");
    setMembers(mems);
    setDataLoading(false);
  }

  async function handleSave(data) {
    if (editItem) {
      await smartApi.entities.MosqueMember.update(editItem.id, data);
    } else {
      await smartApi.entities.MosqueMember.create({ ...data, mosque_id: currentMosque.id, status: "active" });
    }
    setShowForm(false);
    setEditItem(null);
    loadData();
  }

  async function handleDelete(id) {
    if (!confirm(t("deleteConfirm"))) return;
    await smartApi.entities.MosqueMember.delete(id);
    loadData();
  }

  async function handleBroadcast() {
    setBroadcasting(true);
    const targets = members.filter(m => {
      if (broadcastMsg.filterCategory === "all") return true;
      return (m.categories || []).includes(broadcastMsg.filterCategory);
    });
    let sent = 0;
    for (const m of targets) {
      if (broadcastMsg.channel === "email" && m.user_email) {
        await smartApi.integrations.Core.SendEmail({
          to: m.user_email,
          subject: broadcastMsg.subject || "Pengumuman Masjid",
          body: broadcastMsg.body,
        });
        sent++;
      } else if (broadcastMsg.channel === "whatsapp") {
        const wa = m.whatsapp || m.phone;
        if (wa) {
          const num = wa.replace(/\D/g, "");
          window.open(`https://wa.me/${num}?text=${encodeURIComponent(broadcastMsg.body)}`, "_blank");
          sent++;
        }
      }
    }
    toast.success(`Pesan terkirim ke ${sent} jamaah`);
    setShowBroadcast(false);
    setBroadcasting(false);
  }

  function openChangePasswordDialog(m) {
    if (!m.user_email) {
      toast.error("Anggota ini tidak memiliki email yang terdaftar.");
      return;
    }
    setSelectedUserForPassword(m);
    setNewPassword("");
    setShowChangePassword(true);
  }

  async function handleAdminChangePassword() {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter.");
      return;
    }
    setChangingPassword(true);
    try {
      await smartApi.auth.adminChangePassword({ email: selectedUserForPassword.user_email, newPassword });
      toast.success(`Password untuk jamaah ${selectedUserForPassword.user_name || selectedUserForPassword.user_email} berhasil diubah.`);
      setShowChangePassword(false);
    } catch (error) {
      toast.error(error.message || "Gagal mengubah password jamaah. Pastikan jamaah tersebut sudah mendaftarkan akun aplikasinya.");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleResetPassword(m) {
    if (!m.user_email) return;
    await smartApi.integrations.Core.SendEmail({
      to: m.user_email,
      subject: "Reset Password - MasjidKu",
      body: `Halo ${m.user_name || ""},\n\nAdmin masjid meminta reset password untuk akun Anda.\n\nSilakan buka halaman login dan klik "Lupa Password", lalu masukkan email: ${m.user_email}\n\nJazakallah khairan,\nTim ${currentMosque?.name}`,
    });
    toast.success(`${t("resetSent")} ${m.user_email}`);
  }

  function exportCSV() {
    const rows = [["Nama", "Email", "Telepon", "Peran", "Status", "Bergabung"]];
    filtered.forEach((m) =>
      rows.push([m.user_name || "", m.user_email || "", m.user_phone || "", roleLabels[m.role] || m.role, m.status, m.created_date?.split("T")[0] || ""])
    );
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jamaah-${currentMosque?.name || "masjid"}.csv`;
    a.click();
  }

  if (loading || !currentMosque)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );

  const canManage = isMosqueAdmin || isAdmin;

  const filtered = members.filter((m) => {
    const matchSearch =
      !search ||
      m.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.user_email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || m.role === filterRole;
    return matchSearch && matchRole;
  });

  const stats = {
    total: members.length,
    active: members.filter((m) => m.status === "active").length,
    admin: members.filter((m) => ["admin_masjid", "bendahara", "pengurus"].includes(m.role)).length,
    jamaah: members.filter((m) => m.role === "jamaah").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("membersTitle")} description={`${members.length} ${t("membersDesc")}`}>
        <div className="flex gap-2">
          {canManage && (
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
              <Download className="h-4 w-4" /> {t("exportCSV")}
            </Button>
          )}
          {canManage && (
            <Button variant="outline" onClick={() => setShowBroadcast(true)} className="gap-2">
              <Send className="h-4 w-4" /> Kirim Pesan
            </Button>
          )}
          {canManage && (
            <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="gap-2">
              <Plus className="h-4 w-4" /> {t("addMember")}
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title={t("totalMembers")} value={stats.total} icon={Users} />
        <StatCard title={t("activeMembers")} value={stats.active} icon={UserCheck} />
        <StatCard title={t("totalAdmin")} value={stats.admin} icon={UserCog} />
        <StatCard title={t("totalJamaah")} value={stats.jamaah} icon={Users} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("searchMember")} className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allRoles")}</SelectItem>
            <SelectItem value="admin_masjid">{t("roleAdmin")}</SelectItem>
            <SelectItem value="bendahara">{t("roleBendahara")}</SelectItem>
            <SelectItem value="pengurus">{t("rolePengurus")}</SelectItem>
            <SelectItem value="jamaah">{t("roleJamaah")}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex border rounded-md">
          <Button size="icon" variant={viewMode === "table" ? "default" : "ghost"} className="h-9 w-9 rounded-r-none" onClick={() => setViewMode("table")}>
            <List className="h-4 w-4" />
          </Button>
          <Button size="icon" variant={viewMode === "card" ? "default" : "ghost"} className="h-9 w-9 rounded-l-none" onClick={() => setViewMode("card")}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {dataLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title={t("noMembers")} description={t("noMembersDesc")} />
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((m) => (
            <div key={m.id} className="bg-card border rounded-xl p-4 space-y-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{(m.user_name || m.user_email || "?")[0].toUpperCase()}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[m.role] || roleColors.jamaah}`}>
                  {roleLabels[m.role] || m.role}
                </span>
              </div>
              <div>
                <p className="font-medium text-sm">{m.user_name || "-"}</p>
                <p className="text-xs text-muted-foreground truncate">{m.user_email}</p>
                {m.user_phone && <p className="text-xs text-muted-foreground">{m.user_phone}</p>}
              </div>
              <div className="flex items-center justify-between">
                <Badge variant={m.status === "active" ? "default" : "secondary"} className="text-xs">
                  {m.status === "active" ? t("active") : t("inactive")}
                </Badge>
                {canManage && (
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditItem(m); setShowForm(true); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Ganti Password" onClick={() => openChangePasswordDialog(m)}>
                      <KeyRound className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(m.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("email")}</TableHead>
                  <TableHead>{t("phone")}</TableHead>
                  <TableHead>{t("role")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("joinDate")}</TableHead>
                  {canManage && <TableHead className="w-24">{t("actions")}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.user_name || "-"}</TableCell>
                    <TableCell className="text-sm">{m.user_email}</TableCell>
                    <TableCell className="text-sm">{m.user_phone || "-"}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleColors[m.role] || roleColors.jamaah}`}>
                        {roleLabels[m.role] || m.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.status === "active" ? "default" : "secondary"}>
                        {m.status === "active" ? t("active") : t("inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {m.created_date?.split("T")[0] || "-"}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditItem(m); setShowForm(true); }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Ganti Password" onClick={() => openChangePasswordDialog(m)}>
                            <KeyRound className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(m.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Broadcast Dialog */}
      <Dialog open={showBroadcast} onOpenChange={setShowBroadcast}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-primary" />Kirim Pesan Massal</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Channel Pengiriman</label>
              <div className="flex gap-2 mt-1">
                <button onClick={() => setBroadcastMsg(p => ({ ...p, channel: "email" }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-all ${broadcastMsg.channel === "email" ? "bg-primary text-white border-primary" : "bg-card"}`}>
                  <Mail className="h-4 w-4" /> Email
                </button>
                <button onClick={() => setBroadcastMsg(p => ({ ...p, channel: "whatsapp" }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-all ${broadcastMsg.channel === "whatsapp" ? "bg-green-500 text-white border-green-500" : "bg-card"}`}>
                  <MessageSquare className="h-4 w-4" /> WhatsApp
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Filter Penerima</label>
              <select value={broadcastMsg.filterCategory} onChange={e => setBroadcastMsg(p => ({ ...p, filterCategory: e.target.value }))}
                className="mt-1 w-full h-9 border rounded-md px-3 text-sm bg-transparent">
                <option value="all">Semua Jamaah ({members.length})</option>
                {[...new Set(members.flatMap(m => m.categories || []))].map(cat => (
                  <option key={cat} value={cat}>{cat} ({members.filter(m => (m.categories || []).includes(cat)).length})</option>
                ))}
              </select>
            </div>
            {broadcastMsg.channel === "email" && (
              <div><label className="text-sm font-medium">Subjek Email</label>
                <Input className="mt-1" value={broadcastMsg.subject} onChange={e => setBroadcastMsg(p => ({ ...p, subject: e.target.value }))} placeholder="Pengumuman dari Masjid..." />
              </div>
            )}
            <div><label className="text-sm font-medium">Isi Pesan</label>
              <Textarea className="mt-1" rows={5} value={broadcastMsg.body} onChange={e => setBroadcastMsg(p => ({ ...p, body: e.target.value }))} placeholder="Tulis pesan di sini..." />
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
              {broadcastMsg.channel === "whatsapp"
                ? "⚠️ Mode WhatsApp akan membuka tab baru untuk setiap penerima. Pastikan pop-up tidak diblokir browser."
                : "📧 Email akan dikirim langsung ke kotak masuk penerima."}
            </div>
            <Button className="w-full gap-2" onClick={handleBroadcast} disabled={broadcasting || !broadcastMsg.body}>
              <Send className="h-4 w-4" /> {broadcasting ? "Mengirim..." : `Kirim Pesan`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditItem(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? t("editMember") : t("addMember")}</DialogTitle>
          </DialogHeader>
          <JamaahForm item={editItem} onSave={handleSave} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Ganti Password Jamaah</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm">Mengubah password untuk <strong>{selectedUserForPassword?.user_name || selectedUserForPassword?.user_email}</strong></p>
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
