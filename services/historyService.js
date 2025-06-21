const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../data/user-chat-history.json');

// Ensure the file exists
if (!fs.existsSync(dataFilePath)) {
  fs.writeFileSync(dataFilePath, JSON.stringify({}, null, 2));
}

/**
 * Save chat history with separate sections for 'text' and 'voice'
 * @param {string} sender - User's phone number
 * @param {string} message - User's message
 * @param {string} response - Bot's response
 * @param {string} type - 'text' or 'voice'
 */
async function saveChatHistory(sender, message, response, type = 'text') {
  try {
    const chatHistory = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

    // Initialize user entry
    if (!chatHistory[sender]) {
      chatHistory[sender] = { text: [], voice: [] };
    } else {
      chatHistory[sender].text = chatHistory[sender].text || [];
      chatHistory[sender].voice = chatHistory[sender].voice || [];
    }

    const entry = {
      message,
      response,
      timestamp: new Date().toISOString(),
    };

    chatHistory[sender][type].push(entry);

    fs.writeFileSync(dataFilePath, JSON.stringify(chatHistory, null, 2));
  } catch (error) {
    console.error('❌ Error saving chat history:', error);
    throw error;
  }
}

/**
 * Get chat history for a user by type
 * @param {string} sender - User's phone number
 * @param {string} type - 'text' or 'voice'
 * @returns {Array} - Array of chat entries
 */
async function getChatHistory(sender, type = 'text') {
  try {
    const chatHistory = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    return chatHistory[sender]?.[type] || [];
  } catch (error) {
    console.error('❌ Error getting chat history:', error);
    throw error;
  }
}

/**
 * Clear chat history for a user
 * @param {string} sender - User's phone number
 * @param {string|null} type - 'text', 'voice', or null to clear all
 */
async function clearChatHistory(sender, type = null) {
  try {
    const chatHistory = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

    if (!chatHistory[sender]) return;

    if (type) {
      delete chatHistory[sender][type];
    } else {
      delete chatHistory[sender];
    }

    fs.writeFileSync(dataFilePath, JSON.stringify(chatHistory, null, 2));
  } catch (error) {
    console.error('❌ Error clearing chat history:', error);
    throw error;
  }
}

module.exports = {
  saveChatHistory,
  getChatHistory,
  clearChatHistory,
};
