const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  const mosqueCount = await prisma.mosque.count();
  const planCount = await prisma.planFeatures.count();
  const voucherCount = await prisma.voucher.count();
  
  console.log(`\n=== DB DATA CHECK ===`);
  console.log(`Users     : ${userCount}`);
  console.log(`Mosques   : ${mosqueCount}`);
  console.log(`Plans     : ${planCount}`);
  console.log(`Vouchers  : ${voucherCount}`);
  console.log(`======================\n`);
  
  if (mosqueCount > 0) {
    const list = await prisma.mosque.findMany({ take: 5 });
    console.log("Samples (Mosques):", list.map(m => m.name));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
