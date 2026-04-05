const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const mosques = await prisma.mosque.findMany({ select: { name: true, created_at: true } });
  console.log(`\n=== MOSQUE DATES ===`);
  mosques.forEach(m => console.log(`- ${m.name} (Created: ${m.created_at})`));
  console.log(`====================\n`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
