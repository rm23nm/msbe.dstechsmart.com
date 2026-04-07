const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const m = await prisma.mosque.findFirst({ where: { slug: 'at-taqwa-metrovilla' } });
  if (m) {
    console.log("MOSQUE:", m.name);
    console.log("BG_URL:", m.tv_background_url);
  } else {
    console.log("NOT FOUND");
  }
}

main().finally(() => prisma.$disconnect());
