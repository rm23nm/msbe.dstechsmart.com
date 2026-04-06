const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createElitePlan() {
  console.log("Creating/Updating Elite Sultan Plan...");
  
  // Base features from Yearly
  const yearly = await prisma.planFeatures.findUnique({ where: { plan: 'yearly' } });
  let eliteFeatures = JSON.parse(yearly?.features || "[]");
  
  // Add Elite-specific features
  if (!eliteFeatures.includes("White Label (Branding Sendiri)")) {
    eliteFeatures.push("White Label (Branding Sendiri)");
  }

  // Create or Update Elite Plan
  await prisma.planFeatures.upsert({
    where: { plan: 'elite' },
    update: {
      name: "Elite Sultan",
      price: 1999000,
      original_price: 2500000,
      description: "Solusi branding eksklusif untuk masjid ikonik",
      features: JSON.stringify(eliteFeatures),
      is_popular: false
    },
    create: {
      plan: 'elite',
      name: "Elite Sultan",
      price: 1999000,
      original_price: 2500000,
      description: "Solusi branding eksklusif untuk masjid ikonik",
      features: JSON.stringify(eliteFeatures),
      is_popular: false
    }
  });

  console.log("✅ Elite Sultan Plan is LIVE in Database!");
}

createElitePlan()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
