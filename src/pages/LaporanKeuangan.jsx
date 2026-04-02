import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import { useMosqueContext } from "@/lib/useMosqueContext";
import jsPDF from "jspdf";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, DollarSign, Download, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

function formatRp(n) { return "Rp " + (n || 0).toLocaleString("id-ID"); }

export default function LaporanKeuangan() {
  const { currentMosque: mosque } = useMosqueContext();
  const [transactions, setTransactions] = useState([]);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [period, setPeriod] = useState("monthly"); // daily|weekly|monthly|yearly
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));

  useEffect(() => {
    if (!mosque?.id) return;
    smartApi.entities.Transaction.filter({ mosque_id: mosque.id }, '-date', 500).then(setTransactions);
  }, [mosque?.id]);

  function getFilteredTxs() {
    const today = new Date();
    if (period === 'daily') {
      const d = today.toISOString().split('T')[0];
      return transactions.filter(t => t.date === d);
    }
    if (period === 'weekly') {
      const d = new Date(); d.setDate(d.getDate() - 7);
      return transactions.filter(t => t.date >= d.toISOString().split('T')[0]);
    }
    if (period === 'monthly') return transactions.filter(t => t.date?.startsWith(`${year}-${selectedMonth}`));
    return transactions.filter(t => t.date?.startsWith(year)); // yearly
  }

  const yearTxs = getFilteredTxs();
  const totalIncome = yearTxs.filter(t => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = yearTxs.filter(t => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  const chartData = MONTHS.map((m, i) => {
    const month = String(i + 1).padStart(2, "0");
    const prefix = `${year}-${month}`;
    const inc = yearTxs.filter(t => t.date?.startsWith(prefix) && t.type === "income").reduce((s, t) => s + (t.amount || 0), 0);
    const exp = yearTxs.filter(t => t.date?.startsWith(prefix) && t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0);
    return { name: m, Pemasukan: inc, Pengeluaran: exp };
  });

  function downloadCSV() {
    const rows = [["Tanggal","Jenis","Kategori","Jumlah","Keterangan"]];
    yearTxs.forEach(t => rows.push([t.date, t.type, t.category, t.amount, t.description || ""]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF"+csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `laporan-keuangan-${period}-${year}.csv`; a.click();
  }

  function downloadPDF() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Laporan Keuangan - ${mosque?.name || 'Masjid'}`, 14, 18);
    doc.setFontSize(10);
    doc.text(`Periode: ${period} | Tahun: ${year} | Total Pemasukan: ${formatRp(totalIncome)} | Total Pengeluaran: ${formatRp(totalExpense)}`, 14, 26);
    let y = 36;
    doc.setFontSize(9);
    doc.text('Tanggal', 14, y); doc.text('Jenis', 45, y); doc.text('Kategori', 75, y); doc.text('Keterangan', 110, y); doc.text('Jumlah', 165, y);
    y += 6;
    doc.line(14, y, 196, y); y += 4;
    yearTxs.slice().sort((a,b) => (b.date||'').localeCompare(a.date||'')).forEach(t => {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(t.date||'', 14, y);
      doc.text(t.type === 'income' ? 'Masuk' : 'Keluar', 45, y);
      doc.text((t.category||'').slice(0,18), 75, y);
      doc.text((t.description||'').slice(0,30), 110, y);
      doc.text(formatRp(t.amount), 165, y);
      y += 7;
    });
    doc.save(`laporan-keuangan-${period}-${year}.pdf`);
  }

  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i));

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Laporan Keuangan" description="Ringkasan pemasukan dan pengeluaran">
        <div className="flex gap-2 flex-wrap">
          {/* Period selector */}
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Harian</SelectItem>
              <SelectItem value="weekly">Mingguan</SelectItem>
              <SelectItem value="monthly">Bulanan</SelectItem>
              <SelectItem value="yearly">Tahunan</SelectItem>
            </SelectContent>
          </Select>
          {(period === 'monthly' || period === 'yearly') && (
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
            </Select>
          )}
          {period === 'monthly' && (
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i+1).padStart(2,'0')}>{m}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" onClick={downloadCSV}><Download className="h-4 w-4" /> Excel</Button>
          <Button variant="outline" size="sm" onClick={downloadPDF}><FileText className="h-4 w-4" /> PDF</Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Pemasukan" value={formatRp(totalIncome)} icon={TrendingUp} />
        <StatCard title="Total Pengeluaran" value={formatRp(totalExpense)} icon={TrendingDown} />
        <StatCard title="Saldo" value={formatRp(balance)} icon={DollarSign} />
      </div>

      <div className="bg-card rounded-xl border p-4">
        <h3 className="font-semibold mb-4">Grafik Bulanan {year}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={v => `${(v/1000000).toFixed(1)}jt`} />
            <Tooltip formatter={v => formatRp(v)} />
            <Bar dataKey="Pemasukan" fill="hsl(var(--chart-1))" radius={4} />
            <Bar dataKey="Pengeluaran" fill="hsl(var(--chart-2))" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50"><tr>
            <th className="text-left p-3">Tanggal</th>
            <th className="text-left p-3">Kategori</th>
            <th className="text-left p-3">Keterangan</th>
            <th className="text-right p-3">Jumlah</th>
          </tr></thead>
          <tbody>
            {yearTxs.slice().sort((a,b) => b.date?.localeCompare(a.date)).map(t => (
              <tr key={t.id} className="border-t">
                <td className="p-3">{t.date}</td>
                <td className="p-3 capitalize">{t.category}</td>
                <td className="p-3 text-muted-foreground">{t.description}</td>
                <td className={`p-3 text-right font-medium ${t.type === "income" ? "text-emerald-600" : "text-red-500"}`}>
                  {t.type === "income" ? "+" : "-"}{formatRp(t.amount)}
                </td>
              </tr>
            ))}
            {yearTxs.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Tidak ada transaksi di tahun {year}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}