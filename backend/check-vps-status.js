const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const fs = require("fs");
const path = require("path");

async function diagnose() {
  console.log("\n==============================================");
  console.log("   🔍 MASJIDKU SMART - VPS DIAGNOSTIC TOOL");
  console.log("==============================================\n");

  let healthy = true;

  // 1. Check Node Environment
  console.log("📦 [1/4] Checking Node.js Environment...");
  console.log(`- Node Version: ${process.version}`);
  console.log(`- Platform: ${process.platform}`);
  console.log(`- CWD: ${process.cwd()}`);
  
  const envPath = path.join(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    console.log("✅ .env file found.");
  } else {
    console.error("❌ .env file NOT FOUND in backend directory!");
    healthy = false;
  }

  // 2. Check Database Connectivity
  console.log("\n🗄️ [2/4] Testing Database Connection (Prisma)...");
  try {
    const start = Date.now();
    await prisma.$connect();
    const end = Date.now();
    console.log(`✅ Connection SUCCESSFUL in ${end - start}ms.`);
    
    // Test simple query
    const userCount = await prisma.user.count();
    console.log(`✅ Database is readable. (User Count: ${userCount})`);
  } catch (err) {
    console.error("❌ CONNECTION FAILED!");
    console.error("Error Detail:", err.message);
    if (err.message.includes("Can't reach database server")) {
      console.log("\n💡 TIP: Check if your MySQL server is running and firewall allows port 3306.");
    }
    healthy = false;
  }

  // 3. Check Schema Sync
  if (healthy) {
    console.log("\n📜 [3/4] Checking Schema Synchronization...");
    try {
      // Try to find a field that was recently added
      const mosque = await prisma.mosque.findFirst();
      if (mosque && 'created_at' in mosque) {
        console.log("✅ Schema: 'created_at' column exists in Mosque table.");
      } else if (mosque) {
        console.warn("⚠️ Schema: 'created_at' NOT FOUND! You may need to run 'npx prisma db push'.");
      }
    } catch (err) {
      console.error("❌ Schema mismatch detected:", err.message);
      healthy = false;
    }
  }

  // 4. Port Check (Self)
  console.log("\n🚀 [4/4] Final Verdict...");
  if (healthy) {
    console.log("==============================================");
    console.log("   ✅ SYSTEM IS HEALTHY AND READY TO LIVE!");
    console.log("==============================================");
  } else {
    console.log("==============================================");
    console.log("   ❌ ISSUES DETECTED! PLEASE FIX ABOVE ERRORS.");
    console.log("==============================================");
  }

  await prisma.$disconnect();
}

diagnose();
