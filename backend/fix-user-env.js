require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetUser() {
  const email = "rm23n@ymail.com";
  const pass = "Mamacantik@"; 
  const hash = await bcrypt.hash(pass, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "superadmin", password: hash },
    create: { email, password: hash, full_name: "Admin Utama", role: "superadmin" }
  });

  console.log(`\nPassword diupdate ke Mamacantik@!`);
  console.log(`DB URL: ${process.env.DATABASE_URL}`);
  console.log(`Email: ${user.email}`);
}

resetUser().finally(() => prisma.$disconnect());
