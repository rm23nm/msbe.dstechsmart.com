const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runSurgery() {
  console.log("=== 🏥 DATABASE SURGERY: ROLE & AUDIT LOG SYNC ===");

  try {
    // 1. Check AuditLog Columns
    console.log("\n[1/3] Syncing AuditLog Table...");
    const auditCols = await prisma.$queryRawUnsafe("DESCRIBE AuditLog");
    const auditFields = auditCols.map(c => c.Field);

    if (!auditFields.includes("mosque_id")) {
      console.log("Adding mosque_id to AuditLog...");
      await prisma.$executeRawUnsafe("ALTER TABLE AuditLog ADD COLUMN mosque_id VARCHAR(255) NULL AFTER id");
    }
    
    if (!auditFields.includes("user_name")) {
      console.log("Adding user_name to AuditLog...");
      await prisma.$executeRawUnsafe("ALTER TABLE AuditLog ADD COLUMN user_name VARCHAR(255) NULL AFTER user_id");
    }

    if (!auditFields.includes("description")) {
       console.log("Adding description to AuditLog...");
       await prisma.$executeRawUnsafe("ALTER TABLE AuditLog ADD COLUMN description TEXT NULL AFTER entity_id");
       
       if (auditFields.includes("details")) {
         console.log("Migrating AuditLog data: details -> description...");
         await prisma.$executeRawUnsafe("UPDATE AuditLog SET description = details WHERE description IS NULL");
       }
    }

    // 2. Check RolePermission Columns
    console.log("\n[2/3] Syncing RolePermission Table...");
    const roleCols = await prisma.$queryRawUnsafe("DESCRIBE RolePermission");
    const roleFields = roleCols.map(c => c.Field);

    if (!roleFields.includes("permissions")) {
      console.log("Adding permissions (plural) to RolePermission...");
      await prisma.$executeRawUnsafe("ALTER TABLE RolePermission ADD COLUMN permissions TEXT NULL");
      
      if (roleFields.includes("permission")) {
        console.log("Migrating RolePermission data: permission (singular) -> permissions (plural)...");
        await prisma.$executeRawUnsafe("UPDATE RolePermission SET permissions = permission WHERE permissions IS NULL");
      }
    }

    // 3. Ensuring Default Data
    console.log("\n[3/3] Finalizing Data Integrity...");
    const roles = await prisma.rolePermission.count();
    console.log(`Current Role Entries: ${roles}`);

    console.log("\n✅ SURGERY COMPLETE!");

  } catch (err) {
    console.error("\n❌ SURGERY FAILED:", err.message);
    if (err.code === 'P2010') {
      console.error("Raw SQL Error. Check DB permissions or exact syntax (MySQL assumed).");
    }
  } finally {
    await prisma.$disconnect();
  }
}

runSurgery();
