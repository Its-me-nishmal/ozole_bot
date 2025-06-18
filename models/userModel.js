const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true, unique: true },
  name: { type: String },
  location: { type: String },
  registrationTimestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);