import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
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

export default function Keuangan() {
  const { currentMosque, loading, isPengurus, isBendahara } = useMosqueContext();
  const [transactions, setTransactions] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (currentMosque) loadData();
  }, [currentMosque]);

  async function loadData() {
    setDataLoading(true);
    const txns = await smartApi.entities.Transaction.filter({ mosque_id: currentMosque.id }, '-date', 200);
    setTransactions(txns);
    setDataLoading(false);
  }

  async function handleSave(data) {
    if (editItem) {
      await smartApi.entities.Transaction.update(editItem.id, data);
    } else {
      await smartApi.entities.Transaction.create({ ...data, mosque_id: currentMosque.id });
    }
    setShowForm(false);
    setEditItem(null);
    loadData();
  }

  async function handleDelete(id) {
    await smartApi.entities.Transaction.delete(id);
    loadData();
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
    </div>
  );
}