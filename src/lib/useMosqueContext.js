import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import { useAuth } from "./AuthContext";

import { toast } from "sonner";

// Roles yang dianggap sebagai admin tingkat atas (superadmin/admin)
const SUPERADMIN_ROLES = ["superadmin", "admin"];
// Roles yang dianggap sebagai pengurus masjid
const MOSQUE_ADMIN_ROLES = ["mosque_admin", "pengurus", "admin_masjid", "bendahara", "ketua_dkm", "sekretaris", "imam", "marbot", "amil", "humas"];

export function useMosqueContext() {
  const { user, updateUser } = useAuth();
  const [mosques, setMosques] = useState([]);
  const [allMosques, setAllMosques] = useState([]);
  const [currentMosque, setCurrentMosque] = useState(null);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [planFeatures, setPlanFeatures] = useState([]);
  const [allPermissionsTemplate, setAllPermissionsTemplate] = useState([]);
  const [isWhiteLabel, setIsWhiteLabel] = useState(false);

  async function loadContext() {
    setLoading(true);
    try {
      // 1. Dapatkan user terkini
      let me = user;
      if (!me) {
        try {
          me = await smartApi.auth.me();
        } catch (e) {
          // Tidak login? Tetap lanjut untuk mode publik
        }
      }

      // 2. Ambil semua masjid & Plan Features & Role Permissions
      const [list, plans, roles] = await Promise.all([
        smartApi.entities.Mosque.list().catch(() => []),
        smartApi.entities.PlanFeatures.list().catch(() => []),
        smartApi.auth.getRoles().catch(() => [])
      ]);
      
      const validList = Array.isArray(list) ? list : [];
      const validPlans = Array.isArray(plans) ? plans : [];
      const validRoles = Array.isArray(roles) ? roles : [];

      setAllMosques(validList);
      setPlanFeatures(validPlans);
      setAllPermissionsTemplate(validRoles);

      let currentMosqueId = me?.current_mosque_id;
      let userMosques = [];
      let currentMemberships = [];

      // 3. Jika login, ambil data keanggotaan
      if (me?.email) {
        try {
          const isSuperAdmin = SUPERADMIN_ROLES.includes(me.role);
          
          if (isSuperAdmin) {
            userMosques = validList;
            setMembership({ role: "admin_masjid", mosque_id: currentMosqueId });
          } else {
            currentMemberships = await smartApi.entities.MosqueMember.filter({ user_email: me.email }).catch(() => []) || [];
            const mosqueIds = (Array.isArray(currentMemberships) ? currentMemberships : []).map(m => m.mosque_id);
            userMosques = validList.filter(m => mosqueIds.includes(m.id));
            
            // Fallback ke current_mosque_id jika tidak ada di member filter tapi ada di profil
            if (userMosques.length === 0 && currentMosqueId) {
              const pref = validList.find(m => m.id === currentMosqueId);
              if (pref) userMosques = [pref];
            }
          }
          
          setMosques(userMosques);

          // Tentukan masjid aktif
          if (!currentMosqueId && userMosques.length > 0) {
            currentMosqueId = userMosques[0].id;
          }

          if (currentMosqueId && !isSuperAdmin) {
            const mship = currentMemberships.find(m => m.mosque_id === currentMosqueId);
            setMembership(mship || { role: me.role });
          }
        } catch (err) {
          console.error("Failed to load user content:", err);
        }
      }

      // 4. Cari objek masjid aktif & lampirkan fiturnya
      if (currentMosqueId) {
        const found = validList.find(m => m.id === currentMosqueId);
        if (found) {
          const plan = validPlans.find(p => p.plan === found.subscription_plan);
          let activeFeatures = [];
          if (plan?.features) {
            try { 
              activeFeatures = typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || []); 
            } catch(e) { activeFeatures = []; }
          }
          setCurrentMosque({ ...found, plan_features: activeFeatures });
        } else {
          setCurrentMosque(validList.length > 0 ? validList[0] : null);
        }
      } else if (validList.length > 0) {
        // Mode publik
        const path = window.location.pathname;
        if (path.startsWith('/masjid/')) {
          const slugOrId = path.split('/')[2];
          const found = validList.find(m => m.id === slugOrId || m.slug === slugOrId);
          if (found) {
             const plan = validPlans.find(p => p.plan === found.subscription_plan);
             let activeFeatures = [];
             if (plan?.features) {
               try { 
                 activeFeatures = typeof plan.features === 'string' ? JSON.parse(plan.features) : (plan.features || []); 
               } catch(e) { activeFeatures = []; }
             }
             // Determine isWhiteLabel from features
             const whiteLabelActive = Array.isArray(activeFeatures) && activeFeatures.some(f => 
               typeof f === 'string' && f.toLowerCase().includes("white label")
             );
             setIsWhiteLabel(whiteLabelActive);
             setCurrentMosque({ ...found, plan_features: activeFeatures });
          } else if (validList.length > 0) {
             setCurrentMosque(validList[0]);
          }
        } else if (validList.length > 0) {
          setCurrentMosque(validList[0]);
        }
      }

    } catch (err) {
      console.error("useMosqueContext load error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function switchMosque(mosqueId) {
    if (!mosqueId) return;
    try {
      const found = allMosques.find(m => m.id === mosqueId);
      let switchResult = null;
      if (typeof smartApi.auth.updateMe === "function") {
        switchResult = await smartApi.auth.updateMe({ current_mosque_id: mosqueId });
      }
      if (updateUser) {
        // Now passing the full result (potentially containing {user, token})
        updateUser(switchResult || { current_mosque_id: mosqueId });
      }
      if (found) {
        setCurrentMosque(found);
        toast.success(`Berhasil pindah ke ${found.name}`);
      }
      // Re-load to get permissions and plan benefits correctly
      loadContext(); 
    } catch (err) {
      console.error("Switch mosque error:", err);
      const msg = err.response?.data?.error || err.message || "Gagal berpindah masjid";
      toast.error(`Gagal berpindah: ${msg}`);
    }
  }

  useEffect(() => {
    loadContext();
  }, [user?.current_mosque_id]);

  const isSuperAdmin = SUPERADMIN_ROLES.includes(user?.role);
  const isMosqueAdmin = isSuperAdmin || MOSQUE_ADMIN_ROLES.includes(membership?.role);
  const isBendahara = isSuperAdmin || membership?.role === "bendahara";

  // Dynamic Role-based Permissions Logic
  const permissions = (() => {
    if (isSuperAdmin) return { FULL_ACCESS: true };
    if (!membership?.role || !allPermissionsTemplate) return {};
    
    const roleName = membership.role;
    // Prio: Local Override first, then Global Template
    const local = allPermissionsTemplate.find(r => r.role_name === roleName && r.mosque_id === currentMosque?.id);
    const global = allPermissionsTemplate.find(r => r.role_name === roleName && r.mosque_id === null);
    
    const activeRp = local || global;
    if (!activeRp) return {};
    
    try {
      return typeof activeRp.permissions === 'string' ? JSON.parse(activeRp.permissions) : activeRp.permissions;
    } catch {
      return {};
    }
  })();

  const hasPermission = (menuId, action = "view") => {
    if (isSuperAdmin) return true;
    const p = permissions[menuId];
    if (!p) return false;
    
    // Support Object based: { view: true, ... }
    if (typeof p === 'object' && !Array.isArray(p)) {
      return p[action] === true;
    }
    
    // Support legacy Array based: ["view", "edit"]
    if (Array.isArray(p)) {
      return p.includes(action);
    }
    
    return false;
  };

  return {
    user,
    currentMosque,
    isWhiteLabel,
    mosques,
    allMosques,
    loading,
    membership,
    rolePermissions: allPermissionsTemplate,
    permissions,
    hasPermission,
    isSuperAdmin,
    isAdmin: isSuperAdmin,
    isMosqueAdmin,
    isBendahara,
    isPengurus: isMosqueAdmin,
    switchMosque,
    reload: loadContext,
  };
}
