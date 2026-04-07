const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.rolePermission.findMany({
    orderBy: { role_name: 'asc' }
  });
  console.log(JSON.stringify(roles, null, 2));
}

main().finally(() => prisma.$disconnect());
