import { formatDate } from "@/lib/formatCurrency";
import { Calendar, Clock, MapPin, User, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const typeLabels = {
  shalat: "Shalat", kajian: "Kajian", pengajian: "Pengajian", ramadhan: "Ramadhan",
  idul_adha: "Idul Adha", idul_fitri: "Idul Fitri", sosial: "Sosial", rapat: "Rapat", lainnya: "Lainnya",
};

const statusColors = {
  upcoming: "bg-blue-100 text-blue-700",
  ongoing: "bg-emerald-100 text-emerald-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-600",
};

export default function ActivityCard({ activity, onEdit, onDelete, canEdit, canDelete }) {
  const a = activity;
  return (
    <div className="bg-card rounded-xl border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <Badge variant="secondary" className="text-xs">{typeLabels[a.type] || a.type}</Badge>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[a.status] || statusColors.upcoming}`}>
          {a.status === 'upcoming' ? 'Mendatang' : a.status === 'completed' ? 'Selesai' : a.status === 'cancelled' ? 'Dibatalkan' : 'Berlangsung'}
        </span>
      </div>

      <h3 className="font-semibold mb-2">{a.title}</h3>
      {a.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{a.description}</p>}

      <div className="space-y-1.5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" /> {formatDate(a.date)}
        </div>
        {a.time_start && (
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" /> {a.time_start} {a.time_end ? `- ${a.time_end}` : ''}
          </div>
        )}
        {a.imam && (
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5" /> Imam: {a.imam}
          </div>
        )}
        {a.location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" /> {a.location}
          </div>
        )}
      </div>

      {(canEdit || canDelete) && (
        <div className="flex gap-2 mt-4 pt-3 border-t">
          {canEdit && (
            <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={onEdit}>
              <Pencil className="h-3 w-3" /> Edit
            </Button>
          )}
          {canDelete && (
            <Button size="sm" variant="outline" className="gap-1 text-xs text-destructive" onClick={onDelete}>
              <Trash2 className="h-3 w-3" /> Hapus
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
