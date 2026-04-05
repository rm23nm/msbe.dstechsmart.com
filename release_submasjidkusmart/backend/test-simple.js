const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyCX8RpBudEi2bgxmKz6GQ7zNGCjdw9BaQs");

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Test");
    const response = await result.response;
    console.log(response.text());
  } catch (e) {
    console.error(e);
  }
}

test();
