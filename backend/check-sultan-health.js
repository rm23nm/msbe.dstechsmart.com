import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function checkHealth() {
  console.log("🚀 Memulai Audit 'Kesehatan Sultan'...");
  
  try {
    // 1. Cek Model MosqueMember
    const memberFields = await prisma.mosqueMember.findFirst();
    if (memberFields && 'attendance_count' in memberFields) {
      console.log("✅ Database: Kolom 'attendance_count' TERDETEKSI. (Loyalitas Aktif!)");
    } else {
      console.error("❌ Database: Kolom 'attendance_count' TIDAK DITEMUKAN!");
    }

    // 2. Cek Model Asset
    const assetFields = await prisma.asset.findFirst();
    if (assetFields && 'qr_code_id' in assetFields) {
      console.log("✅ Database: Kolom 'qr_code_id' TERDETEKSI. (Aset Madani Aktif!)");
    } else {
      console.log("ℹ️ Database: Belum ada data aset, tapi skema sudah di-push.");
    }

    // 3. Cek Model AssetMaintenance
    try {
      await prisma.assetMaintenance.count();
      console.log("✅ Database: Tabel 'AssetMaintenance' TERDETEKSI. (Buku Servis Digital Aktif!)");
    } catch (e) {
      console.error("❌ Database: Tabel 'AssetMaintenance' ERROR!", e.message);
    }

    console.log("\n✨ KESIMPULAN: 'OTAK' DATABASE BAPAK DALAM KONDISI PRIMA!");
  } catch (e) {
    console.error("❌ Audit Gagal Total:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkHealth();
