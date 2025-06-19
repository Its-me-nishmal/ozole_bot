const { connectToWhatsApp } = require('../adapters/whatsappAdapter');
const geminiService = require('../services/geminiService');
const historyService = require('../services/historyService');
const ttsService = require('../services/ttsService');
const sttService = require('../services/sttService');

async function messageHandler() {
  try {
    const whatsappClient = await connectToWhatsApp();

    whatsappClient.on('message_create', async message => {
      const sender = message.from;
      const text = message.body;

      

      if(!text.startsWith('.')) return;

      let geminiResponse = null;
      let responseMessage = null;

      if (message.type === 'ptt') {
        console.log('here')
        // STT (Speech-to-Text)
        const transcribedText = await sttService.transcribeAudio(message._data.deprecatedMms3Url);
        console.log('Transcribed text:', transcribedText);
        text = transcribedText;

        // Get Gemini response
        geminiResponse = await geminiService.generateResponse(sender, text);

        // TTS (Text-to-Speech)
        const voiceResponse = await ttsService.generateVoice(geminiResponse);
        console.log('Voice response generated');
        responseMessage = { audio: voiceResponse, mimetype: 'audio/ogg; codecs=opus' };
      } else {
        // Get Gemini response
        geminiResponse = await geminiService.generateResponse(sender, text);
        responseMessage = geminiResponse;
      }

      // Send WhatsApp message
      whatsappClient.sendMessage(sender, responseMessage);

      // Save chat history
      await historyService.saveChatHistory(sender, text, geminiResponse);
    });
  } catch (error) {
    console.error('Error handling message:', error);
  }
}

messageHandler();