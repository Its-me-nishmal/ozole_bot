const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '../data/user-chat-history.json');

async function saveChatHistory(sender, message, response) {
  try {
    const chatHistory = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    chatHistory[sender] = chatHistory[sender] || [];
    chatHistory[sender].push({
      message,
      response,
      timestamp: new Date(),
    });
    fs.writeFileSync(dataFilePath, JSON.stringify(chatHistory, null, 2));
  } catch (error) {
    console.error('Error saving chat history:', error);
    throw error;
  }
}

async function getChatHistory(sender) {
  try {
    const chatHistory = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    return chatHistory[sender] || [];
  } catch (error) {
    console.error('Error getting chat history:', error);
    throw error;
  }
}

async function clearChatHistory(sender) {
  try {
    const chatHistory = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    delete chatHistory[sender];
    fs.writeFileSync(dataFilePath, JSON.stringify(chatHistory, null, 2));
  } catch (error) {
    console.error('Error clearing chat history:', error);
    throw error;
  }
}

module.exports = { saveChatHistory, getChatHistory, clearChatHistory };