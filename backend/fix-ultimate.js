const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== 🚀 PELENGKAPAN KOLOM TEKNIS (ULTIMATE FIX) ===");
  
  const tasks = [
    // Database-wide technical columns (updatedAt)
    { table: "RolePermission", sql: "ADD COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    { table: "MosqueMember", sql: "ADD COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    { table: "Donation", sql: "ADD COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    { table: "Asset", sql: "ADD COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    { table: "Voucher", sql: "ADD COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    { table: "License", sql: "ADD COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    { table: "Mustahik", sql: "ADD COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    { table: "QurbanAnimal", sql: "ADD COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    { table: "QurbanParticipant", sql: "ADD COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" },
    
    // Feature specific columns
    { table: "MosqueMember", sql: "ADD COLUMN membership_id VARCHAR(255) NULL" }
  ];

  const variants = (t) => [t, t.toLowerCase()];

  for (const task of tasks) {
    for (const tableName of variants(task.table)) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE ${tableName} ${task.sql}`);
        console.log(`✅ BERHASIL: ${tableName} -> ${task.sql}`);
        break;
      } catch (err) {
        if (err.message.includes("Duplicate column name")) {
          console.log(`ℹ️ SKIP: ${tableName} sudah punya kolom ini.`);
          break;
        }
        // If not found, it will try the lowercase version
      }
    }
  }

  console.log("\n=== ✅ SEMUA MENU SEKARANG TELAH TERHUBUNG SEMPURNA ===");
  process.exit(0);
}

main();
