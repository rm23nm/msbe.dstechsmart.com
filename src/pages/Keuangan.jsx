import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import { toast } from "sonner";
import { useMosqueContext } from "@/lib/useMosqueContext";
import { formatCurrency } from "@/lib/formatCurrency";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import TransactionForm from "../components/keuangan/TransactionForm";
import TransactionTable from "../components/keuangan/TransactionTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import ActionConfirm from "../components/ActionConfirm";

export default function Keuangan() {
  const { currentMosque, loading, isPengurus, isBendahara } = useMosqueContext();
  const [transactions, setTransactions] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  const [saving, setSaving] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

  useEffect(() => {
    if (currentMosque) loadData();
  }, [currentMosque]);

  async function loadData() {
    setDataLoading(true);
    const txns = await smartApi.entities.Transaction.filter({ mosque_id: currentMosque.id }, '-date', 200);
    setTransactions(txns);
    setDataLoading(false);
  }

  async function executeSave(directData = null) {
    const dataToSave = directData || pendingFormData;
    if (!dataToSave) return;

    setSaving(true);
    try {
      if (editItem) {
        await smartApi.entities.Transaction.update(editItem.id, dataToSave);
        toast.success("✅ Transaksi berhasil diperbarui");
      } else {
        await smartApi.entities.Transaction.create({ ...dataToSave, mosque_id: currentMosque.id });
        toast.success("✅ Transaksi baru berhasil dicatat");
      }
      setShowForm(false);
      setEditItem(null);
      setPendingFormData(null);
      setShowConfirmSave(false);
      loadData();
    } catch (e) {
      toast.error("Gagal menyimpan transaksi: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function executeDelete() {
    if (!itemToDelete) return;
    try {
      await smartApi.entities.Transaction.delete(itemToDelete);
      toast.success("🗑️ Transaksi telah dihapus");
      setShowConfirmDelete(false);
      setItemToDelete(null);
      loadData();
    } catch (e) {
      toast.error("Gagal menghapus transaksi");
    }
  }

  function handleSave(data) {
    if (editItem) {
      setPendingFormData(data);
      setShowConfirmSave(true);
    } else {
      executeSave(data); // Simpan langsung jika baru
    }
  }

  function handleDelete(id) {
    setItemToDelete(id);
    setShowConfirmDelete(true);
  }

  function handleEdit(item) {
    setEditItem(item);
    setShowForm(true);
  }

  if (loading || !currentMosque) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  const filtered = activeTab === 'all' ? transactions : transactions.filter(t => t.type === activeTab);

  return (
    <div className="space-y-6">
      <PageHeader title="Keuangan" description="Kelola pemasukan dan pengeluaran masjid">
        {isPengurus && (
          <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Tambah Transaksi
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Saldo Kas" value={formatCurrency(balance)} icon={PiggyBank} />
        <StatCard title="Total Pemasukan" value={formatCurrency(totalIncome)} icon={TrendingUp} trend={`${transactions.filter(t => t.type === 'income').length} transaksi`} trendUp />
        <StatCard title="Total Pengeluaran" value={formatCurrency(totalExpense)} icon={TrendingDown} trend={`${transactions.filter(t => t.type === 'expense').length} transaksi`} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="income">Pemasukan</TabsTrigger>
          <TabsTrigger value="expense">Pengeluaran</TabsTrigger>
        </TabsList>
      </Tabs>

      <TransactionTable 
        transactions={filtered} 
        loading={dataLoading} 
        onEdit={handleEdit} 
        onDelete={handleDelete}
        canEdit={isPengurus}
      />

      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditItem(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Transaksi' : 'Tambah Transaksi'}</DialogTitle>
          </DialogHeader>
          <TransactionForm item={editItem} onSave={handleSave} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      <ActionConfirm 
        open={showConfirmDelete}
        onOpenChange={setShowConfirmDelete}
        onConfirm={executeDelete}
        title="Hapus Transaksi?"
        description="Data keuangan ini akan dihapus permanen dari buku kas masjid."
        requirePin={true}
      />

      <ActionConfirm 
        open={showConfirmSave}
        onOpenChange={setShowConfirmSave}
        onConfirm={executeSave}
        title="Konfirmasi Simpan"
        description={editItem ? "Apakah Bapak yakin ingin memperbarui data transaksi ini?" : "Apakah Bapak yakin ingin mencatat transaksi baru ini?"}
        confirmText="Simpan Data"
        variant="default"
        requirePin={true}
        loading={saving}
      />
    </div>
  );
}
