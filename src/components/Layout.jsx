import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useState } from "react";
import { Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "./NotificationBell";
import { useMosqueContext } from "@/lib/useMosqueContext";
import { useSmartTheme } from "@/lib/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import ThemeCustomizer from "./ThemeCustomizer";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentMosque } = useMosqueContext();
  const { theme } = useSmartTheme();

  return (
    <div className="flex h-screen overflow-hidden bg-[#fdfaf1] relative">
      
      {/* Smart BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Dynamic Gradients */}
        <div 
          className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-20 blur-[120px]"
          style={{ background: `radial-gradient(circle, ${theme.primaryColor} 0%, transparent 70%)` }}
        />
        <div 
          className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full opacity-10 blur-[100px]"
          style={{ background: `radial-gradient(circle, ${theme.accentColor} 0%, transparent 70%)` }}
        />
        
        {/* Premium Watermark */}
        {theme.showWatermark && (
          <div className="absolute bottom-10 right-10 w-[400px] h-[400px] opacity-[0.04] grayscale select-none pointer-events-none transition-all duration-1000">
             <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Landmark className="h-6 w-6 text-white" />
             </div>
          </div>
        )}
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-500 ease-in-out
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b bg-white/80 backdrop-blur-md">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <img src={currentMosque?.logo_url || "/favicon.png?v=2"} alt={currentMosque?.name || "MasjidKu"} className="h-8 w-8 rounded-lg object-contain" />
            <span className="font-bold text-emerald-900 truncate max-w-[120px] tracking-tight">{currentMosque?.name || "MasjidKu"}</span>
          </div>
          <NotificationBell />
        </div>
        
        {/* Desktop notification bar */}
        <div className="hidden lg:flex items-center justify-end px-8 py-3 bg-transparent border-b border-black/5">
           <div className="flex items-center gap-4 bg-white/40 backdrop-blur-md px-4 py-1.5 rounded-2xl border border-white/50 shadow-sm">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-800/60">
                 <Sparkles className="h-3 w-3" /> Premium Edition
              </div>
              <div className="h-4 w-px bg-emerald-800/10 mx-2" />
              <NotificationBell />
           </div>
        </div>

        <main className="flex-1 overflow-y-auto px-4 py-6 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.03)] min-h-full p-6 md:p-10 relative overflow-hidden transition-colors duration-500"
              style={{ 
                backdropFilter: `blur(${theme.glassIntensity * 24}px)`,
                color: 'var(--Smart-text)'
              }}
            >
              {/* Decorative inner glow */}
              <div className="absolute top-0 left-0 w-full h-1 smart-gold-gradient opacity-20" />
              
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>

      {/* Smart UI CUSTOMIZER */}
      <ThemeCustomizer />
    </div>
  );
}
