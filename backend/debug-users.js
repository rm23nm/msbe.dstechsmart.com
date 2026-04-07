const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log("=== USER TABLE COLUMNS ===");
    const columns = await prisma.$queryRaw`DESCRIBE User`;
    console.log(JSON.stringify(columns, null, 2));

    console.log("\n=== RECENT USERS & ROLES ===");
    const users = await prisma.user.findMany({
      take: 10,
      orderBy: { id: 'desc' },
      select: { id: true, email: true, role: true, current_mosque_id: true }
    });
    console.log(JSON.stringify(users, null, 2));

    console.log("\n=== ROLE COUNTS ===");
    const counts = await prisma.user.groupBy({
        by: ['role'],
        _count: { id: true }
    });
    console.log(JSON.stringify(counts, null, 2));

  } catch (err) {
    console.error("Check failed:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
