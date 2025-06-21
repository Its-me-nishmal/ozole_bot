const geminiAdapter = require('../adapters/geminiAdapter');
const config = require('../config/gemini');
const historyService = require('./historyService');

async function generateResponse(sender, prompt, context='text') {
  try {
    const systemPrompt = context == 'voice' ? config.voicePrompt : config.textPrompt;
    console.log(context)
    let chatHistory = await historyService.getChatHistory(sender, context);

    // Format chat history for Gemini
    let formattedHistory = chatHistory.map(item => `User: ${item.message}\nAI: ${item.response}`).join('\n');

    const fullPrompt = systemPrompt + '\n' + formattedHistory + '\nUser: ' + prompt;
    const response = await geminiAdapter.generateContent(fullPrompt);
    return context == 'voice' ? cleanForTTS(response) : response;
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    throw error;
  }
}

function cleanForTTS(text) {
  return text
    // Remove emojis
    .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF]|\uFE0F)/g, '')
    // Remove @ and # but keep the word
    .replace(/[@#](\w+)/g, '$1')
    // Remove *, _, ~ etc., but keep the word
    .replace(/[*_~`]+/g, '')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    .trim();
}


module.exports = { generateResponse };