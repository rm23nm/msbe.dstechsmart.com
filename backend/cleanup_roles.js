const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Starting role cleanup and standardization...");
  const roles = await prisma.rolePermission.findMany();

  for (const role of roles) {
    let p = null;
    try {
      // Prioritize permissions (plural), fallback to permission (singular)
      const raw = role.permissions || role.permission;
      if (!raw) continue;
      
      p = typeof raw === 'string' ? JSON.parse(raw) : raw;
      
      // Convert arrays ["view"] to objects {view: true}
      const newPerms = {};
      for (const key in p) {
        if (Array.isArray(p[key])) {
          newPerms[key] = { view: false, edit: false, delete: false };
          p[key].forEach(action => {
            newPerms[key][action] = true;
          });
        } else if (typeof p[key] === 'object') {
          newPerms[key] = p[key];
        } else if (p[key] === true) {
          // Backward compat for boolean flags (e.g. view: true)
          newPerms[key] = { view: true, edit: false, delete: false };
        }
      }

      await prisma.rolePermission.update({
        where: { id: role.id },
        data: {
          permission: JSON.stringify(newPerms), // Sync singular
          permissions: JSON.stringify(newPerms)  // Sync plural
        }
      });
      console.log(`Updated role: ${role.role_name} (${role.mosque_id || 'Global'})`);
    } catch (e) {
      console.error(`Failed to update ${role.role_name}:`, e.message);
    }
  }
  
  // Ensure 'admin_masjid' global template HAS all modules by default
  const adminMasjid = await prisma.rolePermission.findFirst({ where: { role_name: 'admin_masjid', mosque_id: null } });
  if (adminMasjid) {
     const MOSQUE_MODULES = [
       "dashboard", "keuangan", "laporan-keuangan", "kegiatan", "aset", "jamaah", 
       "jamaah-dashboard", "analitik", "ai-analitik", "donasi-masjid", "absensi", 
       "pengumuman", "info-publik", "telegram", "portfolio", "tv", "pengaturan", "hak-akses",
       "audit-logs", "zakat", "qurban"
     ];
     const fullPerms = {};
     MOSQUE_MODULES.forEach(m => {
       fullPerms[m] = { view: true, edit: true, delete: true };
     });
     
     await prisma.rolePermission.update({
       where: { id: adminMasjid.id },
       data: {
         permissions: JSON.stringify(fullPerms),
         permission: JSON.stringify(fullPerms)
       }
     });
     console.log("Admin Masjid Global Template reset to Full Access.");
  }
}

main().finally(() => prisma.$disconnect());
