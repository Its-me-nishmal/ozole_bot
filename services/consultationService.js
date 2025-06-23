
const geminiAdapter = require('../adapters/geminiAdapter');
const config = require('../config/gemini');


async function detectConsultationIntent(prompt) {
  try {
 

    const rawResponse = await geminiAdapter.generateContent(prompt);
    const cleaned = rawResponse.replace(/```json|```/g, '').trim();

    const result = JSON.parse(cleaned);
    return result.intent ? result : null;
  } catch (error) {
    console.error("Consultation detection failed:", error.message);
    return null;
  }
}


module.exports = {
  detectConsultationIntent
};