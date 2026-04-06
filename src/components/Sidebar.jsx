import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, Wallet, Calendar, Users, Megaphone, Settings, Monitor,
  Building2, CreditCard, BarChart3, LogOut, ChevronDown, Landmark,
  Package, FileBarChart, Heart, HandHeart, Sparkles, ClipboardCheck, Send, ShieldAlert, BookOpen, Key, Coins, HandHelping, Beef, History
} from "lucide-react";
import { smartApi } from "@/api/apiClient";
import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/useLanguage";
import LanguageSwitcher from "./LanguageSwitcher";
import { useAuth } from "@/lib/AuthContext";
import { useMosqueContext } from "@/lib/useMosqueContext";
import { useSmartTheme } from "@/lib/ThemeContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

function getAdminMenuItems(t) {
  return [
    { label: t("adminDashboard"), path: "/admin", icon: LayoutDashboard },
    { label: t("manageMosques"), path: "/admin/mosques", icon: Building2 },
    { label: t("users"), path: "/admin/users", icon: Users },
    { label: t("billing"), path: "/admin/billing", icon: CreditCard },
    { label: "Paket & Fitur", path: "/admin/packages", icon: Package },
    { label: t("reports"), path: "/admin/reports", icon: BarChart3 },
    { label: t("appSettings"), path: "/admin/settings", icon: Settings },
    { label: "Pengaturan Roles", path: "/admin/roles", icon: ShieldAlert },
    { label: "Broadcast Promo", path: "/admin/broadcast", icon: Megaphone },
    { label: "Lisensi & Sub-Produk", path: "/admin/licenses", icon: Key },
  ];
}

function getMosqueMenuItems(t) {
  return [
    { label: t("dashboard"), path: "/dashboard", icon: LayoutDashboard },
    { label: t("finance"), path: "/keuangan", icon: Wallet },
    { label: t("financialReport"), path: "/laporan-keuangan", icon: FileBarChart },
    { label: "Zakat Center", path: "/zakat", icon: Coins },
    { label: "Data Mustahik", path: "/mustahik", icon: HandHelping },
    { label: "Manajemen Qurban", path: "/qurban", icon: Beef },
    { label: t("activities"), path: "/kegiatan", icon: Calendar },
    { label: t("assets"), path: "/aset", icon: Package },
    { label: t("members"), path: "/jamaah", icon: Users },
    { label: t("memberPortal"), path: "/jamaah-dashboard", icon: Heart },
    { label: t("analytics"), path: "/analitik", icon: BarChart3 },
    { label: "AI Analitik", path: "/ai-analitik", icon: Sparkles },
    { label: t("donations"), path: "/donasi-masjid", icon: HandHeart },
    { label: "Absensi", path: "/absensi", icon: ClipboardCheck },
    { label: t("announcements"), path: "/pengumuman", icon: Megaphone },
    { label: t("publicInfo"), path: "/info-publik", icon: Monitor },
    { label: "Integrasi Telegram", path: "/telegram", icon: Send },
    { label: "Al-Quran & Tafsir", path: "/quran", icon: BookOpen },
    { label: "Riwayat Aktivitas", path: "/audit-logs", icon: History },
    { label: "Kelola Paket", path: "/paket", icon: Sparkles },
    { label: "Hak Akses", path: "/hak-akses", icon: ShieldAlert },
    { label: t("settings"), path: "/pengaturan", icon: Settings },
  ];
}

