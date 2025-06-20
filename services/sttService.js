const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const axios = require('axios');
const { decryptMedia } = require('@open-wa/wa-decrypt');

async function transcribeEncryptedAudio(message, outputFilename = 'voice.ogg') {
  const oggPath = path.join(__dirname, outputFilename);
  const wavPath = oggPath.replace(/\.\w+$/, '.wav');
  const txtPath = oggPath.replace(/\.\w+$/, '.txt');

  try {
    // Step 1: Download & decrypt audio
    const decryptedBuffer = await decryptMedia(message._data);
    fs.writeFileSync(oggPath, decryptedBuffer);

    // Step 2: Convert to optimized format for Whisper
    await new Promise((res, rej) =>
      exec(`ffmpeg -y -i "${oggPath}" -ar 16000 -ac 1 -c:a pcm_s16le "${wavPath}"`, err =>
        err ? rej(err) : res()
      )
    );

    // Step 3: Run Whisper
    return new Promise((resolve, reject) => {
      exec(
        `whisper "${wavPath}" --model tiny --language en --output_format txt --output_dir "${__dirname}" --fp16 False`,
        (err) => {
          if (err) return reject('Whisper failed');
          fs.readFile(txtPath, 'utf8', (err, data) => {
            if (err || !data) return resolve('');
            resolve(data.trim());
          });
        }
      );
    });

  } catch (error) {
    console.error('❌ Transcription error:', error.message);
    return 'Failed to transcribe voice message.';
  }
}

module.exports = { transcribeEncryptedAudio };
