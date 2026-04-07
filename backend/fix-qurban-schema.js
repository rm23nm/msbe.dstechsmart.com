const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixQurbanSchema() {
  try {
    console.log("=== 🐂 SINKRONISASI SKEMA QURBAN LIVE ===");

    // 1. Fixing QurbanAnimal Table
    console.log("\n[QurbanAnimal] Memeriksa kolom weight_approx, total_slots, notes...");
    const animalCols = await prisma.$queryRaw`DESCRIBE QurbanAnimal`;
    
    if (!animalCols.some(c => c.Field === 'weight_approx')) {
      console.log("Adding column 'weight_approx' to QurbanAnimal...");
      await prisma.$executeRawUnsafe(`ALTER TABLE QurbanAnimal ADD COLUMN weight_approx VARCHAR(255) NULL;`);
    }

    if (!animalCols.some(c => c.Field === 'total_slots')) {
      console.log("Adding column 'total_slots' to QurbanAnimal...");
      await prisma.$executeRawUnsafe(`ALTER TABLE QurbanAnimal ADD COLUMN total_slots INT DEFAULT 1;`);
    }

    if (!animalCols.some(c => c.Field === 'notes')) {
      console.log("Adding column 'notes' to QurbanAnimal...");
      await prisma.$executeRawUnsafe(`ALTER TABLE QurbanAnimal ADD COLUMN notes TEXT NULL;`);
    }

    // 2. Fixing QurbanParticipant Table
    console.log("\n[QurbanParticipant] Memeriksa kolom payment_status, amount_paid...");
    const participantCols = await prisma.$queryRaw`DESCRIBE QurbanParticipant`;
    
    if (!participantCols.some(c => c.Field === 'payment_status')) {
      console.log("Adding column 'payment_status' to QurbanParticipant...");
      await prisma.$executeRawUnsafe(`ALTER TABLE QurbanParticipant ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending';`);
    }

    if (!participantCols.some(c => c.Field === 'amount_paid')) {
      console.log("Adding column 'amount_paid' to QurbanParticipant...");
      await prisma.$executeRawUnsafe(`ALTER TABLE QurbanParticipant ADD COLUMN amount_paid FLOAT DEFAULT 0;`);
    }

    console.log("\n✅ SKEMA QURBAN BERHASIL DISINKRONISASI!");

  } catch (err) {
    console.error("\n❌ GAGAL SINKRONISASI QURBAN:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixQurbanSchema();
