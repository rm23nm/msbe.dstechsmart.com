const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function listModels() {
  const geminiKey = process.env.GEMINI_API_KEY;
  try {
    const genAI = new GoogleGenerativeAI(geminiKey);
    // There is no listModels in the SDK directly as a simple function sometimes,
    // let's try calling another model to see what works or just use a known good one.
    // Actually, gemini-1.5-flash is definitely correct.
    
    // Let me try gemini-1.5-flash-001 or gemini-pro
    // Wait, let's try 'gemini-1.0-pro'
    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
    const result = await model.generateContent("Hello?");
    const response = await result.response;
    console.log("Success with gemini-1.0-pro:", response.text());
  } catch (error) {
    console.error("Gemini Test Failed:", error.message);
  }
}

listModels();
