const nodemailer = require('nodemailer');
const config = require('../config/index');


const transporter = nodemailer.createTransport({
  service: 'gmail', // or your mail provider
  auth: {
    user: config.googleEmail,      // your email address
    pass: config.googlePassword       // your email password or app-specific password
  }
});

async function sendConsultationMail(to, consultation) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: '📝 New Consultation Scheduled',
    html: `
      <h2>New Consultation Scheduled</h2>
      <p><strong>Sender:</strong> ${consultation.sender}</p>
      <p><strong>Date:</strong> ${consultation.date}</p>
      <p><strong>Time:</strong> ${consultation.time}</p>
      <p><strong>Intent:</strong> ${consultation.purpose}</p>
      <p><strong>Scheduled At:</strong> ${consultation.scheduledAt}</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('📧 Consultation email sent successfully to:', to);
  } catch (err) {
    console.error('❌ Failed to send email:', err.message);
  }
}

module.exports = { sendConsultationMail };
