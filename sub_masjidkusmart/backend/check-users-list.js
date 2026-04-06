const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

// Manually resolve the path from the script's location (one level down from root if we're in backend/)
// But we'll just use the environment variable if set.
const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL || "file:./prisma/dev.db" }
  }
});

async function main() {
  const users = await prisma.user.findMany({ select: { email: true, role: true } });
  console.log(`\n=== USERS LIST ===`);
  users.forEach(u => console.log(`- ${u.email} (${u.role})`));
  console.log(`==================\n`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
