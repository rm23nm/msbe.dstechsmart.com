const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function resetPassword() {
  const email = "dkmattaqwacilegon@gmail.com";
  const newPassword = "admin123456";
  const hash = await bcrypt.hash(newPassword, 10);

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { password: hash }
    });
    console.log(`[SUCCESS] Password for ${email} reset to: ${newPassword}`);
  } catch (err) {
    console.error("[ERROR] Failed to reset password:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
