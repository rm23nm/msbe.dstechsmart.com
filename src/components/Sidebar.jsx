import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Wallet, Calendar, Users, Megaphone, Settings, Monitor,
  Building2, CreditCard, BarChart3, LogOut, ChevronDown, Landmark,
  Package, FileBarChart, Heart, HandHeart, Sparkles, ClipboardCheck, Send, ShieldAlert
} from "lucide-react";
import { smartApi } from "@/api/apiClient";
import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/useLanguage";
import LanguageSwitcher from "./LanguageSwitcher";
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
  ];
}

function getMosqueMenuItems(t) {
  return [
    { label: t("dashboard"), path: "/dashboard", icon: LayoutDashboard },
    { label: t("finance"), path: "/keuangan", icon: Wallet },
    { label: t("financialReport"), path: "/laporan-keuangan", icon: FileBarChart },
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
    { label: t("settings"), path: "/pengaturan", icon: Settings },
  ];
}

export default function Sidebar({ onClose }) {
  const location = useLocation();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [adminOpen, setAdminOpen] = useState(true);
  const [mosqueOpen, setMosqueOpen] = useState(true);

  useEffect(() => {
    smartApi.auth.me().then(setUser).catch(() => {});
  }, []);

  const adminMenuItems = getAdminMenuItems(t);
  const mosqueMenuItems = getMosqueMenuItems(t);
  const isAdmin = user?.role === "superadmin" || user?.role === "admin";
  const isMosqueAdmin = isAdmin || user?.role === "mosque_admin" || user?.role === "pengurus";
  const roleLabel = user?.role === "superadmin" ? "Super Admin" : user?.role === "mosque_admin" ? "Pengurus" : user?.role === "user" ? "Jamaah" : (user?.role || "...");

  return (
    <div className="h-full bg-sidebar text-sidebar-foreground flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/" onClick={onClose} className="flex items-center gap-3">
          <img src="/favicon.png?v=2" alt="MasjidKu Smart" className="w-10 h-10 rounded-xl object-contain" />
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">MasjidKu</h1>
            <p className="text-xs text-sidebar-foreground/60">Pengelolaan Masjid</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {isAdmin && (
          <Collapsible open={adminOpen} onOpenChange={setAdminOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/70">
              {t("superAdmin")}
              <ChevronDown className={`h-3 w-3 transition-transform ${adminOpen ? '' : '-rotate-90'}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1">
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        )}

        <Collapsible open={mosqueOpen} onOpenChange={setMosqueOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/70">
            {t("mosque")}
            <ChevronDown className={`h-3 w-3 transition-transform ${mosqueOpen ? '' : '-rotate-90'}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-1">
            {mosqueMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      </nav>

      {/* Language + User info */}
      <div className="border-t border-sidebar-border">
        <LanguageSwitcher />
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-xs font-semibold text-sidebar-accent-foreground">
              {user?.full_name?.[0] || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.full_name || "Pengguna"}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">{roleLabel} • {user?.email || ""}</p>
          </div>
          <button onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }} className="text-sidebar-foreground/50 hover:text-red-400 transition-colors" title="Keluar">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}