(async () => {
  const { default: stt } = await import('speech-to-text');

  // Now you can use `stt` here
})();
const axios = require('axios');
const fs = require('fs');

async function transcribeAudio(audioLink) {
  // STT (Speech-to-Text) functionality using speech-to-text
  console.log('Transcribing audio from link:', audioLink);

  try {
    // Download the audio file
    const response = await axios({
      method: 'get',
      url: audioLink,
      responseType: 'stream'
    });

    const audioFile = 'audio.ogg';
    const writer = fs.createWriteStream(audioFile);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log('Audio file downloaded successfully');

        const options = {
          language: 'en-US'
        }

        // Transcribe the audio file
        stt.recognize(audioFile, options, function (err, text) {
          if (err) {
            console.error("STT error:", err);
            reject(err);
            return;
          }
          console.log("STT transcribed text:", text);
          resolve(text);
        });
      });

      writer.on('error', (err) => {
        console.error("Error downloading audio file:", err);
        reject(err);
      });
    });
  } catch (error) {
    console.error("Error downloading audio file:", error);
    return "Error downloading audio file";
  }
}

module.exports = { transcribeAudio };