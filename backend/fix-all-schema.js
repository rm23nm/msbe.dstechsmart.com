const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  try {
    console.log("=== Fix License Table ===");
    // Adding 'key' column to License
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE License ADD COLUMN `key` VARCHAR(255) UNIQUE');
      console.log("✅ Column License.key added successfully.");
    } catch (e) {
      console.log("Note License.key:", e.message);
    }

    // Ensure 'createdAt' in AuditLog
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE AuditLog ADD COLUMN createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)');
      console.log("✅ Column AuditLog.createdAt checked.");
    } catch (e) {
      console.log("Note AuditLog.createdAt:", e.message);
    }
    
    console.log("=== DB FIX COMPLETE ===");
  } finally {
    await prisma.$disconnect();
  }
}

fix();
