import { useState, useEffect } from "react";
import { smartApi, apiClient } from "@/api/apiClient";
import { useMosqueContext } from "@/lib/useMosqueContext";
import PageHeader from "../components/PageHeader";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, TrendingDown, RefreshCw, BarChart3, Calendar, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

function formatRp(n) { return "Rp " + (n || 0).toLocaleString("id-ID"); }

export default function AIAnalitik() {
  const { currentMosque, loading } = useMosqueContext();
  const [transactions, setTransactions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [donations, setDonations] = useState([]);
  const [report, setReport] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!currentMosque?.id) return;
    Promise.all([
      smartApi.entities.Transaction.filter({ mosque_id: currentMosque.id }, "-date", 200),
      smartApi.entities.Activity.filter({ mosque_id: currentMosque.id }, "-date", 50),
      smartApi.entities.Donation.filter({ mosque_id: currentMosque.id }, "-created_date", 100),
    ]).then(([txs, acts, dons]) => {
      setTransactions(txs);
      setActivities(acts);
      setDonations(dons);
      setDataLoaded(true);
    });
  }, [currentMosque?.id]);

  async function generate() {
    setGenerating(true);
    setReport(null);

    const now = new Date();
    const thisMonth = now.toISOString().slice(0, 7);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);

    const thisTxs = transactions.filter(t => t.date?.startsWith(thisMonth));
    const lastTxs = transactions.filter(t => t.date?.startsWith(lastMonth));

    const sum = (arr, type) => arr.filter(t => t.type === type).reduce((s, t) => s + (t.amount || 0), 0);

    const thisIncome = sum(thisTxs, "income");
    const thisExpense = sum(thisTxs, "expense");
    const lastIncome = sum(lastTxs, "income");
    const lastExpense = sum(lastTxs, "expense");

    const categoryBreakdown = {};
    transactions.forEach(t => {
      if (!categoryBreakdown[t.category]) categoryBreakdown[t.category] = { income: 0, expense: 0 };
      categoryBreakdown[t.category][t.type] += t.amount || 0;
    });

    const upcomingActs = activities.filter(a => a.status === "upcoming" && a.date >= now.toISOString().split("T")[0]);
    const completedActs = activities.filter(a => a.status === "completed");

    const pendingDonations = donations.filter(d => d.status === "pending");
    const confirmedDonations = donations.filter(d => d.status === "confirmed");

    const prompt = `Kamu adalah analis keuangan dan manajemen masjid profesional. Analisis data berikut dan buat laporan komprehensif dalam Bahasa Indonesia dengan format Markdown.

**NAMA MASJID:** ${currentMosque?.name}
**TANGGAL ANALISIS:** ${now.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

## DATA KEUANGAN

### Bulan Ini (${thisMonth}):
- Pemasukan: ${formatRp(thisIncome)} (${thisTxs.filter(t=>t.type==="income").length} transaksi)
- Pengeluaran: ${formatRp(thisExpense)} (${thisTxs.filter(t=>t.type==="expense").length} transaksi)
- Saldo Bulan Ini: ${formatRp(thisIncome - thisExpense)}

### Bulan Lalu (${lastMonth}):
- Pemasukan: ${formatRp(lastIncome)}
- Pengeluaran: ${formatRp(lastExpense)}

### Total Historis (${transactions.length} transaksi):
- Total Pemasukan: ${formatRp(sum(transactions, "income"))}
- Total Pengeluaran: ${formatRp(sum(transactions, "expense"))}
- Saldo Keseluruhan: ${formatRp(sum(transactions, "income") - sum(transactions, "expense"))}

### Breakdown Kategori:
${Object.entries(categoryBreakdown).map(([cat, val]) => `- ${cat}: Masuk ${formatRp(val.income)}, Keluar ${formatRp(val.expense)}`).join("\n")}

## DATA DONASI
- Total donasi diterima: ${donations.length} donasi
- Dikonfirmasi: ${confirmedDonations.length} (Total: ${formatRp(confirmedDonations.reduce((s,d) => s+(d.amount||0), 0))})
- Menunggu konfirmasi: ${pendingDonations.length} donasi

## DATA KEGIATAN
- Total kegiatan: ${activities.length}
- Mendatang: ${upcomingActs.length} kegiatan
- Selesai: ${completedActs.length} kegiatan
- Kegiatan mendatang: ${upcomingActs.slice(0,5).map(a => `${a.title} (${a.date})`).join(", ") || "Tidak ada"}

---

Buat laporan dengan struktur berikut (gunakan emoji yang relevan):

## 📊 Ringkasan Eksekutif
(Ringkasan 2-3 paragraf kondisi keuangan & kegiatan masjid saat ini)

## 📈 Analisis Tren
(Bandingkan bulan ini vs bulan lalu, identifikasi pola pemasukan/pengeluaran)

## ⚠️ Perhatian & Risiko
(Identifikasi potensi masalah: penurunan donasi, pengeluaran tinggi, dll)

## 💡 Rekomendasi Actionable
(Minimal 5 rekomendasi spesifik dan terukur untuk bendahara dan pengurus)

## 🗓️ Agenda Prioritas
(Saran kegiatan/tindakan untuk bulan depan berdasarkan data)`;

    try {
      const { data } = await apiClient.post("/ai/analyze", { mosque_id: currentMosque.id });
      setReport(data.report);
    } catch (err) {
      console.error("AI analyze error:", err);
      setReport("Terjadi kesalahan saat menganalisis data. Pastikan backend berjalan.");
    }
    setGenerating(false);
  }

  if (loading || !currentMosque) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="AI Analitik" description="Analisis cerdas data keuangan & kegiatan masjid">
        <Button onClick={generate} disabled={generating || !dataLoaded} className="gap-2">
          {generating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generating ? "Menganalisis..." : "Generate Analisis AI"}
        </Button>
      </PageHeader>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Total Pemasukan</span>
          </div>
          <p className="text-lg font-bold text-emerald-600">{formatRp(totalIncome)}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <span className="text-xs text-muted-foreground">Total Pengeluaran</span>
          </div>
          <p className="text-lg font-bold text-red-500">{formatRp(totalExpense)}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Total Transaksi</span>
          </div>
          <p className="text-lg font-bold">{transactions.length}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-purple-500" />
            <span className="text-xs text-muted-foreground">Total Kegiatan</span>
          </div>
          <p className="text-lg font-bold">{activities.length}</p>
        </div>
      </div>

      {/* AI Result */}
      {!report && !generating && (
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-8 text-center">
          <Sparkles className="h-12 w-12 text-primary/60 mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-2">Analisis AI Siap Dijalankan</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
            AI akan menganalisis {transactions.length} transaksi, {activities.length} kegiatan, dan {donations.length} donasi untuk memberikan wawasan dan rekomendasi.
          </p>
          <p className="text-xs text-amber-600 flex items-center justify-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" /> Menggunakan kredit AI lebih banyak (model Claude Sonnet)
          </p>
        </div>
      )}

      {generating && (
        <div className="bg-card border rounded-xl p-8 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground">AI sedang menganalisis data masjid Anda...</p>
          </div>
        </div>
      )}

      {report && (
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Laporan Analisis AI — {currentMosque.name}</h3>
            <span className="ml-auto text-xs text-muted-foreground">{new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}</span>
          </div>
          <div className="prose prose-sm prose-slate max-w-none">
            <ReactMarkdown
              components={{
                h2: ({ children }) => <h2 className="text-base font-bold mt-6 mb-2 first:mt-0">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mt-4 mb-1">{children}</h3>,
                p: ({ children }) => <p className="text-sm leading-relaxed mb-3">{children}</p>,
                ul: ({ children }) => <ul className="list-disc ml-5 space-y-1 mb-3 text-sm">{children}</ul>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
              }}
            >
              {report}
            </ReactMarkdown>
          </div>
          <div className="mt-4 pt-4 border-t flex justify-end">
            <Button variant="outline" size="sm" onClick={generate} className="gap-2">
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}