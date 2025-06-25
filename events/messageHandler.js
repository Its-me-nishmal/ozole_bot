const { connectToWhatsApp } = require('../adapters/whatsappAdapter'); // Assuming this path
const geminiService = require('../services/geminiService'); // Your main Gemini interaction service
const historyService = require('../services/historyService'); // The new summary-focused history service
const ttsService = require('../services/ttsService'); // Your Text-to-Speech service
const { transcribeEncryptedAudio } = require('../services/sttService'); // Your Speech-to-Text service
const { MessageMedia } = require('whatsapp-web.js');

let listenerAttached = false; // Prevent duplicate listeners

/**
 * Normalizes the sender ID by removing WhatsApp-specific suffixes.
 * @param {string} senderId - The original sender ID (e.g., '911234567890@c.us')
 * @returns {string} The normalized sender ID (e.g., '911234567890')
 */
function normalizeSenderId(senderId) {
  if (typeof senderId === 'string') {
    return senderId.split('@')[0];
  }
  return senderId; // Return as is if not a string or no @ symbol
}

async function messageHandler() {
  try {
    const whatsappClient = await connectToWhatsApp();

    if (listenerAttached) {
      console.log('⚠️ Message listener already attached. Skipping initialization.');
      return;
    }

    whatsappClient.on('message', async (message) => {
      const originalSender = message.from;
      const normalizedSender = normalizeSenderId(originalSender); // Use this for history/gemini
      let incomingText = message.body || '';

      // 🎤 Voice message handling
      if (message.hasMedia && (message.type === 'ptt' || message.type === 'audio')) { // Handle both PTT and regular audio
        console.log(`🎤 Received voice/audio message from: ${originalSender} (Normalized: ${normalizedSender})`);
        try {
          // It's good practice to provide a unique filename if possible, or handle cleanup
          const transcribedText = await transcribeEncryptedAudio(message, `audio_${normalizedSender}_${Date.now()}.ogg`);
          if (!transcribedText || transcribedText.trim() === "") {
            console.warn('⚠️ Transcription result was empty. Sending a generic reply.');
            await whatsappClient.sendMessage(originalSender, 'I couldn\'t understand your voice message. Could you please try speaking again or send a text?');
            return;
          }
          console.log(`🎤 Transcribed from ${normalizedSender}:`, transcribedText);

          // Get the full JSON response from Gemini
          const geminiJsonResponse = await geminiService.generateResponse(normalizedSender, transcribedText, 'voice');
          
          if (!geminiJsonResponse || !geminiJsonResponse.voice_response) {
             console.error('❌ Gemini response for voice is invalid or missing voice_response field.');
             await whatsappClient.sendMessage(originalSender, '❌ Sorry, I had trouble generating a voice response.');
             return;
          }
          console.log(`🔮 Gemini Voice Response for ${normalizedSender} (text):`, geminiJsonResponse.voice_response);


          const buffer = await ttsService.generateVoiceBuffer(geminiJsonResponse.voice_response); // Use voice_response for TTS
          const base64Audio = buffer.toString('base64');
          const voiceMedia = new MessageMedia('audio/mpeg', base64Audio, 'response.mp3');

          await whatsappClient.sendMessage(originalSender, voiceMedia, {
            sendAudioAsVoice: true, // Send as a playable voice note
            sendSeen: true,
          });

          // Update summary using the summary field from Gemini's JSON response
          if (geminiJsonResponse.summary) {
            await historyService.updateUserSummary(normalizedSender, geminiJsonResponse.summary);
            console.log(`🔄 Summary updated for ${normalizedSender} (voice).`);
          } else {
            console.warn(`⚠️ Gemini response for ${normalizedSender} (voice) missing summary. Summary not updated.`);
          }

        } catch (err) {
          console.error(`❌ Voice message processing error for ${normalizedSender}:`, err);
          await whatsappClient.sendMessage(originalSender, '❌ Sorry, I encountered an issue processing your voice message. Please try again.');
        }
        return; // Important to return after handling a message type
      }

      // 💬 Text message handling
      // Ensure it's not a media message caption if you want to handle media differently
      if (message.type === 'chat' && incomingText.trim()) {
        console.log(`💬 Received text message from: ${originalSender} (Normalized: ${normalizedSender}): "${incomingText}"`);
        try {
          // Get the full JSON response from Gemini
          const geminiJsonResponse = await geminiService.generateResponse(normalizedSender, incomingText, 'text');

          if (!geminiJsonResponse || !geminiJsonResponse.response) {
             console.error('❌ Gemini response for text is invalid or missing response field.');
             await whatsappClient.sendMessage(originalSender, '❌ Sorry, I had trouble generating a response.');
             return;
          }
          console.log(`🔮 Gemini Text Response for ${normalizedSender}:`, geminiJsonResponse.response);

          await whatsappClient.sendMessage(originalSender, geminiJsonResponse.response); // Send the text response

          // Update summary using the summary field from Gemini's JSON response
          if (geminiJsonResponse.summary) {
            await historyService.updateUserSummary(normalizedSender, geminiJsonResponse.summary);
            console.log(`🔄 Summary updated for ${normalizedSender} (text).`);
          } else {
             console.warn(`⚠️ Gemini response for ${normalizedSender} (text) missing summary. Summary not updated.`);
          }

        } catch (error) {
          console.error(`❌ Text handling error for ${normalizedSender}:`, error);
          await whatsappClient.sendMessage(originalSender, '❌ Sorry, something went wrong while I was processing your message. Please try again.');
        }
        return; // Important
      }

      // If message is not PTT/audio and not non-empty text, log and skip
      if (!message.hasMedia && !incomingText.startsWith('.')) {
        console.log(`⚠️ Empty or unsupported message type received from ${originalSender}. Type: ${message.type}. Skipping...`);
      } else if (message.hasMedia && message.type !== 'ptt' && message.type !== 'audio') {
        console.log(`⚠️ Received unhandled media type from ${originalSender}. Type: ${message.type}. Sending generic reply.`);
        await whatsappClient.sendMessage(originalSender, "I can currently only process text and voice messages. Please send your query as text or a voice note.");
      }

    });


    // Initialize the client if it's not already being initialized by connectToWhatsApp()
    // This depends on how connectToWhatsApp() is structured.
    // If connectToWhatsApp resolves *after* initialization and ready event, then this is not needed here.
    // If it resolves with the client instance *before* it's fully ready, you might need:
    // if (!whatsappClient.pupPage) { // A way to check if it needs initialization
    //   await whatsappClient.initialize();
    // }


  } catch (error) {
    console.error('❌ Critical error initializing WhatsApp message handler:', error);
    // Consider a retry mechanism with backoff or exiting if unrecoverable
  }
}

// Start the message handler
messageHandler();

// Optional: Export if you need to call it from elsewhere or manage its lifecycle
// module.exports = { messageHandler, normalizeSenderId };