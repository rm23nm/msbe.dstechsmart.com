const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const transactions = await prisma.transaction.count();
  const activities = await prisma.activity.count();
  const announcements = await prisma.announcement.count();
  const donations = await prisma.donation.count();
  const prayerTimes = await prisma.prayerTime.count();
  const members = await prisma.mosqueMember.count();
  const appSettings = await prisma.appSettings.count();
  const telegramSettings = await prisma.telegramSettings.count();
  
  console.log(`\n=== OTHER DATA CHECK ===`);
  console.log(`Transactions : ${transactions}`);
  console.log(`Activities   : ${activities}`);
  console.log(`Announcements: ${announcements}`);
  console.log(`Donations    : ${donations}`);
  console.log(`Prayer Times : ${prayerTimes}`);
  console.log(`Members      : ${members}`);
  console.log(`App Settings : ${appSettings}`);
  console.log(`Tele Settings: ${telegramSettings}`);
  console.log(`========================\n`);
  
  if (transactions > 0) {
    const t = await prisma.transaction.findFirst();
    console.log("Sample Transaction:", t.description, t.amount);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
