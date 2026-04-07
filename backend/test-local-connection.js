const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log("Testing connection to database...");
    const users = await prisma.user.findMany({
      take: 5,
      select: { email: true, role: true, full_name: true }
    });
    console.log("Connection successful! Found users:");
    console.log(users);
  } catch (err) {
    console.error("Connection failed:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
