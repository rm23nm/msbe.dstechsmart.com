const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function finalTest() {
  const geminiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  try {
    console.log("Testing FINAL FIX with gemini-3-flash-preview...");
    const chat = model.startChat({
        history: [
            { role: "user", parts: [{ text: "You are a mosque assistant." }] },
            { role: "model", parts: [{ text: "Understood. I am a mosque assistant." }] }
        ]
    });
    const result = await chat.sendMessage("Hi, how can you help me?");
    console.log("Success! Response:", (await result.response).text());
  } catch (e) {
    console.error("FAILED:", e.message);
  }
}

finalTest();
