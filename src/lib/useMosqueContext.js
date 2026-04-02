import { useState, useEffect } from "react";
import { smartApi } from "@/api/apiClient";

// Roles yang dianggap sebagai admin tingkat atas (superadmin/admin)
const SUPERADMIN_ROLES = ["superadmin", "admin"];
// Roles yang dianggap sebagai pengurus masjid
const MOSQUE_ADMIN_ROLES = ["mosque_admin", "pengurus", "admin_masjid", "bendahara"];

export function useMosqueContext() {
  const [user, setUser] = useState(null);
  const [mosques, setMosques] = useState([]);
  const [currentMosque, setCurrentMosque] = useState(null);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContext();
  }, []);

  async function loadContext() {
    setLoading(true);
    try {
      const me = await smartApi.auth.me();
      setUser(me);

      const allMosques = await smartApi.entities.Mosque.list();
      let userMosques = [];
      let members = [];

      const isSuperAdmin = SUPERADMIN_ROLES.includes(me.role);

      if (isSuperAdmin) {
        // Superadmin bisa lihat semua masjid
        userMosques = allMosques;
      } else if (MOSQUE_ADMIN_ROLES.includes(me.role)) {
        // Pengurus hanya bisa lihat masjid yang dia bagian dari anggotanya
        members = await smartApi.entities.MosqueMember.filter({ user_email: me.email });
        const mosqueIds = members.map(m => m.mosque_id);
        userMosques = allMosques.filter(m => mosqueIds.includes(m.id));
        // Jika tidak ada hasil dari filter member, gunakan current_mosque_id
        if (userMosques.length === 0 && me.current_mosque_id) {
          userMosques = allMosques.filter(m => m.id === me.current_mosque_id);
        }
      } else {
        // Jamaah biasa
        members = await smartApi.entities.MosqueMember.filter({ user_email: me.email });
        const mosqueIds = members.map(m => m.mosque_id);
        userMosques = allMosques.filter(m => mosqueIds.includes(m.id));
        // Fallback ke current_mosque_id jika anggota belum tercatat
        if (userMosques.length === 0 && me.current_mosque_id) {
          userMosques = allMosques.filter(m => m.id === me.current_mosque_id);
        }
      }

      if (userMosques.length > 0) {
        setMosques(userMosques);

        // Set current mosque
        const preferredId = me.current_mosque_id;
        const current = userMosques.find(m => m.id === preferredId) || userMosques[0];
        setCurrentMosque(current);

        // Set membership role for current mosque
        if (isSuperAdmin) {
          setMembership({ role: "admin_masjid" }); // Virtual admin role untuk superadmin
        } else {
          const currentMembership = members.find(m => m.mosque_id === current?.id);
          setMembership(currentMembership || { role: me.role }); // fallback ke role user
        }
      } else if (allMosques.length > 0) {
        // Jamaah belum punya masjid — tampilkan masjid pertama sebagai default
        const activeMosque = allMosques.find(m => m.status === "active") || allMosques[0];
        setCurrentMosque(activeMosque);
        setMosques([activeMosque]);
        setMembership({ role: "jamaah" });
      }
    } catch (err) {
      // User tidak login — load masjid pertama sebagai default publik
      try {
        const allMosques = await smartApi.entities.Mosque.list();
        const activeMosque = allMosques.find(m => m.status === "active") || allMosques[0];
        if (activeMosque) {
          setCurrentMosque(activeMosque);
          setMosques([activeMosque]);
        }
      } catch (_) {
        // Tidak ada koneksi backend
      }
    }
    setLoading(false);
  }

  async function switchMosque(mosqueId) {
    if (user && typeof smartApi.auth.updateMe === "function") {
      try {
        await smartApi.auth.updateMe({ current_mosque_id: mosqueId });
      } catch (err) {}
    }
    const mosque = mosques.find(m => m.id === mosqueId);
    setCurrentMosque(mosque);

    const isSuperAdmin = SUPERADMIN_ROLES.includes(user?.role);
    if (isSuperAdmin) {
      setMembership({ role: "admin_masjid" });
    } else if (user) {
      const members = await smartApi.entities.MosqueMember.filter({ user_email: user.email, mosque_id: mosqueId });
      setMembership(members[0] || { role: user.role });
    }
  }

  const isSuperAdmin = SUPERADMIN_ROLES.includes(user?.role);
  const isMosqueAdmin = isSuperAdmin || MOSQUE_ADMIN_ROLES.includes(membership?.role);
  const isBendahara = isSuperAdmin || membership?.role === "bendahara";
  const isPengurus = isSuperAdmin || MOSQUE_ADMIN_ROLES.includes(membership?.role);

  return {
    user,
    mosques,
    currentMosque,
    membership,
    loading,
    switchMosque,
    isAdmin: isSuperAdmin,
    isMosqueAdmin,
    isBendahara,
    isPengurus,
    reload: loadContext,
  };
}