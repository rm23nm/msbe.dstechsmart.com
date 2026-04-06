const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== 🔍 SINKRONISASI DATABASE MASJIDKU SMART ===");
  
  const tasks = [
    {
      label: "Tambahkan kolom 'pin' di tabel User",
      sql: "ALTER TABLE User ADD COLUMN pin VARCHAR(255) NULL",
      checkSql: "SHOW COLUMNS FROM User LIKE 'pin'"
    },
    {
      label: "Tambahkan kolom 'created_at' di tabel PlanFeatures",
      sql: "ALTER TABLE PlanFeatures ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP",
      checkSql: "SHOW COLUMNS FROM PlanFeatures LIKE 'created_at'"
    },
    {
      label: "Tambahkan kolom 'created_at' di tabel Mosque",
      sql: "ALTER TABLE Mosque ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP",
      checkSql: "SHOW COLUMNS FROM Mosque LIKE 'created_at'"
    }
  ];

  for (const task of tasks) {
    try {
      console.log(`\n⏳ ${task.label}...`);
      
      // Check if column already exists
      const check = await prisma.$queryRawUnsafe(task.checkSql);
      
      if (check && check.length > 0) {
        console.log(`✅ Kolom sudah tersedia.`);
      } else {
        await prisma.$executeRawUnsafe(task.sql);
        console.log(`✅ Berhasil ditambahkan.`);
      }
    } catch (err) {
      console.error(`❌ Gagal: ${err.message}`);
    }
  }

  console.log("\n=== ✅ SINKRONISASI SELESAI ===");
  process.exit(0);
}

main();
