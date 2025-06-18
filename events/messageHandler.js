const { connectToWhatsApp } = require('../adapters/whatsappAdapter');
const geminiService = require('../services/geminiService');
const historyService = require('../services/historyService');

async function messageHandler() {
  try {
    const whatsappClient = await connectToWhatsApp();

    whatsappClient.on('message_create', async message => {
      console.log('Message received', message);
      const sender = message.from;
      const text = message.body;

      console.log(text, ' here is the text of the message');

      if(!text.startsWith('.')) return; 

      

      // Get Gemini response
      const geminiResponse = await geminiService.generateResponse(sender, text);

      // Send WhatsApp message
      whatsappClient.sendMessage(sender, geminiResponse);

      // Save chat history
      await historyService.saveChatHistory(sender, text, geminiResponse);
    });
  } catch (error) {
    console.error('Error handling message:', error);
  }
}

messageHandler();