import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import { useMosqueContext } from "@/lib/useMosqueContext";
import PageHeader from "../components/PageHeader";
import ActivityForm from "../components/kegiatan/ActivityForm";
import ActivityCard from "../components/kegiatan/ActivityCard";
import EmptyState from "../components/EmptyState";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar } from "lucide-react";
import CalendarExport from "../components/kegiatan/CalendarExport";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { usePermissions } from "@/lib/usePermissions";
import { toast } from "sonner";
import ActionConfirm from "../components/ActionConfirm";

export default function Kegiatan() {
  const { currentMosque, loading } = useMosqueContext();
  const perms = usePermissions("kegiatan");
  const [activities, setActivities] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [activeTab, setActiveTab] = useState("upcoming");

  const [saving, setSaving] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

  useEffect(() => {
    if (currentMosque && perms.view) loadData();
  }, [currentMosque, perms.view]);

  async function loadData() {
    setDataLoading(true);
    try {
      const acts = await smartApi.entities.Activity.filter({ mosque_id: currentMosque.id }, '-date', 100);
      setActivities(acts);
    } catch (e) {
      console.error("Gagal memuat kegiatan:", e);
    } finally {
      setDataLoading(false);
    }
  }

  async function executeSave(directData = null) {
    const dataToSave = directData || editItem; // If directData then New, else Edit
    if (!perms.edit) return;
    setSaving(true);
    try {
      if (editItem) {
        await smartApi.entities.Activity.update(editItem.id, pendingFormData);
        toast.success("✅ Kegiatan berhasil diperbarui");
      } else {
        await smartApi.entities.Activity.create({ ...dataToSave, mosque_id: currentMosque.id });
        toast.success("✅ Kegiatan baru berhasil ditambahkan");
      }
      setShowForm(false);
      setEditItem(null);
      setPendingFormData(null);
      setShowConfirmSave(false);
      loadData();
    } catch (e) {
      toast.error("Gagal menyimpan kegiatan");
    } finally {
      setSaving(false);
    }
  }

  async function executeDelete() {
    if (!perms.delete || !itemToDelete) return;
    setDeleting(true);
    try {
      await smartApi.entities.Activity.delete(itemToDelete.id);
      toast.success(`🗑️ Kegiatan "${itemToDelete.title}" telah dihapus`);
      setShowConfirmDelete(false);
      setItemToDelete(null);
      loadData();
    } catch (e) {
      toast.error("Gagal menghapus kegiatan");
    } finally {
      setDeleting(false);
    }
  }

  function handleSave(data) {
    if (!perms.edit) return;
    if (editItem) {
      setPendingFormData(data);
      setShowConfirmSave(true);
    } else {
      executeSave(data); // Simpan langsung jika baru
    }
  }

  function handleDelete(item) {
    if (!perms.delete) return;
    setItemToDelete(item);
    setShowConfirmDelete(true);
  }

  if (loading || !currentMosque) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  if (!perms.view) {
    return <div className="p-12 text-center text-muted-foreground"><p>Anda tidak memiliki izin (View) untuk melihat modul ini.</p></div>;
  }

  const filtered = activeTab === "all" ? activities : activities.filter(a => a.status === activeTab);

  return (
    <div className="space-y-6">
      <PageHeader title="Kegiatan" description="Kelola jadwal dan kegiatan masjid">
        <div className="flex gap-2">
          <CalendarExport activities={activities} mosqueName={currentMosque?.name || "Masjid"} />
          {perms.edit && (
            <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="gap-2">
              <Plus className="h-4 w-4" /> Tambah Kegiatan
            </Button>
          )}
        </div>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">Mendatang</TabsTrigger>
          <TabsTrigger value="completed">Selesai</TabsTrigger>
          <TabsTrigger value="all">Semua</TabsTrigger>
        </TabsList>
      </Tabs>

      {dataLoading ? (
        <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Calendar} title="Belum Ada Kegiatan" description="Tambahkan kegiatan baru untuk masjid" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(a => (
            <ActivityCard key={a.id} activity={a} onEdit={() => { setEditItem(a); setShowForm(true); }} onDelete={() => handleDelete(a)} canEdit={perms.edit} canDelete={perms.delete} />
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditItem(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Kegiatan' : 'Tambah Kegiatan'}</DialogTitle>
          </DialogHeader>
          <ActivityForm item={editItem} onSave={handleSave} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <ActionConfirm 
        open={showConfirmDelete}
        onOpenChange={setShowConfirmDelete}
        onConfirm={executeDelete}
        title="Hapus Kegiatan?"
        description={`Apakah Bapak yakin ingin menghapus kegiatan "${itemToDelete?.title}"?`}
        requirePin={true}
        loading={deleting}
      />

      <ActionConfirm 
        open={showConfirmSave}
        onOpenChange={setShowConfirmSave}
        onConfirm={executeSave}
        title="Konfirmasi Perubahan"
        description="Apakah Bapak yakin ingin menyimpan perubahan pada jadwal kegiatan ini?"
        confirmText="Simpan Perubahan"
        variant="default"
        requirePin={true}
        loading={saving}
      />
    </div>
  );
}
