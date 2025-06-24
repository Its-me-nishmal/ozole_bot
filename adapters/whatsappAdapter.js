// whatsappAdapter.js (cleaned version)
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let client = null;
let initialized = false;

function setupListeners(client) {
  client.on('qr', qr => {
    console.log('📷 Scan this QR code to login:');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    console.log('✅ WhatsApp client is ready!');
  });

  client.on('auth_failure', msg => {
    console.error('❌ Auth failed:', msg);
  });

  client.on('disconnected', reason => {
    console.warn('⚠️ WhatsApp disconnected:', reason);
    initialized = false;
  });
}

async function connectToWhatsApp() {
  if (initialized && client) return client;

  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  setupListeners(client);

  try {
    await client.initialize();
    initialized = true;
  } catch (err) {
    console.error('❌ WhatsApp initialization failed:', err.message);
  }

  return client;
}

module.exports = { connectToWhatsApp };
