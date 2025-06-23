const fs = require('fs');
const path = require('path');
const { DateTime } = require('luxon');
const geminiAdapter = require('../adapters/geminiAdapter');
const config = require('../config/gemini');

const CONSULTATION_FILE = path.join(__dirname, '../data/consultation.json');

function readConsultations() {
  try {
    if (!fs.existsSync(CONSULTATION_FILE)) return [];
    const data = fs.readFileSync(CONSULTATION_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('❌ Failed to read consultation file:', err);
    return [];
  }
}

function writeConsultations(consultations) {
  try {
    fs.writeFileSync(CONSULTATION_FILE, JSON.stringify(consultations, null, 2), 'utf-8');
  } catch (err) {
    console.error('❌ Failed to write consultation file:', err);
  }
}

async function detectConsultationIntent(prompt, sender) {
  try {
    const nowIST = DateTime.now().setZone('Asia/Kolkata');

    // Step 1: Check for existing valid consultation
    const existing = readConsultations();
    const alreadyScheduled = existing.find((c) => {
      const consultationDateTime = DateTime.fromFormat(
        `${c.date} ${c.time}`,
        'yyyy-MM-dd HH:mm',
        { zone: 'Asia/Kolkata' }
      );
      return c.sender === sender && consultationDateTime > nowIST;
    });

    if (alreadyScheduled) {
      console.log("🛑 Consultation already scheduled for:", sender);
      return null;
    }

    // Step 2: Prompt Gemini
    const fullPrompt = `${config.consultationPrompt}\n\nCurrent IST DateTime: ${nowIST.toFormat('yyyy-MM-dd HH:mm')}\n\nConversation:\n ${prompt}`;
    const rawResponse = await geminiAdapter.generateContent(fullPrompt);
    const cleaned = rawResponse.replace(/```json|```/g, '').trim();

    const result = JSON.parse(cleaned);
    if (!result.intent) return null;

    // Step 3: Save the consultation
    const newEntry = {
      sender,
      ...result,
      scheduledAt: nowIST.toISO(), // Save with full ISO time in IST
    };
    existing.push(newEntry);
    writeConsultations(existing);

    console.log("✅ New consultation saved for:", sender);
    return result;

  } catch (error) {
    console.error("❌ Consultation detection failed:", error.message);
    return null;
  }
}

module.exports = {
  detectConsultationIntent,
};
