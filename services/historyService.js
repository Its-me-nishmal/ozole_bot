const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../data/user-chat-history.json');

// Ensure the file exists
if (!fs.existsSync(dataFilePath)) {
  fs.writeFileSync(dataFilePath, JSON.stringify({}, null, 2));
}

async function saveChatHistory(sender, message, response, type = 'text') {
  try {
    const chatHistory = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

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

async function getChatHistory(sender, type = 'text') {
  try {
    const chatHistory = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    return chatHistory[sender]?.[type] || [];
  } catch (error) {
    console.error('❌ Error getting chat history:', error);
    throw error;
  }
}

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

async function mergeChatHistories(fromId, toId, type = 'text') {
  try {
    const chatHistory = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

    if (!chatHistory[fromId]) {
      // Already merged or never existed
      console.log(`⚠️ No chat history to merge from ${fromId}`);
      return;
    }

    // Ensure toId exists
    if (!chatHistory[toId]) {
      chatHistory[toId] = { text: [], voice: [] };
    }

    // Copy entries
    const entriesToMove = chatHistory[fromId][type] || [];
    chatHistory[toId][type] = chatHistory[toId][type].concat(entriesToMove);

    // Delete temp (fromId) history
    delete chatHistory[fromId];

    fs.writeFileSync(dataFilePath, JSON.stringify(chatHistory, null, 2));
    console.log(`✅ Merged chat history from ${fromId} to ${toId} (${type})`);
  } catch (error) {
    console.error('❌ Error merging chat histories:', error);
    throw error;
  }
}

module.exports = {
  saveChatHistory,
  getChatHistory,
  clearChatHistory,
  mergeChatHistories,
};
