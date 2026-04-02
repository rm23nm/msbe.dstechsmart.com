import { formatDate } from "@/lib/formatCurrency";
import { Megaphone } from "lucide-react";

const priorityColors = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-blue-100 text-blue-700",
};

export default function AnnouncementsList({ announcements }) {
  return (
    <div className="bg-card rounded-xl border p-5 h-full">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Megaphone className="h-4 w-4 text-primary" />
        Pengumuman
      </h3>
      
      {announcements.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Belum ada pengumuman</p>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">{a.title}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityColors[a.priority] || priorityColors.low}`}>
                  {a.priority === 'high' ? 'Penting' : a.priority === 'medium' ? 'Sedang' : 'Biasa'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{a.content}</p>
              <p className="text-[10px] text-muted-foreground">{formatDate(a.created_date)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}