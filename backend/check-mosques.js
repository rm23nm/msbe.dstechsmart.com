const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const mosques = await prisma.mosque.findMany({
    select: { id: true, name: true, slug: true }
  });
  console.log('--- DAFTAR MASJID DI DATABASE ---');
  console.log(JSON.stringify(mosques, null, 2));
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
