const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== 🏗️ MEMBUAT TABEL YANG HILANG DI VPS ===");
  
  const queries = [
    // RolePermission
    "CREATE TABLE IF NOT EXISTS RolePermission (id VARCHAR(255) PRIMARY KEY, role_name VARCHAR(255), permission VARCHAR(255), mosque_id VARCHAR(255), created_at DATETIME DEFAULT CURRENT_TIMESTAMP)",
    
    // License
    "CREATE TABLE IF NOT EXISTS License (id VARCHAR(255) PRIMARY KEY, mosque_id VARCHAR(255), plan_id VARCHAR(255), start_date DATETIME, end_date DATETIME, status VARCHAR(255) DEFAULT 'active', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)",
    
    // Voucher
    "CREATE TABLE IF NOT EXISTS Voucher (id VARCHAR(255) PRIMARY KEY, code VARCHAR(255) UNIQUE, discount_type VARCHAR(255), discount_value FLOAT, is_active BOOLEAN DEFAULT TRUE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)",
    
    // AuditLog
    "CREATE TABLE IF NOT EXISTS AuditLog (id VARCHAR(255) PRIMARY KEY, user_id VARCHAR(255), action VARCHAR(255), entity VARCHAR(255), entity_id VARCHAR(255), details TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)",

    // Mustahik
    "CREATE TABLE IF NOT EXISTS Mustahik (id VARCHAR(255) PRIMARY KEY, mosque_id VARCHAR(255), name VARCHAR(255), address TEXT, phone VARCHAR(255), asnaf_category VARCHAR(255), status VARCHAR(255) DEFAULT 'pending', notes TEXT, photo_url VARCHAR(255), last_aid_date VARCHAR(255), createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)"
  ];

  for (const q of queries) {
    try {
      console.log(`\n⏳ Menjalankan: ${q.substring(0, 50)}...`);
      await prisma.$executeRawUnsafe(q);
      console.log(`✅ BERHASIL.`);
    } catch (err) {
      console.error(`❌ GAGAL: ${err.message}`);
    }
  }

  console.log("\n=== ✅ SEMUA TABEL BERHASIL DIPERIKSA/DIBUAT ===");
  process.exit(0);
}

main();
