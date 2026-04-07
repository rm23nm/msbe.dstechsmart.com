const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== ⚙️ PERBAIKAN DATABASE TAHAP 2 (CASE-SENSITIVE FIX) ===");
  
  const tasks = [
    // Donation Table
    { tables: ["Donation", "donation"], sql: "ADD COLUMN user_phone VARCHAR(255) NULL" },
    { tables: ["Donation", "donation"], sql: "ADD COLUMN address TEXT NULL" },
    { tables: ["Donation", "donation"], sql: "ADD COLUMN categories VARCHAR(255) DEFAULT '[]'" },
    { tables: ["Donation", "donation"], sql: "ADD COLUMN phone VARCHAR(255) NULL" },
    { tables: ["Donation", "donation"], sql: "ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP" },
    
    // License Table
    { tables: ["License", "license"], sql: "ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP" },
    { tables: ["License", "license"], sql: "ADD COLUMN status VARCHAR(255) DEFAULT 'active'" },
    
    // Voucher Table
    { tables: ["Voucher", "voucher"], sql: "ADD COLUMN is_active BOOLEAN DEFAULT TRUE" },
    { tables: ["Voucher", "voucher"], sql: "ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP" },
    
    // RolePermission Table
    { tables: ["RolePermission", "rolepermission", "role_permission"], sql: "ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP" }
  ];

  for (const task of tasks) {
    for (const tableName of task.tables) {
       try {
         const query = `ALTER TABLE ${tableName} ${task.sql}`;
         await prisma.$executeRawUnsafe(query);
         console.log(`✅ BERHASIL: ${tableName} -> ${task.sql.substring(0, 20)}...`);
         break; // Jika sudah berhasil satu (huruf besar/kecil), lanjut ke kolom berikutnya
       } catch (err) {
         if (err.message.includes("Duplicate column name")) {
           console.log(`ℹ️ SKIP: ${tableName} sudah punya kolom ini.`);
           break;
         }
         // Jika error "Doesn't exist", biarkan lanjut ke loop nama tabel berikutnya
       }
    }
  }

  console.log("\n=== ✅ PERBAIKAN TAHAP 2 (SEMUA VERSI) SELESAI ===");
  process.exit(0);
}

main();
