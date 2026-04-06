import React, { useState } from "react";
import { useSmartTheme } from "@/lib/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, X, Palette, Image as ImageIcon, Sparkles, Check, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const PRESET_COLORS = [
  { name: "Emerald Smart", value: "#065f46" },
  { name: "Royal Blue", value: "#1e3a8a" },
  { name: "Deep Ruby", value: "#7f1d1d" },
  { name: "Luxury Obsidian", value: "#09090b" },
  { name: "Midnight Teal", value: "#134e4a" },
];

const FONT_PRESETS = [
  { name: "Deep Slate", value: "#1e293b" },
  { name: "Emerald Ink", value: "#064e3b" },
  { name: "Royal Gold", value: "#86590d" },
  { name: "Midnight", value: "#000000" }
];

export default function ThemeCustomizer() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, updateTheme } = useSmartTheme();

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[60] w-14 h-14 bg-white shadow-2xl rounded-2xl flex items-center justify-center border-2 border-[#ecd08d] text-emerald-900 overflow-hidden group"
      >
        <div className="absolute inset-0 bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Settings className="h-6 w-6 relative z-10" />
      </motion.button>

      {/* Customizer Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.1)] z-[80] p-8 flex flex-col border-l"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-2">
                    <Palette className="h-6 w-6 text-emerald-600" /> UI Customizer
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Smart Premium Edition</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-10 custom-scrollbar pr-2">
                
                {/* 1. Color Presets */}
                <div className="space-y-4">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Droplets className="h-4 w-4" /> Warna Utama Smart
                  </Label>
                  <div className="grid grid-cols-5 gap-3">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color.value}
                        onClick={() => updateTheme({ primaryColor: color.value })}
                        className={`w-12 h-12 rounded-xl transition-all relative flex items-center justify-center ${
                          theme.primaryColor === color.value ? 'ring-4 ring-emerald-100 scale-110' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      >
                        {theme.primaryColor === color.value && <Check className="h-5 w-5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Glassmorphism Slider */}
                <div className="space-y-4">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> Intensitas Kaca (Blur)
                  </Label>
                  <div className="pt-2">
                    <Slider 
                      value={[theme.glassIntensity * 100]} 
                      onValueChange={(val) => updateTheme({ glassIntensity: val[0] / 100 })}
                      max={100}
                      step={1}
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase">
                      <span>Minimal</span>
                      <span>{Math.round(theme.glassIntensity * 100)}%</span>
                      <span>Maximum</span>
                    </div>
                  </div>
                </div>

                {/* 3. Watermark Toggle */}
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" /> Watermark Masjid
                    </Label>
                    <p className="text-[10px] text-slate-400 font-medium">Tampilkan ilustrasi di latar belakang</p>
                  </div>
                  <Switch 
                    checked={theme.showWatermark}
                    onCheckedChange={(val) => updateTheme({ showWatermark: val })}
                  />
                </div>

                {/* 4. Font Color (Ink) Selection */}
                <div className="space-y-4">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Palette className="h-4 w-4" /> Warna Tinta (Font)
                  </Label>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { name: "Deep Slate", value: "#1e293b" },
                      { name: "Emerald Ink", value: "#064e3b" },
                      { name: "Royal Gold", value: "#86590d" },
                      { name: "Midnight", value: "#000000" }
                    ].map(font => (
                      <button
                        key={font.value}
                        onClick={() => updateTheme({ fontColor: font.value })}
                        className={`w-full aspect-square rounded-xl transition-all relative border-2 flex items-center justify-center ${
                          theme.fontColor === font.value ? 'border-emerald-600 bg-emerald-50' : 'border-slate-100 hover:border-slate-300'
                        }`}
                        title={font.name}
                      >
                        <div className="w-6 h-6 rounded-md flex items-center justify-center font-black text-xs" style={{ color: font.value, backgroundColor: font.value === '#ffffff' ? '#000000' : 'transparent' }}>
                          Aa
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Sidebar Tone Toggle */}
                <div className="space-y-4">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Gaya Sidebar</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => updateTheme({ sidebarStyle: 'dark' })}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-2 items-center ${
                        theme.sidebarStyle === 'dark' ? 'border-emerald-600 bg-emerald-50/50' : 'border-slate-100'
                      }`}
                    >
                       <div className="w-full h-8 bg-emerald-900 rounded-md" />
                       <span className="text-[10px] font-bold uppercase tracking-tighter">Deep Forest</span>
                    </button>
                    <button 
                      onClick={() => updateTheme({ sidebarStyle: 'light' })}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-2 items-center ${
                        theme.sidebarStyle === 'light' ? 'border-emerald-600 bg-emerald-50/50' : 'border-slate-100'
                      }`}
                    >
                       <div className="w-full h-8 bg-emerald-100 rounded-md" />
                       <span className="text-[10px] font-bold uppercase tracking-tighter">Modern Light</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t">
                 <Button onClick={() => setIsOpen(false)} className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black italic tracking-tighter uppercase">
                    Terapkan Perubahan Smart
                 </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
