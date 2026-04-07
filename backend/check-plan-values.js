const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPlans() {
  try {
    const plans = await prisma.planFeatures.findMany({ select: { plan: true } });
    console.log("[PlanFeatures] Unique Plans:", [...new Set(plans.map(p => p.plan))]);

    const mosques = await prisma.mosque.findMany({ select: { id: true, name: true, subscription_plan: true, subscription_end: true } });
    console.log("[Mosque] Current Samples:", mosques.slice(0, 5));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlans();
