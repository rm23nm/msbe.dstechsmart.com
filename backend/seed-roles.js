require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== 👑 MENYUNTIKKAN ROLE STANDAR MASJIDKU SMART ===");
  
  const standardRoles = [
    {
      role_name: "superadmin",
      permission: JSON.stringify({
        dashboard: ["view"],
        mosques: ["view", "create", "edit", "delete"],
        users: ["view", "create", "edit", "delete"],
        licenses: ["view", "create", "edit", "delete"],
        vouchers: ["view", "create", "edit", "delete"],
        settings: ["view", "edit"]
      })
    },
    {
      role_name: "admin_masjid",
      permission: JSON.stringify({
        dashboard: ["view"],
        finances: ["view", "create", "edit", "delete"],
        jamaah: ["view", "create", "edit", "delete"],
        assets: ["view", "create", "edit", "delete"],
        zakat: ["view", "create", "edit", "delete"],
        activities: ["view", "create", "edit", "delete"]
      })
    },
    {
      role_name: "pengurus",
      permission: JSON.stringify({
        dashboard: ["view"],
        finances: ["view", "create"],
        activities: ["view", "create", "edit"],
        jamaah: ["view"]
      })
    },
    {
      role_name: "jamaah",
      permission: JSON.stringify({
        dashboard: ["view"],
        donations: ["view", "create"],
        activities: ["view"]
      })
    }
  ];

  for (const role of standardRoles) {
    try {
      // Use upsert to prevent duplicates
      await prisma.rolePermission.create({
        data: {
          id: `std_${role.role_name}`,
          role_name: role.role_name,
          permission: role.permission,
          permissions: role.permission, // Double sync for safety
          mosque_id: null // Global Roles
        }
      });
      console.log(`✅ BERHASIL: Role ${role.role_name} telah dibuat.`);
    } catch (err) {
      if (err.message.includes("Unique constraint failed") || err.message.includes("Duplicate entry")) {
        console.log(`ℹ️ SKIP: Role ${role.role_name} sudah ada.`);
      } else {
        console.error(`❌ GAGAL ${role.role_name}:`, err.message);
      }
    }
  }

  console.log("\n=== ✅ SEEDING ROLE SELESAI ===");
  process.exit(0);
}

main();
