import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";
import { useAuth } from "./AuthContext";

// Roles yang dianggap sebagai admin tingkat atas (superadmin/admin)
const SUPERADMIN_ROLES = ["superadmin", "admin"];
// Roles yang dianggap sebagai pengurus masjid
const MOSQUE_ADMIN_ROLES = ["mosque_admin", "pengurus", "admin_masjid", "bendahara"];

export function useMosqueContext() {
  const { user, updateUser } = useAuth();
  const [mosques, setMosques] = useState([]);
  const [allMosques, setAllMosques] = useState([]);
  const [currentMosque, setCurrentMosque] = useState(null);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);

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

      // 2. Ambil semua masjid (untuk mode publik/cari)
      const list = await smartApi.entities.Mosque.list() || [];
      setAllMosques(list);

      let currentMosqueId = me?.current_mosque_id;
      let userMosques = [];
      let currentMemberships = [];

      // 3. Jika login, ambil data keanggotaan
      if (me?.email) {
        try {
          const isSuperAdmin = SUPERADMIN_ROLES.includes(me.role);
          
          if (isSuperAdmin) {
            userMosques = list;
            setMembership({ role: "admin_masjid", mosque_id: currentMosqueId });
          } else {
            currentMemberships = await smartApi.entities.MosqueMember.filter({ user_email: me.email }) || [];
            const mosqueIds = currentMemberships.map(m => m.mosque_id);
            userMosques = list.filter(m => mosqueIds.includes(m.id));
            
            // Fallback ke current_mosque_id jika tidak ada di member filter tapi ada di profil
            if (userMosques.length === 0 && currentMosqueId) {
              const pref = list.find(m => m.id === currentMosqueId);
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

      // 4. Cari objek masjid aktif
      if (currentMosqueId) {
        const found = list.find(m => m.id === currentMosqueId);
        setCurrentMosque(found || (list.length > 0 ? list[0] : null));
      } else if (list.length > 0) {
        // Mode publik: Cek URL params jika di halaman portfolio
        const path = window.location.pathname;
        if (path.startsWith('/masjid/')) {
          const slugOrId = path.split('/')[2];
          const found = list.find(m => m.id === slugOrId || m.slug === slugOrId);
          setCurrentMosque(found || list[0]);
        } else {
          setCurrentMosque(list[0]);
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
      if (typeof smartApi.auth.updateMe === "function") {
        await smartApi.auth.updateMe({ current_mosque_id: mosqueId });
      } else if (typeof smartApi.auth.update === "function") {
        await smartApi.auth.update({ current_mosque_id: mosqueId });
      }
      
      if (updateUser) {
        updateUser({ current_mosque_id: mosqueId });
      }
      
      // Update local state immediately for performance
      const found = allMosques.find(m => m.id === mosqueId);
      if (found) {
        setCurrentMosque(found);
      }
      
    } catch (error) {
      console.error("Switch mosque error:", error);
    }
  }

  useEffect(() => {
    loadContext();
  }, [user?.current_mosque_id]);

  const isSuperAdmin = SUPERADMIN_ROLES.includes(user?.role);
  const isMosqueAdmin = isSuperAdmin || MOSQUE_ADMIN_ROLES.includes(membership?.role);
  const isBendahara = isSuperAdmin || membership?.role === "bendahara";

  return {
    user,
    currentMosque,
    mosques,
    allMosques,
    loading,
    membership,
    isSuperAdmin,
    isAdmin: isSuperAdmin,
    isMosqueAdmin,
    isBendahara,
    isPengurus: isMosqueAdmin,
    switchMosque,
    reload: loadContext,
  };
}