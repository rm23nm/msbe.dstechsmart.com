const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function checkAndFixUsers() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, full_name: true }
  });
  console.log('=== EXISTING USERS ===');
  console.log(JSON.stringify(users, null, 2));

  // Check superadmin
  const superadmin = users.find(u => u.role === 'superadmin');
  if (!superadmin) {
    console.log('\n⚠️  No superadmin found! Creating...');
    const hash = await bcrypt.hash('Admin@1234', 10);
    const newAdmin = await prisma.user.upsert({
      where: { email: 'superadmin@masjidku.app' },
      update: { role: 'superadmin', password: hash, full_name: 'Super Admin' },
      create: { email: 'superadmin@masjidku.app', password: hash, role: 'superadmin', full_name: 'Super Admin' }
    });
    console.log('✅ Superadmin created:', newAdmin.email);
  } else {
    console.log('\n✅ Superadmin exists:', superadmin.email);
  }

  const finalUsers = await prisma.user.findMany({
    select: { id: true, email: true, role: true, full_name: true }
  });
  console.log('\n=== FINAL USERS ===');
  console.log(JSON.stringify(finalUsers, null, 2));
}

checkAndFixUsers().catch(console.error).finally(() => prisma.$disconnect());
