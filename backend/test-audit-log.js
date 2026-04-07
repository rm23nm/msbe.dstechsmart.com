const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const logActivity = async (userId, userName, mosqueId, action, entity, entityId, description) => {
  const terminalPrefix = mosqueId ? `\x1b[33m[AUDIT - MS:${mosqueId}]\x1b[0m` : `\x1b[35m[AUDIT - SYSTEM]\x1b[0m`;
  console.log(`${terminalPrefix} ${action} on ${entity} by ${userName || 'System'}: ${description}`);
};

async function test() {
  console.log("Testing Audit Log terminal visibility...");
  await logActivity("user123", "Tester Admin", "m123", "ADD", "Jamaah", "j456", "Menambahkan jamaah baru untuk pengetesan.");
  await logActivity("user123", "Superadmin", null, "SYSTEM_ADD", "Mosque", "m999", "Registrasi sistem masjid baru.");
  console.log("Test finished.");
}

test();
