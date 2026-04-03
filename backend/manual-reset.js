const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function manualReset(email, newPassword) {
  if (!email || !newPassword) {
    console.log('Usage: node manual-reset.js <email> <newPassword>');
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error(`❌ User with email ${email} not found.`);
      return;
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hash, 
        reset_password_token: null, 
        reset_password_expires: null,
        two_factor_enabled: false // Reset 2FA too just in case they are locked out
      }
    });

    console.log(`✅ Password for ${email} has been reset successfully.`);
    console.log(`✅ 2FA has been disabled for this user (if it was enabled).`);
  } catch (error) {
    console.error(`❌ Error reset password:`, error.message);
  } finally {
    await prisma.$disconnect();
  }
}

const args = process.argv.slice(2);
manualReset(args[0], args[1]);
