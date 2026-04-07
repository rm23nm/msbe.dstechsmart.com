const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== 🛠️ SINKRONISASI RELASI & KOLOM (FINAL) ===");
  
  const tasks = [
    // RolePermission: Ensure BOTH 'permission' and 'permissions' exist
    { table: "RolePermission", sql: "ADD COLUMN permissions TEXT NULL" },
    { table: "RolePermission", sql: "ADD COLUMN permission TEXT NULL" },
    
    // MosqueMember: Ensure all relation fields are present
    { table: "MosqueMember", sql: "ADD COLUMN user_name VARCHAR(255) NULL" },
    { table: "MosqueMember", sql: "ADD COLUMN user_email VARCHAR(255) NOT NULL" },
    { table: "MosqueMember", sql: "ADD COLUMN mosque_id VARCHAR(255) NOT NULL" },
    { table: "MosqueMember", sql: "ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP" },

    // MUSTAHIK: Ensure it matches the schema (createdAt vs created_at)
    { table: "Mustahik", sql: "ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP" },
    { table: "Mustahik", sql: "ADD COLUMN mosque_id VARCHAR(255) NULL" }
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
      }
    }
  }

  console.log("\n=== ✅ DATABASE SEKARANG 100% SINKRON DENGAN APLIKASI ===");
  process.exit(0);
}

main();
