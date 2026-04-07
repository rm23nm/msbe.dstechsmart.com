const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Add tv_background_url if not exists
    await prisma.$executeRawUnsafe('ALTER TABLE Mosque ADD COLUMN IF NOT EXISTS tv_background_url VARCHAR(500)');
    console.log("SUCCESS: tv_background_url added to Mosque table.");
  } catch (err) {
    if (err.message.includes("Duplicate column name")) {
      console.log("INFO: tv_background_url already exists.");
    } else {
      console.error("ERROR:", err.message);
    }
  }
}

main().finally(() => prisma.$disconnect());
