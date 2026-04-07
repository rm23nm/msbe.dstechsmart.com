const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== ⚙️ PERBAIKAN PRESISI KOLOM (FINAL) ===");
  
  const tasks = [
    // Donation: Fix category name
    { table: "Donation", sql: "ADD COLUMN category VARCHAR(255) NULL" },
    
    // MosqueMember: Missing fields
    { table: "MosqueMember", sql: "ADD COLUMN phone VARCHAR(255) NULL" },
    { table: "MosqueMember", sql: "ADD COLUMN address TEXT NULL" },
    { table: "MosqueMember", sql: "ADD COLUMN user_phone VARCHAR(255) NULL" },
    { table: "MosqueMember", sql: "ADD COLUMN birth_date VARCHAR(255) NULL" },
    
    // License: Ensure fields match
    { table: "License", sql: "ADD COLUMN license_key VARCHAR(255) NULL" },
    { table: "License", sql: "ADD COLUMN activation_date DATETIME NULL" },
    
    // Voucher: Ensure fields match
    { table: "Voucher", sql: "ADD COLUMN quota INT DEFAULT 100" },
    { table: "Voucher", sql: "ADD COLUMN used_count INT DEFAULT 0" }
  ];

  const tableVariants = (name) => [name, name.toLowerCase()];

  for (const task of tasks) {
    for (const tableName of tableVariants(task.table)) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE ${tableName} ${task.sql}`);
        console.log(`✅ BERHASIL: ${tableName} -> ${task.sql}`);
        break;
      } catch (err) {
        if (err.message.includes("Duplicate column name")) {
          console.log(`ℹ️ SKIP: ${tableName} sudah punya ${task.sql.substring(11)}`);
          break;
        }
      }
    }
  }

  console.log("\n=== ✅ SEMUA SISTEM SEKARANG HARUSNYA NORMAL ===");
  process.exit(0);
}

main();
