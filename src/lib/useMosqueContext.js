import { useState, useEffect } from "react";
import { base44 } from "@/api/apiClient";

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
      const me = await base44.auth.me();
      setUser(me);

      const allMosques = await base44.entities.Mosque.list();
      let userMosques = [];
      let members = [];

      if (me.role === 'admin') {
        userMosques = allMosques;
      } else {
        members = await base44.entities.MosqueMember.filter({ user_email: me.email });
        const mosqueIds = members.map(m => m.mosque_id);
        userMosques = allMosques.filter(m => mosqueIds.includes(m.id));
      }
      
      if (userMosques.length > 0) {
        setMosques(userMosques);

        // Set current mosque
        const currentId = me.current_mosque_id || (userMosques[0]?.id);
        const current = userMosques.find(m => m.id === currentId) || userMosques[0];
        setCurrentMosque(current);

        // Set membership for current mosque
        if (me.role === 'admin') {
          setMembership({ role: 'admin_masjid' }); // Virtual admin role
        } else {
          const currentMembership = members.find(m => m.mosque_id === current?.id);
          setMembership(currentMembership);
        }
      }
    } catch (err) {
      // User not logged in (public visitor) — load first active mosque as default
      try {
        const allMosques = await base44.entities.Mosque.list();
        const activeMosque = allMosques.find(m => m.status === 'active') || allMosques[0];
        if (activeMosque) {
          setCurrentMosque(activeMosque);
          setMosques([activeMosque]);
        }
      } catch (_) {
        // Nothing to do if even mosque list fails
      }
    }
    setLoading(false);
  }

  async function switchMosque(mosqueId) {
    if (user && typeof base44.auth.updateMe === 'function') {
      try { await base44.auth.updateMe({ current_mosque_id: mosqueId }); } catch(err){}
    }
    const mosque = mosques.find(m => m.id === mosqueId);
    setCurrentMosque(mosque);
    if (user?.role === 'admin') {
      setMembership({ role: 'admin_masjid' });
    } else if (user) {
      const members = await base44.entities.MosqueMember.filter({ user_email: user.email, mosque_id: mosqueId });
      setMembership(members[0] || null);
    }
  }

  return {
    user,
    mosques,
    currentMosque,
    membership,
    loading,
    switchMosque,
    isAdmin: user?.role === 'admin',
    isMosqueAdmin: membership?.role === "admin_masjid",
    isBendahara: membership?.role === "bendahara",
    isPengurus: membership?.role === "pengurus" || membership?.role === "admin_masjid" || membership?.role === "bendahara",
    reload: loadContext,
  };
}