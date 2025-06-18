
const { connectToWhatsApp } = require('../adapters/whatsappAdapter');

async function sendMessage(req, res) {
  try {
    const { recipient, message } = req.body;
    const whatsappClient = await connectToWhatsApp();
    await whatsappClient.sendMessage(recipient, {text: message});
    res.status(200).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
}

module.exports = { sendMessage };