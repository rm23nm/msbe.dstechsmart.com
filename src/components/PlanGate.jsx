import React from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function isPaidPlan(mosque) {
  return mosque?.subscription_status === "active" &&
    (mosque?.subscription_plan === "monthly" || mosque?.subscription_plan === "yearly" || mosque?.subscription_plan === "enterprise");
}

export default function PlanGate({ mosque, feature, children, fallback }) {
  // If a specific feature is required, check the mosque's plan features
  const planFeatures = mosque?.plan_features || [];
  
  const hasAccess = feature 
    ? planFeatures.some(f => f.toLowerCase().includes(feature.toLowerCase()))
    : isPaidPlan(mosque);

  if (hasAccess) return children;

  if (fallback) return fallback;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 m-4 animate-in fade-in zoom-in duration-500">
      <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mb-4 text-amber-600 shadow-sm">
        <Lock className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-black text-slate-900 mb-2">Fitur Premium 🚀</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed font-semibold">
        Fitur <span className="text-emerald-600">"{feature || 'ini'}"</span> hanya tersedia bagi pengguna paket berbayar atau paket khusus. Upgrade paket masjid Bapak untuk menikmati fitur ini!
      </p>
      <div className="flex gap-3">
        <Button 
           className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl px-8 py-4 h-auto shadow-lg shadow-emerald-200" 
           onClick={() => window.location.href = "/paket"}
        >
          Lihat Paket Langganan
        </Button>
      </div>
    </div>
  );
}
