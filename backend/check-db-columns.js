const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkColumns() {
  try {
    console.log("=== CHECKING DONATION COLUMNS ===");
    const donation = await prisma.$queryRaw`DESCRIBE Donation`;
    console.log(JSON.stringify(donation, null, 2));

    console.log("\n=== CHECKING MOSQUEMEMBER COLUMNS ===");
    const member = await prisma.$queryRaw`DESCRIBE MosqueMember`;
    console.log(JSON.stringify(member, null, 2));

  } catch (err) {
    console.error("Column check failed:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkColumns();
