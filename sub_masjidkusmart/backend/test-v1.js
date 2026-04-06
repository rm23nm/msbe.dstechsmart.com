const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyCX8RpBudEi2bgxmKz6GQ7zNGCjdw9BaQs");

async function testV1() {
  try {
    // Current SDK default is v1beta. Try v1.
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const result = await model.generateContent("Test");
    const response = await result.response;
    console.log("SUCCESS WITH V1:", response.text());
  } catch (e) {
    console.error("V1 FAILED:", e.message);
  }
}

testV1();
