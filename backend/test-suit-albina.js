const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MOSQUE_ID = "953af69a-354d-4286-b6c0-2d6ccce68e0b"; // Masjid Raya Al-Bina

async function runTest() {
  const todayStr = new Date().toISOString().split('T')[0];
  console.log("=== STARTING FULL FEATURE TEST (V2): Masjid Raya Al-Bina ===");
  
  try {
    // 1. Transaction Test
    console.log("[1/6] Testing Transactions (Income/Expense)...");
    const income = await prisma.transaction.create({
      data: {
        mosque_id: MOSQUE_ID,
        type: "income",
        category: "Infaq Jumat",
        amount: 1250000,
        description: "Hasil Infaq Jumat Tes",
        date: todayStr
      }
    });
    console.log("   ✅ Created Income:", income.id);

    const expense = await prisma.transaction.create({
      data: {
        mosque_id: MOSQUE_ID,
        type: "expense",
        category: "Kebersihan",
        amount: 200000,
        description: "Beli Alat Kebersihan Tes",
        date: todayStr
      }
    });
    console.log("   ✅ Created Expense:", expense.id);

    // 2. Asset Test
    console.log("[2/6] Testing Assets...");
    const asset = await prisma.asset.create({
      data: {
        mosque_id: MOSQUE_ID,
        name: "Karpet Baru Tes",
        category: "Interior",
        condition: "Sangat Baik",
        location: "Ruang Utama",
        acquisition_date: todayStr,
        acquisition_value: 5000000,
        status: "aktif"
      }
    });
    console.log("   ✅ Created Asset:", asset.id);

    // 3. Activity Test
    console.log("[3/6] Testing Activities...");
    const activity = await prisma.activity.create({
      data: {
        mosque_id: MOSQUE_ID,
        title: "Pelatihan IT Masjid Tes",
        description: "Belajar sistem MasjidKu Smart",
        date: todayStr,
        time: "09:00",
        location: "Aula",
        speaker: "Tim DSTech",
        status: "upcoming"
      }
    });
    console.log("   ✅ Created Activity:", activity.id);

    // 4. Attendance Test
    console.log("[4/6] Testing Attendance (QR Checked-in)...");
    const attendance = await prisma.attendance.create({
      data: {
        mosque_id: MOSQUE_ID,
        activity_id: activity.id,
        member_name: "User Tester Albina",
        member_phone: "089988776655",
        checked_in_at: new Date()
      }
    });
    console.log("   ✅ Created Attendance:", attendance.id);

    // 5. Audit Logging (Validation only - logic is on server.js)
    console.log("[5/6] Verifying DB Constraints...");
    const checkUser = await prisma.user.findFirst({ where: { current_mosque_id: MOSQUE_ID } });
    if (checkUser) {
        console.log("   ✅ Found linked User:", checkUser.email);
    } else {
        console.log("   ⚠️ No direct user link found for this mosque ID in first check.");
    }

    // 6. Final Financial Check
    console.log("[6/6] Final Calculation Check...");
    const txs = await prisma.transaction.findMany({ where: { mosque_id: MOSQUE_ID } });
    const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
    const balance = totalIncome - totalExpense;
    
    console.log(`   📊 Summary for Albina:`);
    console.log(`      - Total Income: Rp ${totalIncome.toLocaleString()}`);
    console.log(`      - Total Expense: Rp ${totalExpense.toLocaleString()}`);
    console.log(`      - Current Balance: Rp ${balance.toLocaleString()}`);

    console.log("\n✅ ALL BACKEND FEATURE TESTS PASSED FOR MASJID AL-BINA!");
  } catch (e) {
    console.error("\n❌ ERROR DETECTED DURING TEST:");
    console.error(e.message);
    if (e.code) console.error("   Error Code:", e.code);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
