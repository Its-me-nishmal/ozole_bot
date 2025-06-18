const { parsePhoneNumber } = require('libphonenumber-js');

function normalizePhoneNumber(phoneNumber) {
  try {
    const parsedNumber = parsePhoneNumber(phoneNumber, 'US');
    return parsedNumber.format('E.164');
  } catch (error) {
    console.error('Error normalizing phone number:', error);
    return phoneNumber;
  }
}

function stripEmojis(text) {
  return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
}

module.exports = { normalizePhoneNumber, stripEmojis };