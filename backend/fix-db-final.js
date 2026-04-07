const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== ⚙️ PERBAIKAN DATABASE MASJIDKU SMART ===");
  
  const tasks = [
    { label: "Kolom latitude", sql: "ALTER TABLE Mosque ADD COLUMN latitude FLOAT NULL" },
    { label: "Kolom longitude", sql: "ALTER TABLE Mosque ADD COLUMN longitude FLOAT NULL" },
    { label: "Kolom organization_structure_url", sql: "ALTER TABLE Mosque ADD COLUMN organization_structure_url VARCHAR(255) NULL" },
    { label: "Kolom original_price", sql: "ALTER TABLE PlanFeatures ADD COLUMN original_price FLOAT DEFAULT 0" },
    { label: "Kolom created_at (Mosque)", sql: "ALTER TABLE Mosque ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP" },
    { label: "Kolom created_at (PlanFeatures)", sql: "ALTER TABLE PlanFeatures ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP" },
    { label: "Kolom pin (User)", sql: "ALTER TABLE User ADD COLUMN pin VARCHAR(255) NULL" }
  ];

  for (const task of tasks) {
    try {
      console.log(`\n⏳ Sedang menambahkan: ${task.label}...`);
      await prisma.$executeRawUnsafe(task.sql);
      console.log(`✅ BERHASIL.`);
    } catch (err) {
      if (err.message.includes("Duplicate column name")) {
        console.log(`ℹ️ SKIP: Kolom sudah ada.`);
      } else {
        console.error(`❌ GAGAL: ${err.message}`);
      }
    }
  }

  console.log("\n=== ✅ PERBAIKAN DATABASE SELESAI ===");
  process.exit(0);
}

main();
