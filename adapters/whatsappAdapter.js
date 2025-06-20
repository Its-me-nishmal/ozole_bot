const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: '/snap/bin/chromium',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

console.log('here...')

client.on('qr', qr => {
    console.log('generating..qr')
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
});

// client.on('message_create', (msg) => {
//   console.log(msg)
// })

client.on('auth_failure', msg => {
    console.error('AUTH FAILURE:', msg);
});

client.on('disconnected', reason => {
    console.log('Client was logged out:', reason);
});

async function connectToWhatsApp() {
    console.log('called fn')
    client.initialize();
    return client;
}

module.exports = { connectToWhatsApp };