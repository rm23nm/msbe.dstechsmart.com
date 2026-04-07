const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function list() {
  try {
    const rawTables = await prisma.$queryRawUnsafe('SHOW TABLES');
    console.log("=== 📜 DAFTAR TABEL DI VPS ===");
    console.log(JSON.stringify(rawTables, null, 2));
  } catch (e) {
    console.error("❌ EROR:", e.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

list();