export default function Sidebar({ onClose }) {
  const location = useLocation();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { currentMosque, loading: mosqueLoading, hasPermission } = useMosqueContext();
  const { theme } = useSmartTheme();
  const [adminOpen, setAdminOpen] = useState(true);
  const [mosqueOpen, setMosqueOpen] = useState(true);

  const adminMenuItems = getAdminMenuItems(t);
  const mosqueMenuItems = getMosqueMenuItems(t);
  const isAdmin = user?.role === "superadmin" || user?.role === "admin";
  const isMosqueAdmin = isAdmin || user?.role === "mosque_admin" || user?.role === "pengurus" || user?.role === "admin_masjid";
  
  const isExpired = currentMosque?.subscription_end && new Date(currentMosque.subscription_end) < new Date();
  const isStandalone = import.meta.env.VITE_SINGLE_MOSQUE_MODE === 'true';
  const roleLabel = user?.role === "superadmin" ? "Super Admin" : user?.role === "mosque_admin" ? "Pengurus" : user?.role === "user" ? "Jamaah" : (user?.role || "...");

  const planFeatures = currentMosque?.plan_features || [];

  const filteredMosqueMenu = (mosqueMenuItems || []).filter(item => {
    if (!item?.path) return false;

    // 0. Superadmin always sees everything
    if (user?.role === "superadmin") return true;

    // 1. Dynamic Role Permission Check (The standard template + override)
    // Extract menu ID from path (e.g. /keuangan -> keuangan)
    const menuId = (item.path.replace(/^\//, '') || "dashboard").split('/')[0];
    
    // IF loading or no currentMosque, show only core items to prevent blank screen
    if (mosqueLoading || !currentMosque) {
        return ["dashboard", "pengaturan", "paket", "info-publik", "audit-logs"].includes(menuId);
    }

    if (["dashboard", "pengaturan", "paket", "hak-akses", "audit-logs"].includes(menuId)) return true;
    
    if (!hasPermission || !hasPermission(menuId)) return false;

    // 2. Cek paket kadaluarsa
    if (isExpired && !isAdmin) {
       return ["Al-Quran & Tafsir", "dashboard", "pengaturan", "paket", "info-publik"].includes(menuId);
    }
    
    // 3. Cek fitur per-paket (Hardware/Package Enforcement)
    if (!isAdmin) {
        if (["dashboard", "pengaturan", "paket", "hak-akses"].includes(menuId)) return true;
        
        const featureMap = {
            "keuangan": "Keuangan & Transaksi",
            "laporan-keuangan": "Laporan Keuangan",
            "zakat": "Manajemen Zakat",
            "mustahik": "Manajemen Zakat",
            "qurban": "Manajemen Qurban",
            "kegiatan": "Jadwal Kegiatan",
            "aset": "Aset Masjid",
            "jamaah": "Manajemen 1 Masjid", // Entry feature
            "jamaah-dashboard": "Manajemen 1 Masjid",
            "analitik": "Analitik Lanjutan",
            "ai-analitik": "AI OCR Struk",
            "donasi-masjid": "Donasi Online",
            "absensi": "Absensi QR",
            "pengumuman": "Pengumuman",
            "info-publik": ["Portofolio Digital", "Tampilan TV Masjid"],
            "telegram": "Telegram Bot",
            "quran": "Al-Quran & Tafsir Digital"
        };
        
        const reqFeature = featureMap[menuId];
        if (reqFeature) {
            if (Array.isArray(reqFeature)) {
                if (!planFeatures || !reqFeature.some(f => planFeatures.includes(f))) return false;
            } else {
                if (planFeatures && planFeatures.length > 0 && !planFeatures.includes(reqFeature)) return false;
            }
        }
    }

    // 4. Sembunyikan menu paket jika standalone
    if (isStandalone && menuId === "paket") return false;
    
    return true;
  });

  // Branding Logic - Prio for Superadmin: Global Branding
  const { isWhiteLabel } = useMosqueContext();
  const isSuperAdmin = user?.role === "superadmin";
  
  // White Label Check: If Elite, strictly use Mosque branding, no fallback to platform strings
  const appNameRaw = isSuperAdmin ? "MasjidKu Smart" : (currentMosque?.name || "MasjidKu");
  const appName = (isWhiteLabel && !isSuperAdmin) ? (currentMosque?.name || "MasjidKu") : appNameRaw;
  
  const appLogoRaw = isSuperAdmin ? "/favicon.png?v=2" : (currentMosque?.logo_url || "/favicon.png?v=2");
  const appLogo = (isWhiteLabel && !isSuperAdmin) ? (currentMosque?.logo_url || "/favicon.png?v=2") : appLogoRaw;
  
  const subLabel = isSuperAdmin ? "SISTEM MANAJEMEN PUSAT" : (isStandalone ? "Sistem Digital" : (isWhiteLabel ? "Portal Manajemen" : "Pengelolaan Masjid"));

  return (
    <div 
      className={`h-full border-r border-white/10 flex flex-col shadow-2xl relative z-50 overflow-hidden transition-all duration-700 smart-islamic-pattern ${
        theme.sidebarStyle === 'light' ? 'bg-white text-emerald-950 border-emerald-100' : 'text-white border-white/5'
      }`}
      style={{ backgroundColor: theme.sidebarStyle === 'dark' ? theme.primaryColor : undefined }}
    >
      {/* Subtle Sidebar Texture */}
      <div className={`absolute inset-0 opacity-20 pointer-events-none smart-islamic-pattern ${
        theme.sidebarStyle === 'dark' ? 'invert' : ''
      }`} />

      {/* Logo Section */}
      <div className="p-8 border-b border-white/5 relative z-10">
        <Link to="/" onClick={onClose} className="flex flex-col items-center text-center gap-3 group">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-16 h-16 rounded-[1.5rem] bg-white shadow-2xl flex items-center justify-center p-2 border-2 border-white/20 group-hover:border-white transition-all duration-500"
          >
            <img src={appLogo} alt={appName} className="w-full h-full object-contain" />
          </motion.div>
          <div className="space-y-0.5">
            <h1 className="text-lg font-black tracking-tighter uppercase italic">{appName}</h1>
            <div className="flex items-center justify-center gap-2">
               <div className="h-px w-4 bg-white/20" />
               <p className="text-[8px] text-emerald-300 uppercase tracking-[0.3em] font-black">{subLabel}</p>
               <div className="h-px w-4 bg-white/20" />
            </div>
          </div>
        </Link>
      </div>
 
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {isSuperAdmin && (
          <Collapsible open={adminOpen} onOpenChange={setAdminOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors mt-4">
              {t("superAdmin")}
              <ChevronDown className={`h-3 w-3 transition-transform ${adminOpen ? '' : '-rotate-90'}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-0.5 mt-1">
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] transition-all relative group overflow-hidden ${
                    isActive
                      ? 'font-black italic tracking-tight Smart-gold-glow'
                      : 'text-white/50 hover:text-white hover:bg-emerald-900/40'
                  }`}
                  style={{ color: isActive ? '#062019' : undefined }}
                >
                  {isActive && (
                    <>
                      <motion.div 
                        layoutId="activeTabAdmin"
                        className="absolute inset-0 smart-gold-gradient rounded-xl -z-10"
                      />
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#86590d]" />
                    </>
                  )}
                  <Icon className="h-4 w-4" style={{ color: isActive ? '#062019' : undefined }} />
                  {item.label}
                </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        )}
 
        <Collapsible open={mosqueOpen} onOpenChange={setMosqueOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors mt-6">
            {t("mosque")}
            <ChevronDown className={`h-3 w-3 transition-transform ${mosqueOpen ? '' : '-rotate-90'}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-2">
            {filteredMosqueMenu.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] transition-all relative group overflow-hidden ${
                    isActive
                      ? 'font-black italic tracking-tight Smart-gold-glow'
                      : 'text-white/50 hover:text-white hover:bg-emerald-900/40'
                  }`}
                  style={{ color: isActive ? '#062019' : undefined }}
                >
                  {isActive && (
                    <>
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute inset-0 smart-gold-gradient rounded-xl -z-10"
                      />
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#86590d]" />
                    </>
                  )}
                  <Icon className="h-4 w-4" style={{ color: isActive ? '#062019' : undefined }} />
                  {item.label}
                </Link>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      </nav>
 
      {/* Language + User info */}
      <div className="border-t border-white/5 bg-black/10 p-4">
        <LanguageSwitcher />
        <div className="flex items-center gap-3 mt-4">
          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
            <span className="text-sm font-black text-white italic">
              {user?.full_name?.[0] || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black italic tracking-tighter truncate leading-none text-white uppercase">{user?.full_name || "Pengguna"}</p>
            <p className="text-[10px] text-white/40 truncate mt-1 font-bold uppercase tracking-widest">{roleLabel}</p>
          </div>
          <button onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }} className="p-2 rounded-xl hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all" title="Keluar">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
