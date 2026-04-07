const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRolesSave() {
  const roleName = "test_role_" + Date.now();
  const permissions = { test: true };
  const mosqueId = null;

  try {
    console.log("Testing Save for:", roleName);
    
    // Logic from server.js
    const existing = await prisma.rolePermission.findFirst({
      where: {
        role_name: roleName,
        mosque_id: mosqueId
      }
    });

    const permissionsData = JSON.stringify(permissions);

    let result;
    if (existing) {
      result = await prisma.rolePermission.update({
        where: { id: existing.id },
        data: { permissions: permissionsData }
      });
    } else {
      result = await prisma.rolePermission.create({
        data: {
          role_name: roleName,
          mosque_id: mosqueId,
          permissions: permissionsData
        }
      });
    }

    console.log("Save Success. ID:", result.id);
    
    // Test Update
    console.log("Testing Update for ID:", result.id);
    const updatedPermissions = { test: false, updated: true };
    const updatedResult = await prisma.rolePermission.update({
      where: { id: result.id },
      data: { permissions: JSON.stringify(updatedPermissions) }
    });
    
    console.log("Update Success. New Permissions:", updatedResult.permissions);

  } catch (e) {
    console.error("Save Failed:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

testRolesSave();
