import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { smartApi } from '@/api/apiClient';

let cachedPermissions = null;

export function usePermissions(menuId) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState({ view: true, edit: true, delete: true }); // Default optimistic

  useEffect(() => {
    if (!user || !user.role) return;
    
    // Superadmin has full access by default
    if (user.role === 'superadmin' || user.role === 'admin') {
      setPermissions({ view: true, edit: true, delete: true });
      return;
    }

    const loadPermissions = async () => {
      try {
        if (!cachedPermissions) {
          const roles = await smartApi.entities.RolePermission.list();
          // Cache to avoid fetching multiple times per page load
          cachedPermissions = roles;
        }
        
        const myRole = cachedPermissions.find(r => r.role_name === user.role);
        if (myRole && myRole.permissions) {
          const parsed = JSON.parse(myRole.permissions);
          if (parsed[menuId]) {
            setPermissions(parsed[menuId]);
          } else {
            // Default restrictive for unknown menus
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
