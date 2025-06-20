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

      // 🎤 Handle voice message
      if (message.hasMedia && message.type === 'ptt') {

        try {
          const transcribedText = await transcribeEncryptedAudio(message, 'voice.ogg');
          console.log(transcribedText)
          // Gemini AI Response
          const geminiResponse = await geminiService.generateResponse(sender, transcribedText, 'voice');

          // TTS voice generation (assumes output saved to ./output.wav)
          const buffer = await ttsService.generateVoiceBuffer(geminiResponse);
          const base64Audio = buffer.toString('base64');
          const voiceMedia = new MessageMedia('audio/mpeg', base64Audio, 'response.mp3');

          await whatsappClient.sendMessage(sender, voiceMedia);
          await historyService.saveChatHistory(sender, transcribedText, geminiResponse);
        } catch (err) {
          console.error('❌ Error processing voice message:', err);
          await whatsappClient.sendMessage(sender, { text: '❌ Failed to process voice message.' });
        }

        return;
      }

      // 💬 Handle text commands
      // if (typeof incomingText !== 'string' || !incomingText.startsWith('.')) return;
      console.log(incomingText)

      try {
        const whatsappClient = await connectToWhatsApp();
        const geminiResponse = await geminiService.generateResponse(sender, incomingText);
        responseMessage = { text: geminiResponse };
        console.log(responseMessage)
        await whatsappClient.sendMessage(sender, responseMessage);
        await historyService.saveChatHistory(sender, incomingText, geminiResponse);
      } catch (error) {
        console.error('Gemini text handling error:', error);
      }
    });

  } catch (error) {
    console.error('❌ Error setting up message handler:', error);
  }
}

messageHandler();
