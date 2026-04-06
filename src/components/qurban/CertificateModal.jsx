import React, { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share2, Award, Printer, CheckCircle2 } from "lucide-react";
import html2canvas from "html2canvas";

export default function CertificateModal({ open, onOpenChange, data, mosque }) {
  const certRef = useRef(null);

  const handleDownload = async () => {
    if (!certRef.current) return;
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#fdfaf1"
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.download = `Sertifikat_Qurban_${data.name}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Gagal mengunduh sertifikat", err);
    }
  };

  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none">
        <div className="flex flex-col items-center gap-6 p-4">
          
          {/* Certificate Area */}
          <div 
            ref={certRef}
            className="relative w-[842px] h-[595px] bg-[#fdfaf1] p-12 flex flex-col items-center justify-between overflow-hidden shadow-2xl border-[16px] border-double border-[#c5a059]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none smart-islamic-bg" />
            
            {/* Corner Ornaments */}
            <div className="absolute top-4 left-4 w-24 h-24 border-t-4 border-l-4 border-[#c5a059] rounded-tl-3xl" />
            <div className="absolute top-4 right-4 w-24 h-24 border-t-4 border-r-4 border-[#c5a059] rounded-tr-3xl" />
            <div className="absolute bottom-4 left-4 w-24 h-24 border-b-4 border-l-4 border-[#c5a059] rounded-bl-3xl" />
            <div className="absolute bottom-4 right-4 w-24 h-24 border-b-4 border-r-4 border-[#c5a059] rounded-br-3xl" />

            {/* Header */}
            <div className="text-center z-10">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="h-0.5 w-16 bg-[#c5a059]" />
                <Award className="h-10 w-10 text-[#c5a059]" />
                <div className="h-0.5 w-16 bg-[#c5a059]" />
              </div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#c5a059] mb-2">Piagam Penghargaan & Syukur</h2>
              <h1 className="text-4xl font-black italic tracking-tighter text-slate-800 uppercase mb-1">Shohibul Qurban</h1>
              <div className="text-[12px] font-medium text-slate-500 uppercase tracking-widest">{mosque?.name || "MasjidKu Smart"}</div>
            </div>

            {/* Body */}
            <div className="text-center z-10 flex-1 flex flex-col justify-center">
              <p className="text-slate-500 text-sm mb-6 uppercase tracking-widest font-medium italic">Diberikan Sebagai Tanda Terima Kasih Kepada:</p>
              <h3 className="text-5xl font-black italic tracking-tighter text-emerald-700 underline decoration-[#c5a059] decoration-4 underline-offset-8 mb-8">
                {data.name}
              </h3>
              <div className="max-w-xl mx-auto space-y-4">
                <p className="text-sm leading-relaxed text-slate-600 font-medium">
                  Atas ibadah kurban yang telah ditunaikan dengan tulus ikhlas berupa 
                  <span className="text-[#c5a059] font-black"> 1 Bagian {data.animalType} </span> 
                  pada Hari Raya Idul Adha {new Date().getFullYear()} H / {new Date().getFullYear()} M.
                </p>
                <div className="italic text-emerald-800 font-bold text-sm bg-emerald-50 py-3 px-6 rounded-2xl border border-emerald-100">
                  "Semoga Allah SWT menerima amal ibadah kurban Bapak/Ibu dan menjadikannya sebagai timbangan amal kebaikan di akhirat kelak. Aamiin."
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="w-full flex justify-between items-end z-10 mt-8">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                   <div className="w-16 h-16 bg-white border-2 border-[#c5a059]/30 rounded-2xl flex items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 text-[#c5a059]" />
                   </div>
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sertifikat Digital Resmi</p>
              </div>

              <div className="text-center">
                <div className="w-40 h-0.5 bg-slate-300 mb-2 mx-auto" />
                <p className="font-black italic tracking-tighter text-slate-800 uppercase text-sm">Panitia Qurban {mosque?.name || "DKM"}</p>
                <p className="text-[9px] text-slate-400 font-medium">{new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}</p>
              </div>

              <div className="text-right">
                 <div className="flex flex-col items-end">
                    <img src={mosque?.logo_url || "/favicon.png"} className="h-12 w-auto mb-2 grayscale opacity-50" />
                    <p className="text-[8px] font-black uppercase tracking-widest text-[#c5a059]">MasjidKu Smart Premium Edition</p>
                 </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 w-full justify-center">
            <Button onClick={handleDownload} className="h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black italic tracking-tighter text-xl shadow-xl shadow-emerald-100">
              <Download className="h-5 w-5 mr-3" /> UNDUH SERTIFIKAT
            </Button>
            <Button variant="outline" className="h-14 px-8 rounded-2xl bg-white border-2 border-[#c5a059] text-[#c5a059] font-black italic tracking-tighter text-xl">
              <Share2 className="h-5 w-5 mr-3" /> BAGIKAN
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
