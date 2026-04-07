const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkQurbanSchema() {
  try {
    console.log("=== CHECKING QURBANANIMAL COLUMNS ===");
    const animal = await prisma.$queryRaw`DESCRIBE QurbanAnimal`;
    console.log(JSON.stringify(animal, null, 2));

    console.log("\n=== CHECKING QURBANPARTICIPANT COLUMNS ===");
    const participant = await prisma.$queryRaw`DESCRIBE QurbanParticipant`;
    console.log(JSON.stringify(participant, null, 2));

    console.log("\n=== CHECKING ROLEPERMISSION TABLE ===");
    const roles = await prisma.rolePermission.findMany();
    console.log(JSON.stringify(roles, null, 2));

  } catch (err) {
    console.error("Research failed:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkQurbanSchema();
