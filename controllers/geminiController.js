const geminiAdapter = require('../adapters/geminiAdapter');
const config = require('../config/gemini');
const historyService = require('../services/historyService');

async function generateGeminiResponse(sender, prompt, voiceMode) {
  try {
 const systemPrompt = voiceMode ? config.voicePrompt : config.systemPrompt;
console.log(systemPrompt)
    let chatHistory = await historyService.getChatHistory(sender, voiceMode ? 'voice' : 'text');

   

    // Format chat history for Gemini
    let formattedHistory = chatHistory.map(item => `User: ${item.message}\nAI: ${item.response}`).join('\n');

    const fullPrompt = systemPrompt + '\\n' + formattedHistory + '\\nUser: ' + prompt;
    const response = await geminiAdapter.generateContent(fullPrompt);

    console.log(response)

    // Save chat history
    await historyService.saveChatHistory(sender, prompt, response, voiceMode ? 'voice' : 'text');

    return response;
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    throw error;
  }
}

async function getGeminiResponse(req, res) {
  const { prompt, number } = req.query;
  const voiceMode = req.query.voiceMode === 'true';
  let sender = number || `temp_${Math.random().toString(36).substring(2, 15)}`;

  try {
    const response = await generateGeminiResponse(sender, prompt, voiceMode);
    res.json({response});
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    res.status(500).send('Error generating response');
  }
}

async function postGeminiResponse(req, res) {
  const { prompt, number } = req.body;
  const voiceMode = req.query.voiceMode === 'true';
  let sender = number || `temp_${Math.random().toString(36).substring(2, 15)}`;

  try {
    const response = await generateGeminiResponse(sender, prompt, voiceMode);
    res.json({response});
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    res.status(500).send('Error generating response');
  }
}


async function getPhoneNumber(req, res) {
const { prompt, number } = {
  ...(req.method === 'POST' ? req.body : {}),
  ...(req.query || {})
};  console.log(prompt, number);
  const sender = number || `temp_${Math.random().toString(36).substring(2, 15)}`;

  try {
    const text = prompt || "";
console.log(text)
    // Clean the text by removing spaces, dashes, and other separators
    const cleaned = text.replace(/[\s\-()]/g, '');

    console.log(cleaned);

    // Match the first valid 10-digit number (with or without +91/91 prefix)
    const match = cleaned.match(/(?:\+91|91)?(\d{10})\b/);
    console.log(match)
    if (match && match[1]) {
      const formatted = `91${match[1]}@c.us`;
      return res.json({ response: formatted });
    } else {
      return res.send(null);
    }
  } catch (error) {
    console.error("Error extracting phone number:", error);
    res.status(500).send("Error processing request");
  }
}



module.exports = { getGeminiResponse, postGeminiResponse, getPhoneNumber };