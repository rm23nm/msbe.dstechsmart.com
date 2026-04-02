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

export default function Kegiatan() {
  const { currentMosque, loading, isPengurus } = useMosqueContext();
  const [activities, setActivities] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [activeTab, setActiveTab] = useState("upcoming");

  useEffect(() => {
    if (currentMosque) loadData();
  }, [currentMosque]);

  async function loadData() {
    setDataLoading(true);
    const acts = await smartApi.entities.Activity.filter({ mosque_id: currentMosque.id }, '-date', 100);
    setActivities(acts);
    setDataLoading(false);
  }

  async function handleSave(data) {
    if (editItem) {
      await smartApi.entities.Activity.update(editItem.id, data);
    } else {
      await smartApi.entities.Activity.create({ ...data, mosque_id: currentMosque.id });
    }
    setShowForm(false);
    setEditItem(null);
    loadData();
  }

  async function handleDelete(id) {
    await smartApi.entities.Activity.delete(id);
    loadData();
  }

  if (loading || !currentMosque) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const filtered = activeTab === "all" ? activities : activities.filter(a => a.status === activeTab);

  return (
    <div className="space-y-6">
      <PageHeader title="Kegiatan" description="Kelola jadwal dan kegiatan masjid">
        <div className="flex gap-2">
          <CalendarExport activities={activities} mosqueName={currentMosque?.name || "Masjid"} />
          {isPengurus && (
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
            <ActivityCard key={a.id} activity={a} onEdit={() => { setEditItem(a); setShowForm(true); }} onDelete={() => handleDelete(a.id)} canEdit={isPengurus} />
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
    </div>
  );
}