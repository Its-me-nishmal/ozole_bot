const gTTS = require('gtts');

async function generateVoice(text) {
  // TTS (Text-to-Speech) functionality using gTTS
  console.log('Generating voice from text:', text);
  return new Promise((resolve, reject) => {
    const gtts = new gTTS(text, 'en');
    const fileName = 'output.wav'; // You might want to generate unique file names
    gtts.save(fileName, function(err, result) {
      if (err) {
        console.error("TTS error:", err);
        reject(err);
        return;
      }
      console.log("TTS saved to:", fileName);
      resolve(fileName); // Resolve with the file name
    });
  });
}

module.exports = { generateVoice };