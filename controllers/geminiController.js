const geminiAdapter = require('../adapters/geminiAdapter');
const config = require('../config/gemini');
const historyService = require('../services/historyService');
const { detectConsultationIntent } = require('../services/consultationService');

async function generateGeminiResponse(sender, prompt, voiceMode) {
  try {
 const systemPrompt = voiceMode ? config.voicePrompt : config.systemPrompt;
    let chatHistory = await historyService.getChatHistory(sender, voiceMode ? 'voice' : 'text');

   

    // Format chat history for Gemini
    let formattedHistory = chatHistory.map(item => `User: ${item.message}\nAI: ${item.response}`).join('\n');

    const fullPrompt = systemPrompt + '\\n' + formattedHistory + '\\nUser: ' + prompt;

     const consultation = await detectConsultationIntent(fullPrompt, sender);
    if (consultation) {
      console.log("📅 Consultation Detected:", consultation);

      // Optional: Send notification/email/store to DB
      // await emailService.sendConsultationEmail('admin@example.com', sender, consultation.date, consultation.time);
    }


    const response = await geminiAdapter.generateContent(fullPrompt);

    // Save chat history
    await historyService.saveChatHistory(sender, prompt, response, voiceMode ? 'voice' : 'text');

    return voiceMode ? cleanForTTS(response) : response;
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    throw error;
  }
}

async function getGeminiResponse(req, res) {
  const { prompt } = req.query;
  const voiceMode = req.query.voiceMode === 'true';
  
  let verifiedPhone = null;
  let tempId = null;
  let sender = null;

  // Handle combined input from frontend
  if (req.query.number?.includes('|')) {
    [verifiedPhone, tempId] = req.query.number.split('|');
    sender = verifiedPhone;
  } else {
    sender = req.query.number || `temp_${Math.random().toString(36).substring(2, 15)}`;
  }

  try {
    // If both phone and tempId exist and aren't already merged
    if (verifiedPhone && tempId && verifiedPhone !== tempId) {
      await historyService.mergeChatHistories(tempId, verifiedPhone, voiceMode ? 'voice' : 'text');
    }

    const response = await generateGeminiResponse(sender, prompt, voiceMode);
    res.json({ response });
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



module.exports = { getGeminiResponse, postGeminiResponse, getPhoneNumber };