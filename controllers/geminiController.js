const geminiAdapter = require('../adapters/geminiAdapter');
const config = require('../config/gemini');
const historyService = require('../services/historyService');

async function generateGeminiResponse(sender, prompt, voiceMode) {
  try {
    const systemPrompt = voiceMode == false ? config.systemPrompt : config.voicePrompt ;
    let chatHistory = await historyService.getChatHistory(sender);

    // Clear chat history if no message in last 10 minutes
    chatHistory = chatHistory.filter(item => {
      const timeDiff = new Date() - new Date(item.timestamp);
      return timeDiff < 10 * 60 * 1000; // 10 minutes
    });

    // Format chat history for Gemini
    let formattedHistory = chatHistory.map(item => `User: ${item.message}\nAI: ${item.response}`).join('\n');

    const fullPrompt = systemPrompt + '\\n' + formattedHistory + '\\nUser: ' + prompt;
    const response = await geminiAdapter.generateContent(fullPrompt);

    console.log(response)

    // Save chat history
    await historyService.saveChatHistory(sender, prompt, response);

    return response;
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    throw error;
  }
}

async function getGeminiResponse(req, res) {
  const { prompt, number, voiceMode } = req.query;
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
  let sender = number || `temp_${Math.random().toString(36).substring(2, 15)}`;

  try {
    const response = await generateGeminiResponse(sender, prompt);
    res.send(response);
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