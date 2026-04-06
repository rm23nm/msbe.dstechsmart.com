const { PrismaClient } = require("@prisma/client");
const path = require("path");

const absolutePath = "file:" + "D:/OneDrive/My Project Aplikasi/Aplikasi Mesjidku Smart/masjidkusmart/backend/prisma/dev.db";
const prisma = new PrismaClient({ datasources: { db: { url: absolutePath } } });

async function main() {
  const users = await prisma.user.count();
  console.log(`\n=== Absolute Path Check ===`);
  console.log(`Path  : ${absolutePath}`);
  console.log(`Users : ${users}`);
  console.log(`===========================\n`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
