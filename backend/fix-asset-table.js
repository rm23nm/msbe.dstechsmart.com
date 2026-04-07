const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== 🏗️ MEMBUAT TABEL ASSET (FINAL) ===");
  
  const q = `
    CREATE TABLE IF NOT EXISTS Asset (
      id VARCHAR(255) PRIMARY KEY,
      mosque_id VARCHAR(255),
      name VARCHAR(255),
      category VARCHAR(255),
      \`condition\` VARCHAR(255),
      status VARCHAR(255) DEFAULT 'aktif',
      location TEXT,
      description TEXT,
      photo_url VARCHAR(255),
      acquisition_date VARCHAR(255),
      acquisition_value FLOAT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await prisma.$executeRawUnsafe(q);
    console.log("✅ BERHASIL MEMBUAT TABEL ASSET");
  } catch (err) {
    console.error("❌ GAGAL:", err.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
