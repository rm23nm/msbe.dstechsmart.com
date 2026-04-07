const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSlugs() {
  try {
    const mosques = await prisma.mosque.findMany({ select: { name: true, slug: true } });
    console.table(mosques);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkSlugs();
