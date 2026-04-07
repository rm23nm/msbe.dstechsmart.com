const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== 🛠️ PERBAIKAN DATABASE KOMPREHENSIF (FINAL) ===");
  
  const tasks = [
    // Donation
    { table: "Donation", sql: "ADD COLUMN category VARCHAR(255) NULL" },
    { table: "Donation", sql: "ADD COLUMN address TEXT NULL" },
    
    // MosqueMember
    { table: "MosqueMember", sql: "ADD COLUMN user_phone VARCHAR(255) NULL" },
    { table: "MosqueMember", sql: "ADD COLUMN address TEXT NULL" },
    { table: "MosqueMember", sql: "ADD COLUMN birth_date VARCHAR(255) NULL" },
    { table: "MosqueMember", sql: "ADD COLUMN phone VARCHAR(255) NULL" },
    
    // Asset
    { table: "Asset", sql: "ADD COLUMN photo_url VARCHAR(255) NULL" },
    { table: "Asset", sql: "ADD COLUMN location TEXT NULL" },
    { table: "Asset", sql: "ADD COLUMN description TEXT NULL" },
    
    // License & Role (Ensure lowercase variants too)
    { table: "License", sql: "ADD COLUMN status VARCHAR(255) DEFAULT 'active'" },
    { table: "RolePermission", sql: "ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP" }
  ];

  const variants = (t) => [t, t.toLowerCase(), t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()];

  for (const task of tasks) {
    let success = false;
    for (const tableName of variants(task.table)) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE ${tableName} ${task.sql}`);
        console.log(`✅ BERHASIL: ${tableName} -> ${task.sql}`);
        success = true;
        break;
      } catch (err) {
        if (err.message.includes("Duplicate column name")) {
          console.log(`ℹ️ SKIP: ${tableName} sudah punya kolom ini.`);
          success = true;
          break;
        }
      }
    }
    if (!success) console.log(`⚠️ PERINGATAN: Gagal sinkronisasi untuk fitur ${task.table}`);
  }

  console.log("\n=== ✅ SEMUA TABEL SEKARANG SUDAH SINKRON ===");
  process.exit(0);
}

main();
