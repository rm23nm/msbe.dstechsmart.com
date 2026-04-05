const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.planFeatures.findMany();
  console.log("\n=== PlanFeatures details ===\n");
  plans.forEach(p => {
    console.log(`Plan: ${p.plan}`);
    console.log(`Desc: ${p.description}`);
    console.log(`Price: ${p.price}`);
    console.log(`Original: ${p.original_price}`);
    console.log(`Features length: ${p.features.length}`);
    console.log("------------------------");
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
