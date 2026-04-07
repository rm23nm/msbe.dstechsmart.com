const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixRolesJson() {
  try {
    console.log("=== 🛠️ ROLE PERMISSION REPAIR & BENDAHARA SETUP ===");

    // Full access structure for Admin/Bendahara
    const fullAccess = {
      dashboard: { view: true, edit: true, delete: true },
      keuangan: { view: true, edit: true, delete: true },
      "laporan-keuangan": { view: true, edit: true, delete: true },
      kegiatan: { view: true, edit: true, delete: true },
      aset: { view: true, edit: true, delete: true },
      jamaah: { view: true, edit: true, delete: true },
      "jamaah-dashboard": { view: true, edit: true, delete: true },
      analitik: { view: true, edit: true, delete: true },
      "ai-analitik": { view: true, edit: true, delete: true },
      "donasi-masjid": { view: true, edit: true, delete: true },
      absensi: { view: true, edit: true, delete: true },
      pengumuman: { view: true, edit: true, delete: true },
      "info-publik": { view: true, edit: true, delete: true },
      telegram: { view: true, edit: true, delete: true },
      portfolio: { view: true, edit: true, delete: true },
      tv: { view: true, edit: true, delete: true },
      pengaturan: { view: true, edit: true, delete: true },
      "audit-logs": { view: true, edit: true, delete: true },
      zakat: { view: true, edit: true, delete: true },
      qurban: { view: true, edit: true, delete: true }
    };

    // Treasurer limited structure (Finance & Social only)
    const treasurerAccess = {
      dashboard: { view: true, edit: false, delete: false },
      keuangan: { view: true, edit: true, delete: true },
      "laporan-keuangan": { view: true, edit: true, delete: true },
      zakat: { view: true, edit: true, delete: true },
      qurban: { view: true, edit: true, delete: true },
      aset: { view: true, edit: true, delete: true },
      kegiatan: { view: true, edit: false, delete: false },
      jamaah: { view: true, edit: false, delete: false },
      "donasi-masjid": { view: true, edit: true, delete: true }
    };

    const adminJson = JSON.stringify(fullAccess);
    const treasurerJson = JSON.stringify(treasurerAccess);

    // 1. Update existing admin & pengurus (global and local)
    console.log("\n[Roles] Updating admin_masjid & pengurus to full access...");
    await prisma.rolePermission.updateMany({
      where: { role_name: { in: ["admin_masjid", "pengurus", "ketua_dkm", "sekretaris"] } },
      data: { permissions: adminJson, permission: adminJson }
    });

    // 2. Create or Update Bendahara role for global (default) and local m123
    const targets = [null, "m123"];
    for (const m_id of targets) {
      console.log(`[Roles] Setting up Bendahara for Mosque ID: ${m_id || 'Global'}...`);
      const existing = await prisma.rolePermission.findFirst({
        where: { role_name: "bendahara", mosque_id: m_id }
      });

      if (existing) {
        await prisma.rolePermission.update({
          where: { id: existing.id },
          data: { permissions: treasurerJson, permission: treasurerJson }
        });
      } else {
        await prisma.rolePermission.create({
          data: {
            role_name: "bendahara",
            mosque_id: m_id,
            permissions: treasurerJson,
            permission: treasurerJson
          }
        });
      }
    }

    console.log("\n✅ PERMISSION REPAIR COMPLETE!");

  } catch (err) {
    console.error("\n❌ ERROR:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixRolesJson();
