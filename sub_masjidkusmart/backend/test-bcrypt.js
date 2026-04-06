const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testLogin() {
  const email = "rm23n@ymail.com";
  const passTyped = "Mamacantik@"; 
  
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log("User not found!");
    return;
  }
  
  const isMatch = await bcrypt.compare(passTyped, user.password);
  console.log(`Email: ${email}`);
  console.log(`Password Typed: ${passTyped}`);
  console.log(`Hash in DB: ${user.password}`);
  console.log(`Is Match? ${isMatch}`);
}

testLogin().finally(() => prisma.$disconnect());
