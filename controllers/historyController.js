const historyService = require('../services/historyService');

async function fetchHistory(req, res) {
  try {
    const { sender } = req.query;
    const history = await historyService.getChatHistory(sender);
    res.status(200).send(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).send({ error: 'Failed to fetch history' });
  }
}

async function clearHistory(req, res) {
  try {
    const { sender } = req.body;
    await historyService.clearChatHistory(sender);
    res.status(200).send({ message: 'Chat history cleared successfully' });
  } catch (error) {
    console.error('Error clearing history:', error);
    res.status(500).send({ error: 'Failed to clear chat history' });
  }
}

module.exports = { fetchHistory, clearHistory };