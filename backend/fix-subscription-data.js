const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixNullDates() {
  try {
    const mosques = await prisma.mosque.findMany({
      where: {
        OR: [
          { subscription_end: null },
          { subscription_plan: null }
        ]
      }
    });

    console.log(`Found ${mosques.length} mosques to fix.`);

    for (const m of mosques) {
      const trialEnd = new Date(m.created_at || new Date());
      trialEnd.setDate(trialEnd.getDate() + 30);
      
      await prisma.mosque.update({
        where: { id: m.id },
        data: {
          subscription_plan: m.subscription_plan || 'Trial (Free)',
          subscription_end: trialEnd.toISOString()
        }
      });
      console.log(`- Fixed: ${m.name} -> Expiry: ${trialEnd.toISOString().split('T')[0]}`);
    }
    
    console.log("[SUCCESS] Database cleanup completed.");
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

fixNullDates();
