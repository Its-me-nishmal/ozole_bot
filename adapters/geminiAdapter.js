const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require('../config/gemini');

let key = config.apiKey
const genAI = new GoogleGenerativeAI(config.apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function generateContent(prompt) {
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

module.exports = { generateContent };