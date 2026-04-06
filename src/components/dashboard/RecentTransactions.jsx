import { formatCurrency, formatDate } from "@/lib/formatCurrency";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function RecentTransactions({ transactions }) {
  return (
    <div className="bg-card rounded-xl border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Transaksi Terakhir</h3>
        <Link to="/keuangan" className="text-xs text-primary hover:underline">Lihat semua</Link>
      </div>
      
      {transactions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Belum ada transaksi</p>
      ) : (
        <div className="space-y-3">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                {t.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{t.category}</p>
                <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
              </div>
              <p className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
