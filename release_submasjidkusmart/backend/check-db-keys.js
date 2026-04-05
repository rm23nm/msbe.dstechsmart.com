const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkSettings() {
  try {
    const settings = await prisma.appSettings.findFirst();
    console.log("App Settings Gemini Key:", settings?.gemini_api_key);
    
    // Check Telegram settings too as they might have their own key
    const tgSettings = await prisma.telegramSettings.findMany();
    tgSettings.forEach(s => {
      if (s.gemini_api_key) {
        console.log(`Mosque ${s.mosque_id} Gemini Key:`, s.gemini_api_key);
      }
    });

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

checkSettings();
