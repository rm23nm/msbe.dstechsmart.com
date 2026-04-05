const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const telegramSettings = await prisma.telegramSettings.findMany();
  console.log(`\n=== Telegram Settings Check ===`);
  console.log(`Count : ${telegramSettings.length}`);
  telegramSettings.forEach(s => {
    console.log(`- Mosque: ${s.mosque_id}`);
    console.log(`  Bot   : ${s.bot_token ? s.bot_token.slice(0, 10) + '...' : 'none'}`);
    console.log(`  Active: ${s.bot_enabled}`);
  });
  console.log(`==============================\n`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
