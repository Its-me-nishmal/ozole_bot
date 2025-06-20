const { Client, LocalAuth } = require('whatsapp-web.js');

// Optional: use remote WA version to avoid Puppeteer issues
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: '/snap/bin/chromium',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('ready', () => {
    console.log('✅ Client is ready!');
});

client.on('authenticated', () => {
    console.log('✅ Authenticated!');
});

client.on('auth_failure', msg => {
    console.error('❌ AUTH FAILURE:', msg);
});

client.on('disconnected', reason => {
    console.log('❌ Client was logged out:', reason);
});

async function connectToWhatsApp() {
    console.log('🟡 Initializing...');
    try {
        await client.initialize();
        const code = await client.requestPairingCode("917306007066"); // Replace with your number
        console.log(`📱 Pairing Code (enter this in WhatsApp Mobile > Linked Devices): ${code}`);
    } catch (err) {
        console.error('❌ Error during initialization or pairing:', err);
    }

    return client;
}

module.exports = { connectToWhatsApp };
