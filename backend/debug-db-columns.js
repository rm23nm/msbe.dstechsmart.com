const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugDbColumns() {
  try {
    console.log("=== 🔍 SYNC CHECK: SCHEMA vs ACTUAL DB ===");
    
    const tables = ["RolePermission", "AuditLog"];
    
    for (const table of tables) {
      try {
        const columns = await prisma.$queryRawUnsafe(`DESCRIBE ${table}`);
        console.log(`\nTable: ${table}`);
        console.table(columns.map(c => ({ 
          Field: c.Field, 
          Type: c.Type, 
          Null: c.Null 
        })));
      } catch (e) {
        console.error(`\nTable ${table} Error:`, e.message);
      }
    }

  } catch (err) {
    console.error("General Debug Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugDbColumns();
