
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testSave() {
  console.log("--- TESTING ROLE SAVE ---");
  const role_name = "admin_masjid";
  const mId = null; // Global role
  const permissions = JSON.stringify({ dashboard: { view: true, edit: false, delete: false } });

  try {
    const search = { role_name: role_name, mosque_id: mId };
    console.log("Searching for:", search);
    
    const existing = await prisma.rolePermission.findFirst({ where: search });
    console.log("Existing record found:", existing ? existing.id : "NONE");

    let result;
    if (existing) {
      console.log("Updating existing record...");
      result = await prisma.rolePermission.update({
        where: { id: existing.id },
        data: { permissions: permissions }
      });
    } else {
      console.log("Creating new record...");
      result = await prisma.rolePermission.create({
        data: { role_name, mosque_id: mId, permissions }
      });
    }
    
    console.log("SUCCESS! Saved ID:", result.id);
    console.log("Permissions saved:", result.permissions);

    // Verify
    const verify = await prisma.rolePermission.findUnique({ where: { id: result.id } });
    console.log("VERIFICATION - Current DB Value:", verify.permissions);
    
  } catch (error) {
    console.error("FAILURE:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testSave();
