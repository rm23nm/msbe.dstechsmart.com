const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  try {
    console.log("=== COMPREHENSIVE DB FIX ===");
    
    const tables = [
      { table: 'License', column: '`key`', type: 'VARCHAR(255) UNIQUE' },
      { table: 'Voucher', column: 'max_usage', type: 'INT DEFAULT 10' },
      { table: 'Voucher', column: 'current_usage', type: 'INT DEFAULT 0' },
      { table: 'AuditLog', column: 'createdAt', type: 'DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)' },
      { table: 'Mosque', column: 'established_year', type: 'VARCHAR(255)' },
      { table: 'Mosque', column: 'slug', type: 'VARCHAR(255) UNIQUE' }
    ];

    for (const item of tables) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE ${item.table} ADD COLUMN ${item.column} ${item.type}`);
        console.log(`✅ Added ${item.table}.${item.column}`);
      } catch (e) {
        if (e.message.includes('Duplicate column')) {
           console.log(`ℹ️  ${item.table}.${item.column} already exists.`);
        } else {
           console.log(`❌ Error on ${item.table}.${item.column}:`, e.message);
        }
      }
    }
    
    console.log("=== COMPREHENSIVE DB FIX COMPLETE ===");
  } finally {
    await prisma.$disconnect();
  }
}

fix();
