const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function grantAllPermissions() {
  try {
    console.log("=== 📜 PENGATURAN HAK AKSES (ROLL) SELURUH MODUL ===");

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

    // 1. Update Standard Roles
    console.log("\n[Roles] Memperbarui Role Standar (admin_masjid, pengurus)...");
    await prisma.rolePermission.updateMany({
      where: { role_name: { in: ["admin_masjid", "pengurus"] } },
      data: {
        permissions: permJson,
        permission: permJson
      }
    });

    // 2. Update Specific Mosque roles (m123)
    console.log("[Roles] Memperbarui role untuk Masjid ID: m123...");
    await prisma.rolePermission.updateMany({
      where: { mosque_id: "m123" },
      data: {
        permissions: permJson,
        permission: permJson
      }
    });

    console.log("\n✅ SEMUA IZIN BERHASIL DIBERIKAN (ROLL AKTIF)!");

  } catch (err) {
    console.error("\n❌ GAGAL PENGATURAN HAK AKSES:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

grantAllPermissions();
