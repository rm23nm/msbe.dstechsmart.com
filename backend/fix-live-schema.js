const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixLiveSchema() {
  try {
    console.log("=== 🛠️ SINKRONISASI SKEMA DATABASE LIVE ===");

    // 1. Fixing Donation Table
    console.log("\n[Donation] Memeriksa kolom sub_category...");
    const donationCols = await prisma.$queryRaw`DESCRIBE Donation`;
    if (!donationCols.some(c => c.Field === 'sub_category')) {
      console.log("Adding column 'sub_category' to Donation...");
      await prisma.$executeRawUnsafe(`ALTER TABLE Donation ADD COLUMN sub_category VARCHAR(191) NULL;`);
    }

    // 2. Fixing MosqueMember Table
    console.log("\n[MosqueMember] Memeriksa kolom attendance_count, categories, photo_url, whatsapp...");
    const memberCols = await prisma.$queryRaw`DESCRIBE MosqueMember`;
    
    if (!memberCols.some(c => c.Field === 'attendance_count')) {
      console.log("Adding column 'attendance_count' to MosqueMember...");
      await prisma.$executeRawUnsafe(`ALTER TABLE MosqueMember ADD COLUMN attendance_count INT DEFAULT 0;`);
    }

    if (!memberCols.some(c => c.Field === 'categories')) {
      console.log("Adding column 'categories' to MosqueMember...");
      await prisma.$executeRawUnsafe(`ALTER TABLE MosqueMember ADD COLUMN categories VARCHAR(255) DEFAULT '[]';`);
    }

    if (!memberCols.some(c => c.Field === 'photo_url')) {
      console.log("Adding column 'photo_url' to MosqueMember...");
      await prisma.$executeRawUnsafe(`ALTER TABLE MosqueMember ADD COLUMN photo_url VARCHAR(191) NULL;`);
    }

    if (!memberCols.some(c => c.Field === 'whatsapp')) {
      console.log("Adding column 'whatsapp' to MosqueMember...");
      await prisma.$executeRawUnsafe(`ALTER TABLE MosqueMember ADD COLUMN whatsapp VARCHAR(50) NULL;`);
    }

    console.log("\n✅ SEMUA PERUBAHAN SKEMA BERHASIL DITERAPKAN!");

  } catch (err) {
    console.error("\n❌ GAGAL SINKRONISASI:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixLiveSchema();
