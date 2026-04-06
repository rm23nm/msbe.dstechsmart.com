const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.planFeatures.findMany();
  console.log("\n=== PlanFeatures details ===\n");
  plans.forEach(p => {
    console.log(`Plan: ${p.plan}`);
    console.log(`Desc: ${p.description}`);
    console.log(`Price: ${p.price}`);
    try {
      const features = JSON.parse(p.features);
      console.log(`Features (${features.length}):`, features.join(", "));
    } catch (e) {
      console.log("Features (raw):", p.features);
    }
    console.log("------------------------");
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
