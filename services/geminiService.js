const geminiAdapter = require('../adapters/geminiAdapter');
const config = require('../config/gemini');
const historyService = require('./historyService');

async function generateResponse(sender, prompt) {
  try {
    const systemPrompt = config.systemPrompt;
    let chatHistory = await historyService.getChatHistory(sender);

    // Format chat history for Gemini
    let formattedHistory = chatHistory.map(item => `User: ${item.message}\nAI: ${item.response}`).join('\n');

    const fullPrompt = systemPrompt + '\n' + formattedHistory + '\nUser: ' + prompt;
    const response = await geminiAdapter.generateContent(fullPrompt);
    return response;
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    throw error;
  }
}

module.exports = { generateResponse };