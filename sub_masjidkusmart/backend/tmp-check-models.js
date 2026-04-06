const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const models = Object.keys(prisma).filter(k => !k.startsWith("_"));
  console.log("DETEKSI_MODEL:", JSON.stringify(models));
  process.exit(0);
}
main();
