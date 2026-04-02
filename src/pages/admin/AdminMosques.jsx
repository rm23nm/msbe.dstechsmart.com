import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import { formatDate } from "@/lib/formatCurrency";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import MosqueFormDialog from "../../components/admin/MosqueFormDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Building2, Search, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminMosques() {
  const [mosques, setMosques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const data = await smartApi.entities.Mosque.list('-created_date');
    setMosques(data);
    setLoading(false);
  }

  async function handleSave(data) {
    if (editItem) {
      await smartApi.entities.Mosque.update(editItem.id, data);
    } else {
      await smartApi.entities.Mosque.create(data);
    }
    setShowForm(false);
    setEditItem(null);
    loadData();
  }

  async function handleDelete(id) {
    await smartApi.entities.Mosque.delete(id);
    loadData();
  }

  const filtered = mosques.filter(m => !search || m.name?.toLowerCase().includes(search.toLowerCase()) || m.city?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader title="Kelola Masjid" description={`${mosques.length} masjid terdaftar`}>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Tambah Masjid
        </Button>
      </PageHeader>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cari masjid..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Building2} title="Belum Ada Masjid" description="Tambahkan masjid baru" />
      ) : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kota</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Berakhir</TableHead>
                  <TableHead className="w-20">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>{m.city || '-'}</TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{m.subscription_plan || 'trial'}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={m.subscription_status === 'active' ? 'default' : 'secondary'}>
                        {m.subscription_status || 'trial'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{m.subscription_end ? formatDate(m.subscription_end) : '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Link to={`/masjid/${m.id}`} target="_blank">
                          <Button size="icon" variant="ghost" className="h-7 w-7"><ExternalLink className="h-3 w-3" /></Button>
                        </Link>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditItem(m); setShowForm(true); }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(m.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        </div>
                        </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <MosqueFormDialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditItem(null); }} item={editItem} onSave={handleSave} />
    </div>
  );
}