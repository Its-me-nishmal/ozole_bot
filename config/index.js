
require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL,
  whatsapp: {
    sessionId: process.env.WHATSAPP_SESSION_ID || 'baileys_pro_session',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    systemPrompt: process.env.GEMINI_SYSTEM_PROMPT || 'You are a helpful AI assistant.',
    voicePrompt:process.env.GEMINI_VOICE_PROMPT,
    consultationPrompt: process.env.GEMINI_CONSULTATION_PROMPT 
  },
  googleEmail: process.env.GOOGLE_EMAIL,
  googlePassword: process.env.GOOGLE_PASSWORD,
};