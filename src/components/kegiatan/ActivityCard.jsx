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
    <div className="bg-card rounded-xl border overflow-hidden hover:shadow-md transition-shadow group h-full flex flex-col">
      {a.image_url && (
        <div className="relative h-44 overflow-hidden bg-muted">
          <img 
            src={a.image_url} 
            alt={a.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
          />
          <div className="absolute top-2 left-2 flex gap-1.5">
             <Badge variant="secondary" className="text-[10px] bg-white/90 backdrop-blur-sm border-none shadow-sm">{typeLabels[a.type] || a.type}</Badge>
             <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold shadow-sm backdrop-blur-sm ${statusColors[a.status] || statusColors.upcoming} bg-opacity-90`}>
              {a.status === 'upcoming' ? 'MENDATANG' : a.status === 'completed' ? 'SELESAI' : a.status === 'cancelled' ? 'BATAL' : 'LIVE'}
            </span>
          </div>
        </div>
      )}
      <div className="p-5 flex-1 flex flex-col">
        {!a.image_url && (
          <div className="flex items-start justify-between mb-3">
            <Badge variant="secondary" className="text-xs">{typeLabels[a.type] || a.type}</Badge>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[a.status] || statusColors.upcoming}`}>
              {a.status === 'upcoming' ? 'Mendatang' : a.status === 'completed' ? 'Selesai' : a.status === 'cancelled' ? 'Dibatalkan' : 'Berlangsung'}
            </span>
          </div>
        )}

        <h3 className="font-semibold mb-2 line-clamp-1">{a.title}</h3>
        {a.description && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{a.description}</p>}

        <div className="space-y-1.5 text-sm text-muted-foreground mt-auto">
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
              <User className="h-3.5 w-3.5" /> {a.imam}
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
              <Button size="sm" variant="outline" className="h-8 gap-1 text-[10px] items-center flex-1" onClick={onEdit}>
                <Pencil className="h-3 w-3" /> EDIT
              </Button>
            )}
            {canDelete && (
              <Button size="sm" variant="outline" className="h-8 gap-1 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50 flex-1" onClick={onDelete}>
                <Trash2 className="h-3 w-3" /> HAPUS
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
