import { formatCurrency, formatDate } from "@/lib/formatCurrency";
import { ArrowUpRight, ArrowDownRight, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TransactionTable({ transactions, loading, onEdit, onDelete, canEdit }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border">
        Belum ada transaksi
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Keterangan</TableHead>
              <TableHead className="text-right">Jumlah</TableHead>
              {canEdit && <TableHead className="w-20">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="text-sm">{formatDate(t.date)}</TableCell>
                <TableCell>
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    t.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                  }`}>
                    {t.type === 'income' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {t.type === 'income' ? 'Masuk' : 'Keluar'}
                  </div>
                </TableCell>
                <TableCell className="text-sm font-medium">{t.category}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{t.description || '-'}</TableCell>
                <TableCell className={`text-right text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </TableCell>
                {canEdit && (
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(t)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDelete(t.id)}>
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
  );
}
