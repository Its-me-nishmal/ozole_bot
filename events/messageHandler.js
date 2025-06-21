const { connectToWhatsApp } = require('../adapters/whatsappAdapter');
const geminiService = require('../services/geminiService');
const historyService = require('../services/historyService');
const ttsService = require('../services/ttsService');
const { transcribeEncryptedAudio } = require('../services/sttService');
const { MessageMedia } = require('whatsapp-web.js');

// ... imports remain unchanged

async function messageHandler() {
  try {
    const whatsappClient = await connectToWhatsApp();

    whatsappClient.on('message', async (message) => {
      const sender = message.from;
      let incomingText = message.body || '';

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
          await historyService.saveChatHistory(sender, transcribedText, geminiResponse,'voice');
        } catch (err) {
          console.error('❌ Voice message processing error:', err);
          await whatsappClient.sendMessage(sender, '❌ Failed to process your voice message.');
        }
        return;
      }

      // 💬 Text message handling
      if (!incomingText.trim()) {
        console.log('⚠️ Empty or unsupported message. Skipping...');
        return;
      }

      try {
        console.log('💬 Incoming Text:', incomingText);

        const geminiResponse = await geminiService.generateResponse(sender, incomingText, 'text');
        console.log('🔮 Gemini Response:', geminiResponse);

        await whatsappClient.sendMessage(sender, geminiResponse); // send directly
        await historyService.saveChatHistory(sender, incomingText, geminiResponse, 'text');
      } catch (error) {
        console.error('❌ Text handling error:', error);
        await whatsappClient.sendMessage(sender, '❌ Sorry, something went wrong processing your message.');
      }
    });

  } catch (error) {
    console.error('❌ Error initializing WhatsApp client:', error);
  }
}

messageHandler();

