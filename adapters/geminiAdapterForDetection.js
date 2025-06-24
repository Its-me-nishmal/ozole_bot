const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require('../config/gemini');

const genAI = new GoogleGenerativeAI(config.detectKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function generateContentForDetection(prompt) {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text.startsWith('AI: ') ? text.slice(4) : text;
  } catch (error) {
    console.error("Error generating content:", error);
    throw error;
  }
}

module.exports = { generateContentForDetection };