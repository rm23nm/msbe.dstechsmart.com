const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetUser() {
  const email = "rm23n@ymail.com";
  const pass = "12345678"; 
  const hash = await bcrypt.hash(pass, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "superadmin", password: hash },
    create: { email, password: hash, full_name: "Admin Utama", role: "superadmin" }
  });

  console.log(`\nPassword diupdate ke 12345678!`);
  console.log(`Email: ${user.email}`);
  console.log(`Hashed: ${hash}`);
}

resetUser().finally(() => prisma.$disconnect());
