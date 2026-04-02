import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarPlus, Download, ExternalLink, Calendar } from "lucide-react";

function toICSDate(dateStr, timeStr) {
  if (!dateStr) return "";
  const d = dateStr.replace(/-/g, "");
  if (!timeStr) return d;
  const t = timeStr.replace(":", "") + "00";
  return `${d}T${t}00`;
}

function generateICS(activities, mosqueName) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//MasjidKu//Kegiatan ${mosqueName}//ID`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:Kegiatan ${mosqueName}`,
    "X-WR-TIMEZONE:Asia/Jakarta",
  ];

  activities.forEach((a) => {
    const uid = `${a.id}@masjidku`;
    const dtstart = a.time_start ? `DTSTART:${toICSDate(a.date, a.time_start)}` : `DTSTART;VALUE=DATE:${toICSDate(a.date)}`;
    const dtend = a.time_end ? `DTEND:${toICSDate(a.date, a.time_end)}` : dtstart;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      dtstart,
      dtend,
      `SUMMARY:${a.title}`,
      `DESCRIPTION:${(a.description || "").replace(/\n/g, "\\n")}`,
      `LOCATION:${a.location || mosqueName}`,
      a.imam ? `ORGANIZER;CN=${a.imam}:MAILTO:noreply@masjidku.id` : "",
      "END:VEVENT"
    );
  });
  lines.push("END:VCALENDAR");
  return lines.filter(Boolean).join("\r\n");
}

export default function CalendarExport({ activities, mosqueName }) {
  const [open, setOpen] = useState(false);

  function downloadICS(list, filename) {
    const ics = generateICS(list, mosqueName);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  }

  function openGoogleCalendar(activity) {
    const base = "https://calendar.google.com/calendar/render?action=TEMPLATE";
    const title = encodeURIComponent(activity.title);
    const details = encodeURIComponent(activity.description || "");
    const location = encodeURIComponent(activity.location || mosqueName);
    const dateStr = activity.date?.replace(/-/g, "") || "";
    const start = activity.time_start ? `${dateStr}T${activity.time_start.replace(":", "")}00` : dateStr;
    const end = activity.time_end ? `${dateStr}T${activity.time_end.replace(":", "")}00` : start;
    const url = `${base}&text=${title}&details=${details}&location=${location}&dates=${start}/${end}`;
    window.open(url, "_blank");
  }

  function openOutlookCalendar(activity) {
    const base = "https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent";
    const title = encodeURIComponent(activity.title);
    const body = encodeURIComponent(activity.description || "");
    const location = encodeURIComponent(activity.location || mosqueName);
    const dateStr = activity.date || "";
    const start = activity.time_start ? `${dateStr}T${activity.time_start}:00` : `${dateStr}T00:00:00`;
    const end = activity.time_end ? `${dateStr}T${activity.time_end}:00` : `${dateStr}T01:00:00`;
    const url = `${base}&subject=${title}&body=${body}&location=${location}&startdt=${start}&enddt=${end}`;
    window.open(url, "_blank");
  }

  const upcoming = activities.filter(a => a.status === "upcoming");

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <CalendarPlus className="h-4 w-4" /> Export Kalender
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Export ke Kalender
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Bulk export */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium">Export Semua Kegiatan ({upcoming.length} mendatang)</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-2 flex-1" onClick={() => downloadICS(upcoming, `kegiatan-${mosqueName}.ics`)}>
                  <Download className="h-3.5 w-3.5" /> Download .ICS
                </Button>
                <Button size="sm" variant="outline" className="gap-2 flex-1 text-blue-600 border-blue-200" onClick={() => {
                  const ics = generateICS(upcoming, mosqueName);
                  const blob = new Blob([ics], { type: "text/calendar" });
                  const url = URL.createObjectURL(blob);
                  window.open(url);
                }}>
                  <ExternalLink className="h-3.5 w-3.5" /> Buka di App
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">File .ICS bisa diimpor ke Google Calendar, Outlook, Apple Calendar, dll.</p>
            </div>

            {/* Per-event export */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Tambahkan per Kegiatan</p>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {upcoming.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Tidak ada kegiatan mendatang</p>
                )}
                {upcoming.map(a => (
                  <div key={a.id} className="flex items-center justify-between gap-2 p-3 bg-card border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.date} {a.time_start ? `• ${a.time_start}` : ""}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-500" title="Google Calendar" onClick={() => openGoogleCalendar(a)}>
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.5 3h-2V1.5a.5.5 0 0 0-1 0V3h-9V1.5a.5.5 0 0 0-1 0V3H4.5A2.5 2.5 0 0 0 2 5.5v14A2.5 2.5 0 0 0 4.5 22h15a2.5 2.5 0 0 0 2.5-2.5v-14A2.5 2.5 0 0 0 19.5 3zM4.5 4h2V4.5a.5.5 0 0 0 1 0V4h9V4.5a.5.5 0 0 0 1 0V4h2A1.5 1.5 0 0 1 21 5.5V8H3V5.5A1.5 1.5 0 0 1 4.5 4zM19.5 21h-15A1.5 1.5 0 0 1 3 19.5V9h18v10.5A1.5 1.5 0 0 1 19.5 21z"/>
                        </svg>
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-indigo-500" title="Outlook" onClick={() => openOutlookCalendar(a)}>
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 12l-5.5-4v2H10V6h8.5V4L24 8V4.5A.5.5 0 0 0 23.5 4H9.5A.5.5 0 0 0 9 4.5v15a.5.5 0 0 0 .5.5h14a.5.5 0 0 0 .5-.5V16l-5.5-4H10v-2h8.5v2L24 12zM0 5.25l7 1.5v10.5l-7 1.5V5.25zM3.5 9A1.5 1.5 0 1 0 5 10.5 1.5 1.5 0 0 0 3.5 9z"/>
                        </svg>
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-500" title="Download ICS" onClick={() => downloadICS([a], `${a.title}.ics`)}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}