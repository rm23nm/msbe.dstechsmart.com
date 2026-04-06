import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useSmartTheme } from "@/lib/ThemeContext";

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, className }) {
  const { theme } = useSmartTheme();
  
  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className={cn(
        "bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/60 p-6 flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition-all duration-500 overflow-hidden relative group smart-card-crown",
        className
      )}
    >
      {/* Dynamic Glow Background */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-0 group-hover:opacity-10 transition-opacity blur-2xl" 
           style={{ backgroundColor: theme.primaryColor }} />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="p-3 rounded-2xl bg-white/50 border border-white shadow-sm">
           {Icon && <Icon className="h-5 w-5" style={{ color: theme.primaryColor }} />}
        </div>
        {trend && (
          <div className={cn(
            "px-2 py-1 rounded-full text-[10px] font-black tracking-tighter flex items-center gap-1",
            trendUp ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
          )}>
            {trendUp ? "↑" : "↓"} {trend}
          </div>
        )}
      </div>

      <div className="space-y-1 relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</p>
        <h3 className="text-3xl font-black italic tracking-tighter text-slate-800 font-heading leading-tight">{value}</h3>
        {subtitle && (
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}
