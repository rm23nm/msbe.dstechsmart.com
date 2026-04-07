const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  try {
    console.log("=== Fix AuditLog Table ===");
    await prisma.$executeRawUnsafe('ALTER TABLE AuditLog ADD COLUMN IF NOT EXISTS createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)');
    console.log("✅ Column AuditLog.createdAt added successfully (or already exists)");
  } catch (err) {
    console.log("Note: ALTER TABLE error:", err.message);
    // If IF NOT EXISTS is not supported by this MySQL version, we try without it
    try {
        await prisma.$executeRawUnsafe('ALTER TABLE AuditLog ADD COLUMN createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)');
        console.log("✅ Column AuditLog.createdAt added successfully.");
    } catch (e2) {
        console.log("Notice: " + e2.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

fix();
