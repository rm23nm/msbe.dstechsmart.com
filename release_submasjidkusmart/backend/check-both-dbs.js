const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

async function check(url) {
  process.env.DATABASE_URL = url;
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const userCount = await prisma.user.count();
    const mosqueCount = await prisma.mosque.count();
    console.log(`- Path   : ${url}`);
    console.log(`  Users  : ${userCount}`);
    console.log(`  Mosques: ${mosqueCount}`);
  } catch (e) {
    console.log(`- Path   : ${url} (Error: ${e.message.split('\n')[0]})`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log("\n=== CHECKING ALL DB CANDIDATES ===\n");
  
  const rootDb = "file:" + path.resolve(__dirname, "dev.db");
  const prismaDb = "file:" + path.resolve(__dirname, "prisma/dev.db");
  
  await check(rootDb);
  await check(prismaDb);
  
  console.log("\n==================================\n");
}

main();
