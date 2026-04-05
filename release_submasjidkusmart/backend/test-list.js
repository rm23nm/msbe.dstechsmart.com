const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function listAllModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        // Unfortunately the @google/generative-ai Node.js SDK 
        // doesn't have a direct listModels method like the Python one.
        // It's a known limitation in some versions.
        
        // Let's try some likely model names for 2026.
        const models = [
            "gemini-3.1-flash",
            "gemini-3-flash",
            "gemini-2.1-flash",
            "gemini-1.5-flash",
            "gemini-pro"
        ];
        
        for(const m of models) {
            try {
                console.log(`Testing model: ${m}...`);
                const model = genAI.getGenerativeModel({ model: m });
                const result = await model.generateContent("Hi");
                console.log(`Success with ${m}: ${ (await result.response).text().substring(0,20) }`);
                break;
            } catch(e) {
                console.log(`Failed ${m}: ${e.message}`);
            }
        }
    } catch (e) {
        console.error("Global error:", e);
    }
}

listAllModels();
