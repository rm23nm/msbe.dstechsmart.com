const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMosqueSchema() {
  try {
    const columns = await prisma.$queryRawUnsafe(`DESCRIBE Mosque`);
    const fields = columns.map(c => c.Field);
    console.log("Fields:", fields);
    console.log("Has slug?", fields.includes("slug"));
    console.log("Has custom_link?", fields.includes("custom_link"));
    console.log("Has username?", fields.includes("username"));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkMosqueSchema();
