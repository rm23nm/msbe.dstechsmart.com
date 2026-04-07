const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function testInviteLogic() {
  console.log("=== DRY RUN: INVITE LOGIC ===");
  const email = "test_pengurus_" + Math.floor(Math.random()*1000) + "@masjid.com";
  const role = "pengurus";
  const mosque_id = "a46b4d7c-5e05-45fb-9e23-99fd16983700"; // Existing mosque from check-db

  try {
    const cleanEmail = email.toLowerCase().trim();
    const tempPassword = "password123";
    const hash = await bcrypt.hash(tempPassword, 10);

    console.log(`Step 1: Upsert User ${cleanEmail}`);
    const user = await prisma.user.upsert({
      where: { email: cleanEmail },
      update: { role },
      create: {
        email: cleanEmail,
        password: hash,
        role,
        full_name: cleanEmail.split('@')[0],
        current_mosque_id: mosque_id
      }
    });
    console.log("User Created/Updated:", user.id);

    console.log(`Step 2: Linking MosqueMember for ${mosque_id}`);
    const existing = await prisma.mosqueMember.findFirst({
        where: { user_email: cleanEmail, mosque_id }
    });

    let member;
    if (existing) {
        member = await prisma.mosqueMember.update({
            where: { id: existing.id },
            data: { role, status: "active" }
        });
    } else {
        member = await prisma.mosqueMember.create({
            data: {
                user_email: cleanEmail,
                user_name: cleanEmail.split('@')[0],
                mosque_id,
                role,
                status: "active"
            }
        });
    }
    console.log("Member Created/Updated:", member.id);

    console.log("=== TEST COMPLETED SUCCESSFULLY ===");
  } catch (err) {
    console.error("DRY RUN FAILED:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testInviteLogic();
