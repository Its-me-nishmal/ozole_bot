const { connectToWhatsApp } = require('../adapters/whatsappAdapter');
const geminiService = require('../services/geminiService');
const historyService = require('../services/historyService');
const ttsService = require('../services/ttsService');
const { transcribeEncryptedAudio } = require('../services/sttService');
const { MessageMedia } = require('whatsapp-web.js');

async function messageHandler() {
  try {
    const whatsappClient = await connectToWhatsApp();

    whatsappClient.on('message', async (message) => {
      const sender = message.from;
      let incomingText = message.body || '';
      let responseMessage = null;

      // 🎤 Voice message handling
      if (message.hasMedia && message.type === 'ptt') {
        try {
          const transcribedText = await transcribeEncryptedAudio(message, 'voice.ogg');
          console.log('🎤 Transcribed:', transcribedText);

          const geminiResponse = await geminiService.generateResponse(sender, transcribedText, 'voice');

          const buffer = await ttsService.generateVoiceBuffer(geminiResponse);
          const base64Audio = buffer.toString('base64');
          const voiceMedia = new MessageMedia('audio/mpeg', base64Audio, 'response.mp3');

          await whatsappClient.sendMessage(sender, voiceMedia);
          await historyService.saveChatHistory(sender, transcribedText, geminiResponse);
        } catch (err) {
          console.error('❌ Voice message processing error:', err);
          await whatsappClient.sendMessage(sender, { text: '❌ Failed to process your voice message.' });
        }
        return;
      }

      // 💬 Text message handling
      try {
        console.log('💬 Incoming Text:', incomingText);

        const geminiResponse = await geminiService.generateResponse(sender, incomingText, 'text');
        responseMessage = { text: geminiResponse };

        await whatsappClient.sendMessage(sender, responseMessage);
        await historyService.saveChatHistory(sender, incomingText, geminiResponse);
      } catch (error) {
        console.error('❌ Text handling error:', error);
        await whatsappClient.sendMessage(sender, { text: '❌ Sorry, something went wrong processing your message.' });
      }
    });

  } catch (error) {
    console.error('❌ Error initializing WhatsApp client:', error);
  }
}

messageHandler();
