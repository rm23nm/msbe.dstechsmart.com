const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function updateFeatures() {
  console.log("Updating Plan Features...");
  
  const plans = await prisma.planFeatures.findMany();
  
  for (const p of plans) {
    let features = JSON.parse(p.features || "[]");
    
    // Add missing features if not exists
    if (p.plan === 'monthly' || p.plan === 'yearly') {
      if (!features.includes("Portofolio Digital")) features.push("Portofolio Digital");
      if (!features.includes("Aset Masjid")) features.push("Aset Masjid");
    }
    
    if (p.plan === 'yearly') {
      if (!features.includes("Domain Kustom")) features.push("Domain Kustom");
    }

    await prisma.planFeatures.update({
      where: { id: p.id },
      data: { features: JSON.stringify(features) }
    });
    console.log(`Updated plan: ${p.plan}`);
  }
}

updateFeatures()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
