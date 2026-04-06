const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function updateFeatures() {
  console.log("Updating Plan Features with Digital Member Card...");
  
  const elite = await prisma.planFeatures.findUnique({ where: { plan: 'elite' } });
  const yearly = await prisma.planFeatures.findUnique({ where: { plan: 'yearly' } });
  
  const addFeature = async (plan, featureName) => {
    let features = JSON.parse(plan.features || "[]");
    if (!features.includes(featureName)) {
      features.push(featureName);
      await prisma.planFeatures.update({
        where: { id: plan.id },
        data: { features: JSON.stringify(features) }
      });
    }
  };

  if (elite) await addFeature(elite, "Kartu Digital Jamaah");
  if (yearly) await addFeature(yearly, "Kartu Digital Jamaah");

  console.log("✅ Digital Member Card is now an EXCLUSIVE Feature!");
}

updateFeatures()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
