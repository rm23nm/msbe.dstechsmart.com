const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== OPERASI ARSITEK SULTAN DIMULAI ===");
  
  try {
    // 1. Tambah kolom PIN ke tabel User (jika belum ada)
    console.log("Sedang memasang gembok PIN di tabel User...");
    await prisma.$executeRawUnsafe(`ALTER TABLE User ADD COLUMN pin TEXT`);
    console.log("✅ Gembok PIN berhasil dipasang!");
  } catch (e) {
    if (e.message.includes("duplicate column name") || e.message.includes("already exists")) {
      console.log("ℹ️ Kolom PIN sudah tersedia.");
    } else {
      console.error("❌ Gagal memasang PIN:", e.message);
    }
  }

  try {
    // 2. Buat tabel AuditLog (jika belum ada)
    console.log("Sedang membangun Gudang AuditLog...");
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS AuditLog (
        id TEXT PRIMARY KEY,
        mosque_id TEXT,
        user_id TEXT,
        user_name TEXT,
        action TEXT,
        entity TEXT,
        entity_id TEXT,
        description TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Gudang AuditLog berhasil dibangun!");
  } catch (e) {
    console.error("❌ Gagal membangun AuditLog:", e.message);
  }

  console.log("=== OPERASI ARSITEK SULTAN SELESAI ===");
  process.exit(0);
}

main();
