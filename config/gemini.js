const config = require('./index');

module.exports = {
  apiKey: config.gemini.apiKey,
  systemPrompt: config.gemini.systemPrompt,
  voicePrompt: config.gemini.voicePrompt,
  consultationPrompt: config.gemini.consultationPrompt,
  googleEmail: config.googleEmail,
  detectKey: config.detectKey,
};