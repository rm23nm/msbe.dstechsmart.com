const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPermissions() {
  try {
    console.log("=== 🛠️ MASTER ROLE FIX & GRANT ALL ===");

    // 1. Alter Table
    console.log("\n[DB] Mengubah tipe kolom 'permission' menjadi TEXT...");
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE RolePermission MODIFY COLUMN permission TEXT');
      console.log("Success: RolePermission.permission is now TEXT.");
    } catch (e) {
      console.log("Note: ALTER might have failed or field is already TEXT. Error:", e.message);
    }

    // 2. Grant Permissions
    const allPermissions = {
      dashboard: ["view"],
      finances: ["view", "create", "edit", "delete"],
      jamaah: ["view", "create", "edit", "delete"],
      zakat: ["view", "create", "edit", "delete"],
      qurban: ["view", "create", "edit", "delete"],
      activities: ["view", "create", "edit", "delete"],
      assets: ["view", "create", "edit", "delete"],
      audit_logs: ["view", "create", "edit", "delete"],
      broadcast: ["view", "create", "edit", "delete"],
      donations: ["view", "create", "edit", "delete"],
      announcements: ["view", "create", "edit", "delete"],
      telegram: ["view", "create", "edit", "delete"],
      quran: ["view", "create", "edit", "delete"],
      settings: ["view", "create", "edit", "delete"],
      roles: ["view", "create", "edit", "delete"],
      vouchers: ["view", "create", "edit", "delete"]
    };

    const permJson = JSON.stringify(allPermissions);

    console.log("\n[Roles] Memberikan hak akses penuh ke role admin_masjid & pengurus...");
    await prisma.rolePermission.updateMany({
      where: { role_name: { in: ["admin_masjid", "pengurus"] } },
      data: {
        permissions: permJson,
        permission: permJson
      }
    });

    console.log("[Roles] Memberikan hak akses penuh ke role spesifik masjid m123...");
    await prisma.rolePermission.updateMany({
      where: { mosque_id: "m123" },
      data: {
        permissions: permJson,
        permission: permJson
      }
    });

    console.log("\n✅ SEMUA IZIN BERHASIL DITERAPKAN!");

  } catch (err) {
    console.error("\n❌ ERROR:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixPermissions();
