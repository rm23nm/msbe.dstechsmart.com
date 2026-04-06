const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function updateFeatures() {
  console.log("Updating Plan Features with Zakat Center...");
  
  const plans = await prisma.planFeatures.findMany();
  
  for (const p of plans) {
    let features = JSON.parse(p.features || "[]");
    
    // Monthly & Above get Zakat Center
    if (p.plan !== 'trial') {
      if (!features.includes("Manajemen Zakat")) {
        features.push("Manajemen Zakat");
      }
    }

    await prisma.planFeatures.update({
      where: { id: p.id },
      data: { features: JSON.stringify(features) }
    });
  }

  console.log("✅ Zakat Center is now a Premium Feature!");
}

updateFeatures()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
