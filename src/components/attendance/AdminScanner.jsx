import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function AdminScanner({ onScanSuccess, onScanError, onClose }) {
  const [lastResult, setLastResult] = useState(null);
  const [scanning, setScanning] = useState(true);
  const scannerRef = useRef(null);

  useEffect(() => {
    // Initialize the scanner
    const scanner = new Html5QrcodeScanner(
      "qr-reader", 
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.5,
        showTorchButtonIfSupported: true
      },
      /* verbose= */ false
    );

    const handleSuccess = (decodedText) => {
      if (decodedText === lastResult) return;
      setLastResult(decodedText);
      setScanning(false);
      onScanSuccess(decodedText);
      
      // Auto-resume after 2s
      setTimeout(() => {
        setScanning(true);
        setLastResult(null);
      }, 2000);
    };

    scanner.render(handleSuccess, onScanError || console.error);
    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear scanner", error);
        });
      }
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative w-full max-w-sm aspect-square overflow-hidden rounded-[2rem] border-4 border-slate-100 bg-black shadow-2xl">
        <div id="qr-reader" className="w-full h-full" />
        
        {/* Modern Overlay */}
        <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40">
           <div className="w-full h-full border-2 border-emerald-500/50 rounded-2xl relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl" />
              
              {/* Scanning Beam */}
              {scanning && (
                 <motion.div 
                    animate={{ top: ['0%', '100%', '0%'] }} 
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
                 />
              )}
           </div>
        </div>

        {/* Success Overlay */}
        <AnimatePresence>
          {!scanning && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-emerald-600/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white"
            >
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-emerald-600 mb-4 shadow-xl"
              >
                <ShieldCheck className="w-10 h-10" />
              </motion.div>
              <h3 className="text-xl font-black italic tracking-tighter mb-1">DATA DITERIMA!</h3>
              <p className="text-xs font-bold opacity-80 uppercase tracking-widest">{lastResult}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col items-center gap-3">
         <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 flex items-center gap-3">
            <Camera className="w-4 h-4 text-slate-400" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-none">Menunggu Kartu Jamaah...</p>
         </div>
         <Button variant="ghost" onClick={onClose} className="rounded-xl text-slate-400 hover:text-red-500 transition-colors">
            Batalkan & Tutup
         </Button>
      </div>
    </div>
  );
}
