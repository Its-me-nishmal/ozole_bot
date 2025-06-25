const geminiAdapter = require('../adapters/geminiAdapter');
const config = require('../config/gemini');
const historyService = require('../services/historyService'); // Will use the new historyService
const consultationService = require('../services/consultationService');

// cleanForTTS function remains the same
function cleanForTTS(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF]|\uFE0F)/g, '')
    .replace(/[@#](\w+)/g, '$1')
    .replace(/[*_~`]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function generateGeminiResponse(sender, prompt, voiceMode) {
  try {
    const systemInstruction = config.ozoleAssistantSystemPrompt;
    if (!systemInstruction) {
        console.error("CRITICAL: ozoleAssistantSystemPrompt is missing from config.");
        throw new Error("Assistant configuration is missing.");
    }

    let currentSummary = await historyService.getLatestSummary(sender);

    const fullPromptToGemini = `${systemInstruction}\n\n[CONVERSATION_CONTEXT]\nPREVIOUS_SUMMARY:\n${currentSummary || "No previous summary. This is the start of the conversation."}\n\nUSER_MESSAGE:\n${prompt}`;

    const rawGeminiResponseString = await geminiAdapter.generateContent(fullPromptToGemini);

    let geminiOutput;
    try {
        const cleanedResponseString = rawGeminiResponseString.replace(/^```json\s*|```\s*$/g, '').trim();
        geminiOutput = JSON.parse(cleanedResponseString);

        if (typeof geminiOutput.summary !== 'string') {
            console.warn(`⚠️ Gemini response for ${sender} missing or has invalid 'summary' field. Preserving old summary.`);
            geminiOutput.summary = currentSummary; // Preserve old summary if new one is bad
        }

    } catch (parseError) {
        console.error('Error parsing Gemini JSON response:', parseError);
        console.error('Raw Gemini Response String (first 500 chars):', rawGeminiResponseString.substring(0, 500));
        geminiOutput = {
            response: "I encountered an issue processing that. Please try rephrasing or try again later.",
            voice_response: "I encountered an issue. Please try again.",
            summary: currentSummary, // Preserve old summary on error
            consultation_needed: false,
            toadmin: { needed: true, message: `Failed to parse AI response. Raw (first 100): ${rawGeminiResponseString.substring(0,100)}` },
            status: "error_parsing_ai_response"
        };
    }

    // Process consultation scheduling (this logic remains largely the same)
    if (geminiOutput.consultation_needed === true && geminiOutput.consultation_info) {
      console.log("📅 Consultation intent detected by main Gemini model:", geminiOutput.consultation_info);
      try {
        const userEmailFromOutput = geminiOutput.user_info?.email;
        const userMobileFromOutput = geminiOutput.user_info?.mobile;

        const scheduleResult = await consultationService.processAndScheduleConsultation(
            sender,
            geminiOutput.consultation_info,
            userEmailFromOutput,
            userMobileFromOutput
        );
        
        if (!scheduleResult.success) {
            console.warn("⚠️ Consultation scheduling reported an issue:", scheduleResult.message);
            // Update toadmin if it exists, or create it
            geminiOutput.toadmin = geminiOutput.toadmin || { needed: false, message: "" };
            geminiOutput.toadmin.needed = true;
            geminiOutput.toadmin.message += ` | Consultation scheduling issue: ${scheduleResult.message}`;
            
            if (scheduleResult.message?.includes("already scheduled") && scheduleResult.details) {
                geminiOutput.response = `It looks like you already have a consultation scheduled for ${scheduleResult.details.date} at ${scheduleResult.details.time}. If you need to make changes, please contact us directly.`;
                geminiOutput.voice_response = geminiOutput.response;
            }
        }
      } catch (scheduleError) {
        console.error("❌ Error during consultation scheduling process:", scheduleError);
        geminiOutput.toadmin = geminiOutput.toadmin || { needed: false, message: "" };
        geminiOutput.toadmin.needed = true;
        geminiOutput.toadmin.message += ` | CRITICAL: Failed to schedule consultation: ${scheduleError.message}`;
      }
    } else if (geminiOutput.consultation_needed === true && !geminiOutput.consultation_info) {
        console.warn("⚠️ Gemini indicated consultation_needed=true but consultation_info is missing/incomplete.", geminiOutput);
        geminiOutput.toadmin = geminiOutput.toadmin || { needed: false, message: "" };
        geminiOutput.toadmin.needed = true;
        geminiOutput.toadmin.message += ` | AI indicated consultation but crucial info is missing.`;
    }

    // Update the user's summary if the response was successfully parsed
    if (geminiOutput.status !== "error_parsing_ai_response" && typeof geminiOutput.summary === 'string') {
        await historyService.updateUserSummary(sender, geminiOutput.summary);
    } else if (geminiOutput.status !== "error_parsing_ai_response" && typeof geminiOutput.summary !== 'string') {
        // This case should ideally be caught earlier by the check after parsing
        console.warn(`Did not update summary for ${sender} as it was not a string in the final geminiOutput.`);
    }


    if (voiceMode && geminiOutput.voice_response) {
        geminiOutput.voice_response = cleanForTTS(geminiOutput.voice_response);
    } else if (voiceMode && geminiOutput.response && !geminiOutput.voice_response) {
        geminiOutput.voice_response = cleanForTTS(geminiOutput.response);
    }

    return geminiOutput;

  } catch (error) {
    console.error('❌ Error in generateGeminiResponse main try-catch:', error);
    throw error;
  }
}

// --- getGeminiResponse ---
async function getGeminiResponse(req, res) {
  const { prompt } = req.query;
  const voiceMode = req.query.voiceMode === 'true';
  
  let verifiedPhone = null;
  let tempId = null;
  let sender = null;

  if (req.query.number?.includes('|')) {
    [verifiedPhone, tempId] = req.query.number.split('|');
    sender = verifiedPhone; 
  } else {
    sender = req.query.number || `temp_${Math.random().toString(36).substring(2, 15)}`;
  }

  if (!prompt || typeof prompt !== 'string' || prompt.trim() === "") {
    return res.status(400).json({ 
        error: "Prompt is required and must be a non-empty string.",
        response: "Please provide a message.",
        voice_response: "Please provide a message.",
        status: "error_bad_request"
    });
  }

  try {
    if (verifiedPhone && tempId && verifiedPhone !== tempId) {
      // Use the new merge function
      await historyService.mergeUserSummaries(tempId, verifiedPhone);
    }

    const fullJsonResponse = await generateGeminiResponse(sender, prompt, voiceMode);
    res.json(fullJsonResponse); 
  } catch (error) {
    console.error('Error in getGeminiResponse handler:', error.message, error.stack); // Added stack for more debug info
    res.status(500).json({ 
        error: "Failed to generate response due to an internal error.",
        // details: error.message, // Be cautious about exposing raw error messages in production
        response: "Sorry, I couldn't process your request right now. Please try again later.",
        voice_response: "Sorry, I couldn't process your request right now. Please try again later.",
        consultation_needed: false,
        status: "error_internal_server"
    });
  }
}

// --- postGeminiResponse --- (No change in merge logic, as it's typically for GET)
async function postGeminiResponse(req, res) {
  const { prompt, number } = req.body;
  const voiceMode = req.query.voiceMode === 'true' || req.body.voiceMode === true; 
  let sender = number || `temp_${Math.random().toString(36).substring(2, 15)}`;

  if (!prompt || typeof prompt !== 'string' || prompt.trim() === "") {
    return res.status(400).json({ 
        error: "Prompt is required and must be a non-empty string.",
        response: "Please provide a message.",
        voice_response: "Please provide a message.",
        status: "error_bad_request"
    });
  }

  try {
    const fullJsonResponse = await generateGeminiResponse(sender, prompt, voiceMode);
    res.json(fullJsonResponse);
  } catch (error) {
    console.error('Error in postGeminiResponse handler:', error.message, error.stack);
    res.status(500).json({ 
        error: "Failed to generate response due to an internal error.",
        // details: error.message, 
        response: "Sorry, I couldn't process your request right now. Please try again later.",
        voice_response: "Sorry, I couldn't process your request right now. Please try again later.",
        consultation_needed: false,
        status: "error_internal_server"
    });
  }
}

// --- getPhoneNumber --- (Remains unchanged)
async function getPhoneNumber(req, res) {
  const { prompt, number } = {
    ...(req.method === 'POST' ? req.body : {}),
    ...(req.query || {})
  };
  // const sender = number || `temp_${Math.random().toString(36).substring(2, 15)}`; // Sender not really used here

  try {
    const text = prompt || "";
    const cleaned = text.replace(/[\s\-()]/g, '');
    const match = cleaned.match(/(?:\+91|91)?(\d{10})\b/);

    if (match && match[1]) {
      const formatted = `91${match[1]}@c.us`;
      return res.json({ response: formatted });
    } else {
      return res.json({ response: null }); // Send JSON null for consistency
    }
  } catch (error) {
    console.error("Error extracting phone number:", error);
    res.status(500).json({error: "Error processing request for phone number"});
  }
}

module.exports = { getGeminiResponse, postGeminiResponse, getPhoneNumber };