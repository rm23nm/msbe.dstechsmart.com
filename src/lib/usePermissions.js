import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { smartApi } from '@/api/apiClient';

let cachedPermissions = null;

export function usePermissions(menuId) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState({ view: false, edit: false, delete: false }); // Default strict (secure)

  useEffect(() => {
    if (!user || !user.role) return;
    
    // Superadmin and Mosque Admin have full access by default
    if (user.role === 'superadmin' || user.role === 'admin_masjid') {
      setPermissions({ view: true, edit: true, delete: true });
      return;
    }

    const loadPermissions = async () => {
      try {
        if (!cachedPermissions) {
          const roles = await smartApi.entities.RolePermission.list();
          cachedPermissions = roles;
        }
        
        // Match role by Name AND (Global OR Current Mosque)
        const myRole = cachedPermissions.find(r => 
          r.role_name === user.role && 
          (r.mosque_id === null || r.mosque_id === user.current_mosque_id)
        );
        
        if (myRole && myRole.permissions) {
          try {
            const parsed = typeof myRole.permissions === 'string' ? JSON.parse(myRole.permissions) : myRole.permissions;
            if (parsed[menuId]) {
              setPermissions(parsed[menuId]);
            } else {
              setPermissions({ view: false, edit: false, delete: false });
            }
          } catch(e) {
            console.error("JSON Parse Error on Permissions", e);
            setPermissions({ view: false, edit: false, delete: false });
          }
        } else {
          // If role not defined, apply basic defaults
          if (user.role === 'jamaah' || user.role === 'user') {
             setPermissions({ view: true, edit: false, delete: false });
          }
        }
      } catch (e) {
        console.error("Failed loading permissions", e);
      }
    };
    
    loadPermissions();
  }, [user, menuId]);

  return permissions;
}
