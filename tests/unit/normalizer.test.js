const { normalizePhoneNumber, stripEmojis } = require('../../utils/normalizer');

describe('Normalizer', () => {
  it('should normalize a phone number', () => {
    const phoneNumber = '123-456-7890';
    const normalizedNumber = normalizePhoneNumber(phoneNumber);
    expect(normalizedNumber).toBe('+1234567890');
  });

  it('should strip emojis from a string', () => {
    const text = 'Hello 👋 world! 😊';
    const strippedText = stripEmojis(text);
    expect(strippedText).toBe('Hello  world! ');
  });
});