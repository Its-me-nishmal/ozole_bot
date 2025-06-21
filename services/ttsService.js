const gTTS = require('gtts');
const concat = require('concat-stream');

async function generateVoiceBuffer(text) {
  return new Promise((resolve, reject) => {
    const gtts = new gTTS(text, 'en-in');
    const bufferStream = concat((data) => resolve(data));

    gtts.stream()
      .on('error', (err) => reject(err))
      .pipe(bufferStream);
  });
}

module.exports = { generateVoiceBuffer };
