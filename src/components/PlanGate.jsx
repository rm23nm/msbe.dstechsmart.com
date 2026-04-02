import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function isPaidPlan(mosque) {
  return mosque?.subscription_status === "active" &&
    (mosque?.subscription_plan === "monthly" || mosque?.subscription_plan === "yearly");
}

export default function PlanGate({ mosque, children, fallback }) {
  if (isPaidPlan(mosque)) return children;

  if (fallback) return fallback;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Lock className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Fitur Berbayar</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        Fitur ini tersedia untuk masjid dengan paket berbayar. Hubungi admin untuk upgrade langganan.
      </p>
      <Button variant="outline" onClick={() => window.location.href = "/pengaturan"}>
        Lihat Paket Langganan
      </Button>
    </div>
  );
}