const { connectToWhatsApp } = require('../adapters/whatsappAdapter');

async function sendMessage(recipient, message) {
      const whatsappClient = await connectToWhatsApp();

 if (!whatsappClient || typeof whatsappClient.sendMessage !== 'function') {
    throw new Error('WhatsApp client not initialized properly.');
  }

  try {
    await whatsappClient.sendMessage(recipient, { text: message });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}

module.exports = { sendMessage };