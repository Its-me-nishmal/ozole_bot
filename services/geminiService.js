const geminiAdapter = require('../adapters/geminiAdapter'); // Assuming path is correct
const config = require('../config/gemini'); // Assuming path is correct and contains ozoleAssistantSystemPrompt
const historyService = require('./historyService'); // Assuming this is the new summary-based historyService

// cleanForTTS function remains useful if the voice_response from Gemini needs further cleaning
function cleanForTTS(text) {
  if (typeof text !== 'string') return ''; // Handle non-string inputs gracefully
  return text
    // Remove emojis
    .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF]|\uFE0F)/g, '')
    // Remove @ and # but keep the word
    .replace(/[@#](\w+)/g, '$1')
    // Remove *, _, ~ etc., but keep the word
    .replace(/[*_~`]+/g, '')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    .trim();
}

async function generateResponse(sender, userPrompt, context = 'text') { // Renamed prompt to userPrompt for clarity
  try {
    // Use the new single, comprehensive system prompt
    const systemInstruction = config.ozoleAssistantSystemPrompt;
    if (!systemInstruction) {
        console.error("CRITICAL: ozoleAssistantSystemPrompt is missing from config/gemini.js.");
        throw new Error("Assistant system configuration is missing.");
    }

    // Get the latest summary for the sender
    let currentSummary = await historyService.getLatestSummary(sender);

    // Construct the full prompt for Gemini, including system instructions, previous summary, and current user message.
    const fullPromptToGemini = `${systemInstruction}\n\n[CONVERSATION_CONTEXT]\nPREVIOUS_SUMMARY:\n${currentSummary || "No previous summary. This is the start of the conversation."}\n\nUSER_MESSAGE:\n${userPrompt}`;

    const rawGeminiResponseString = await geminiAdapter.generateContent(fullPromptToGemini);

    let geminiOutput; // This will be the parsed JSON object
    try {
        // Gemini might wrap its JSON in ```json ... ```, so attempt to strip it.
        const cleanedResponseString = rawGeminiResponseString.replace(/^```json\s*|```\s*$/g, '').trim();
        geminiOutput = JSON.parse(cleanedResponseString);

        // Validate essential fields (summary is crucial)
        if (typeof geminiOutput.summary !== 'string') {
            console.warn(`⚠️ Gemini response for ${sender} missing or has invalid 'summary' field. Old summary: "${currentSummary}"`);
            // To prevent losing context, if summary is bad/missing, we can re-insert the old summary.
            // However, the AI should be robust enough to generate one. If not, it's a prompt engineering issue.
            // For now, let's log and proceed. The historyService update will handle this.
            // geminiOutput.summary = currentSummary; // Or decide how to handle this.
        }
        if (context === 'text' && typeof geminiOutput.response !== 'string') {
            console.warn(`⚠️ Gemini response for ${sender} (text) missing or has invalid 'response' field.`);
            geminiOutput.response = "I'm having a little trouble formulating a full text response right now. Could you try rephrasing?"; // Fallback
        }
        if (context === 'voice' && typeof geminiOutput.voice_response !== 'string') {
            console.warn(`⚠️ Gemini response for ${sender} (voice) missing or has invalid 'voice_response' field.`);
            // Fallback: use text response if voice_response is missing
            geminiOutput.voice_response = typeof geminiOutput.response === 'string' ? geminiOutput.response : "I'm having a little trouble formulating a voice response. Could you try rephrasing?";
        }


    } catch (parseError) {
        console.error(`❌ Error parsing Gemini JSON response for sender ${sender}:`, parseError);
        console.error('Raw Gemini Response String (first 500 chars):', rawGeminiResponseString.substring(0, 500));
        // Construct a fallback JSON structure if parsing fails
        geminiOutput = {
            response: "I encountered an issue processing that. Please try rephrasing or try again later.",
            voice_response: "I encountered an issue processing that. Please try again.",
            summary: currentSummary, // Preserve old summary on critical error
            consultation_needed: false, // Default
            toadmin: { needed: true, message: `Failed to parse AI response. Raw (first 100): ${rawGeminiResponseString.substring(0,100)}` },
            status: "error_parsing_ai_response"
        };
    }

    // The `generateResponse` function now returns the full JSON object.
    // The calling function (e.g., messageHandler for WhatsApp) will decide what to do with it.
    // Specifically, it will use `geminiOutput.summary` to update history.
    // And use `geminiOutput.response` (for text) or `geminiOutput.voice_response` (for voice before TTS).

    // The cleanForTTS is still relevant if the voice_response field itself needs cleaning *before* TTS.
    // The `context` parameter can still guide which primary response field is focused on for output,
    // but the entire geminiOutput object is returned.
    if (context === 'voice' && geminiOutput.voice_response) {
        geminiOutput.voice_response = cleanForTTS(geminiOutput.voice_response);
    }
    // If context is 'text', geminiOutput.response is used. It might not need TTS cleaning.

    // Note: The historyService.updateUserSummary(sender, geminiOutput.summary)
    // should be called by the *consumer* of this service (e.g., messageHandler or API route)
    // AFTER this function returns, because this service's job is just to get the AI response.
    // This keeps concerns separate.

    return geminiOutput; // Return the full parsed JSON object

  } catch (error) {
    // Log the sender to help trace issues
    console.error(`❌ Error in geminiService.generateResponse for sender ${sender}:`, error);
    // Depending on how critical this is, you might want to return a specific error object
    // or re-throw to be handled by an upper layer.
    // For robustness, let's try to return a structured error response similar to parseError.
    // This allows the caller (e.g., messageHandler) to still get a structured object.
    const fallbackSummary = await historyService.getLatestSummary(sender).catch(() => ""); // Try to get summary, default to empty
    return {
        response: "I'm facing a technical difficulty at the moment. Please try again in a few moments.",
        voice_response: "I'm facing a technical difficulty. Please try again soon.",
        summary: fallbackSummary,
        consultation_needed: false,
        toadmin: { needed: true, message: `Core AI generation failed for ${sender}: ${error.message}` },
        status: "error_ai_generation_failed"
    };
    // throw error; // Original behavior: re-throw
  }
}

module.exports = { generateResponse, cleanForTTS }; // Export cleanForTTS if it's used externally