const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== 🏗️ MEMBUAT TABEL SISA (FINAL) ===");
  
  const queries = [
    // Asset & Maintenance
    "CREATE TABLE IF NOT EXISTS Asset (id VARCHAR(255) PRIMARY KEY, mosque_id VARCHAR(255), name VARCHAR(255), category VARCHAR(255), condition VARCHAR(255), status VARCHAR(255) DEFAULT 'aktif', location TEXT, description TEXT, photo_url VARCHAR(255), acquisition_date VARCHAR(255), acquisition_value FLOAT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS AssetMaintenance (id VARCHAR(255) PRIMARY KEY, asset_id VARCHAR(255), date VARCHAR(255), cost FLOAT, description TEXT, performed_by VARCHAR(255), createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)",

    // Qurban
    "CREATE TABLE IF NOT EXISTS QurbanAnimal (id VARCHAR(255) PRIMARY KEY, mosque_id VARCHAR(255), type VARCHAR(255), weight FLOAT, price FLOAT, status VARCHAR(255) DEFAULT 'available', createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)",
    "CREATE TABLE IF NOT EXISTS QurbanParticipant (id VARCHAR(255) PRIMARY KEY, animal_id VARCHAR(255), name VARCHAR(255), phone VARCHAR(255), address TEXT, type VARCHAR(255), price FLOAT, is_paid BOOLEAN DEFAULT FALSE, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)",

    // Aid Distribution
    "CREATE TABLE IF NOT EXISTS AidDistribution (id VARCHAR(255) PRIMARY KEY, mosque_id VARCHAR(255), mustahik_id VARCHAR(255), date VARCHAR(255), amount FLOAT, description TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)",

    // Attendance
    "CREATE TABLE IF NOT EXISTS Attendance (id VARCHAR(255) PRIMARY KEY, mosque_id VARCHAR(255), event_name VARCHAR(255), member_id VARCHAR(255), date DATETIME DEFAULT CURRENT_TIMESTAMP, status VARCHAR(255))"
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

  console.log("\n=== ✅ SEMUA TABEL SEKARANG SUDAH KOMPLIT ===");
  process.exit(0);
}

main();
