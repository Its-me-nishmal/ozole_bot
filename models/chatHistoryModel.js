const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
  sender: { type: String, required: true },
  message: { type: String, required: true },
  response: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ChatHistory', chatHistorySchema);