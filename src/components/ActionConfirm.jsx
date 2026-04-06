import React, { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { ShieldAlert, ShieldCheck, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

export default function ActionConfirm({
  open,
  onOpenChange,
  onConfirm,
  title = "Konfirmasi Tindakan Safeti",
  description = "Aksi ini tidak dapat dibatalkan. Apakah Bapak yakin?",
  confirmText = "Ya, Saya Yakin",
  variant = "destructive", // "default" | "destructive"
  requirePin = false,
  loading = false,
}) {
  const { user } = useAuth();
  const [pinInput, setPinInput] = useState("");

  const handleConfirm = (event) => {
    // Prevent closing unless PIN is valid
    if (requirePin) {
      if (!user?.pin) {
         toast.error("Bapak belum menyetel PIN Safeti di Pengaturan profil.");
         return;
      }
      if (pinInput !== user.pin) {
        toast.error("❗ KODE PIN SALAH. Akses Safeti Ditolak.");
        return;
      }
    }
    onConfirm();
    setPinInput("");
  };

  const handleCancel = () => {
    onOpenChange(false);
    setPinInput("");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px] rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-xl bg-background/95">
        <AlertDialogHeader className="space-y-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${variant === 'destructive' ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400' : 'bg-primary/10 text-primary'}`}>
            <ShieldAlert className="h-6 w-6" />
          </div>
          <AlertDialogTitle className="text-xl font-bold tracking-tight">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {requirePin && (
          <div className="py-4 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Lock className="h-4 w-4" />
              Verifikasi PIN Safeti
            </div>
            <div className="space-y-1.5">
              <Input
                type="password"
                placeholder="Masukkan 4-6 digit PIN..."
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="text-center text-2xl tracking-[0.5em] font-bold h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-primary shadow-inner"
                maxLength={6}
                autoFocus
              />
              <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest block font-medium">
                PIN akan dicocokkan dengan gembok pengurus
              </p>
            </div>
          </div>
        )}

        <AlertDialogFooter className="mt-2 flex-col sm:flex-row gap-2">
          <AlertDialogCancel 
            onClick={handleCancel}
            className="rounded-xl border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all font-medium py-2.5 h-auto m-0"
          >
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={loading || (requirePin && !pinInput)}
            className={`rounded-xl px-6 font-bold shadow-lg transition-all active:scale-95 py-2.5 h-auto m-0 flex-1 ${
              variant === "destructive" 
                ? "bg-red-600 hover:bg-red-700 text-white shadow-red-500/20" 
                : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20"
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Mohon Tunggu...
              </span>
            ) : (
               <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  {confirmText}
               </span>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
