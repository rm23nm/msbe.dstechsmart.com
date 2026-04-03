const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function fixRoles() {
  // Update rm23n@ymail.com to superadmin
  await prisma.user.update({
    where: { email: 'rm23n@ymail.com' },
    data: { role: 'superadmin' }
  });
  console.log('✅ rm23n@ymail.com -> superadmin');

  // Update admin@masjidkusmart.com to superadmin  
  await prisma.user.update({
    where: { email: 'admin@masjidkusmart.com' },
    data: { role: 'superadmin' }
  });
  console.log('✅ admin@masjidkusmart.com -> superadmin');

  // Also ensure there's a mosque_admin test account
  const hash = await bcrypt.hash('Admin@1234', 10);
  
  // Get first mosque for linking
  const mosque = await prisma.mosque.findFirst();
  
  await prisma.user.upsert({
    where: { email: 'pengurus@masjid.com' },
    update: { role: 'mosque_admin', full_name: 'Pengurus Masjid', current_mosque_id: mosque?.id },
    create: { email: 'pengurus@masjid.com', password: hash, role: 'mosque_admin', full_name: 'Pengurus Masjid', current_mosque_id: mosque?.id }
  });
  console.log('✅ pengurus@masjid.com -> mosque_admin (password: Admin@1234)');

  await prisma.user.upsert({
    where: { email: 'jamaah@masjid.com' },
    update: { role: 'user', full_name: 'Jamaah Contoh', current_mosque_id: mosque?.id },
    create: { email: 'jamaah@masjid.com', password: hash, role: 'user', full_name: 'Jamaah Contoh', current_mosque_id: mosque?.id }
  });
  console.log('✅ jamaah@masjid.com -> user jamaah (password: Admin@1234)');

  const finalUsers = await prisma.user.findMany({
    select: { id: true, email: true, role: true, full_name: true }
  });
  console.log('\n=== AKUN FINAL ===');
  finalUsers.forEach(u => console.log(`  ${u.role.padEnd(15)} | ${u.email} | ${u.full_name}`));
}

fixRoles().catch(console.error).finally(() => prisma.$disconnect());
