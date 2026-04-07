const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testQueries() {
  try {
    console.log("=== TESTING DONATION QUERY ===");
    try {
      const d = await prisma.donation.findMany({ take: 1 });
      console.log("Donation query success!");
    } catch (e) {
      console.error("Donation query failed:", e.message);
    }

    console.log("\n=== TESTING MOSQUEMEMBER QUERY ===");
    try {
      const m = await prisma.mosqueMember.findMany({ take: 1 });
      console.log("MosqueMember query success!");
    } catch (e) {
      console.error("MosqueMember query failed:", e.message);
    }

    console.log("\n=== TESTING PLANFEATURES QUERY ===");
    try {
      const p = await prisma.planFeatures.findMany({ take: 1, orderBy: { created_at: 'asc' } });
      console.log("PlanFeatures query (created_at) success!");
    } catch (e) {
      console.error("PlanFeatures query (created_at) failed:", e.message);
    }

  } catch (err) {
    console.error("Test failed:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

testQueries();
