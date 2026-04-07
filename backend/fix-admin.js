const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function checkSuperAdmin() {
  const users = await prisma.user.findMany({ select: { email: true, role: true } });
  console.log("Current Users:", JSON.stringify(users, null, 2));

  // UPSERT: Pastikan Superadmin ada
  const email = "rm23n@ymail.com";
  const pass = "M4m4cantik@"; // Password default baru
  const hash = await bcrypt.hash(pass, 10);

  await prisma.user.upsert({
    where: { email },
    update: { role: "superadmin", password: hash },
    create: { email, password: hash, full_name: "Super Admin", role: "superadmin" }
  });

  console.log(`\nOK! Superadmin berhasil diamankan.`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${pass}`);
}

checkSuperAdmin().finally(() => prisma.$disconnect());
