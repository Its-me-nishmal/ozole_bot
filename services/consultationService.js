const fs = require('fs');
const path = require('path');
const { DateTime } = require('luxon');
const geminiAdapter = require('../adapters/geminiAdapter');
const config = require('../config/gemini');
const { sendConsultationMail } = require('../utils/mailer');
const { connectToWhatsApp } = require('../adapters/whatsappAdapter');
const { generateContentForDetection } = require('../adapters/geminiAdapterForDetection');



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

        // Step 1: Check if this sender already has a consultation
        const existing = readConsultations();
        const alreadyScheduled = existing.find(c => c.sender === sender);

        if (alreadyScheduled) {
            console.log("🛑 Consultation already scheduled for:", sender);
            return null;
        }

        // Step 2: Prompt Gemini to extract consultation intent
        const fullPrompt = `${config.consultationPrompt}\n\nCurrent IST DateTime: ${nowIST.toFormat('yyyy-MM-dd HH:mm')}\n\nConversation:\n ${prompt}`;
        const rawResponse = await generateContentForDetection(fullPrompt);
        const cleaned = rawResponse.replace(/```json|```/g, '').trim();

        const result = JSON.parse(cleaned);
        if (!result.intent || !result.date || !result.time) {
            console.warn('⚠️ Invalid or incomplete consultation result:', result);
            return null;
        }

        // Step 3: Save the new consultation
        const newEntry = {
            sender,
            ...result,
            scheduledAt: nowIST.toISO(),
        };

        existing.push(newEntry);
        writeConsultations(existing);
        console.log(result)
        if (result.email) {
            await sendConsultationMail(result.email, newEntry);
        }
        console.log(sender)
        if (sender) {
            try {
                const wa = await connectToWhatsApp();

                if (!wa || !wa.sendMessage) {
                    console.error('❌ WhatsApp client is not ready.');
                    return result;
                }

                const message = `🗓️ *Consultation Scheduled*\n\n📅 Date: ${result.date}\n⏰ Time: ${result.time}\n\nThank you!`;

                await wa.sendMessage(sender,message);
                console.log("📲 WhatsApp message sent to:", sender);

            } catch (err) {
                console.error("❌ Failed to send WhatsApp message:", err.message);
            }
        }




        console.log("✅ New consultation saved for:", sender);
        return result;

    } catch (error) {
        console.error("❌ Consultation detection failed:", error.message);
        return null;
    }
}

async function processAndScheduleConsultation(sender, consultationInfo, email = null, mobile = null) {
  try {
    if (!consultationInfo || !consultationInfo.date || !consultationInfo.time) {
      return { success: false, message: "Missing required consultation info (date/time)." };
    }

    // const allConsultations = readConsultations();
    // const nowIST = DateTime.now().setZone('Asia/Kolkata');

    // const existing = allConsultations.find(c => c.sender === sender);
    // if (existing) {
    //   return {
    //     success: false,
    //     message: "User already has a scheduled consultation.",
    //     details: existing
    //   };
    // }

    // const newEntry = {
    //   sender,
    //   email,
    //   mobile,
    //   ...consultationInfo,
    //   scheduledAt: nowIST.toISO()
    // };

    // allConsultations.push(newEntry);
    // writeConsultations(allConsultations);
    // console.log("✅ Scheduled consultation for:", sender);

    // Send confirmation email if email exists
    if (email) {
      try {
        await sendConsultationMail(email, newEntry);
        console.log("📧 Email sent to:", email);
      } catch (err) {
        console.warn("⚠️ Failed to send consultation email:", err.message);
      }
    }

    // Send WhatsApp message if sender is present
    if (sender) {
      try {
        const wa = await connectToWhatsApp();

        if (!wa?.sendMessage) {
          console.warn("⚠️ WhatsApp client not available.");
        } else {
          const message = `🗓️ *Consultation Scheduled*\n\n📅 Date: ${consultationInfo.date}\n⏰ Time: ${consultationInfo.time}\n\nThank you!`;
          await wa.sendMessage(sender, message);
          console.log("📲 WhatsApp message sent to:", sender);
        }
      } catch (waErr) {
        console.error("❌ WhatsApp message failed:", waErr.message);
      }
    }

    return {
      success: true,
      message: "Consultation successfully scheduled.",
      details: newEntry
    };
  } catch (err) {
    console.error("❌ processAndScheduleConsultation failed:", err.message);
    return {
      success: false,
      message: "Internal error while scheduling consultation."
    };
  }
}

module.exports = {
    detectConsultationIntent,
    processAndScheduleConsultation
};
