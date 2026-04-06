import { formatDate } from "@/lib/formatCurrency";
import { Calendar, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const typeLabels = {
  shalat: "Shalat",
  kajian: "Kajian",
  pengajian: "Pengajian",
  ramadhan: "Ramadhan",
  idul_adha: "Idul Adha",
  idul_fitri: "Idul Fitri",
  sosial: "Sosial",
  rapat: "Rapat",
  lainnya: "Lainnya",
};

export default function UpcomingActivities({ activities }) {
  return (
    <div className="bg-card rounded-xl border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Kegiatan Mendatang</h3>
        <Link to="/kegiatan" className="text-xs text-primary hover:underline">Lihat semua</Link>
      </div>
      
      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Belum ada kegiatan terjadwal</p>
      ) : (
        <div className="space-y-3">
          {activities.map((a) => (
            <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{a.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{formatDate(a.date)}</span>
                  {a.time_start && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {a.time_start}
                    </span>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {typeLabels[a.type] || a.type}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
