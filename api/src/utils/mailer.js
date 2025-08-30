const nodemailer = require('nodemailer');
const config = require('./config');

function createTransporter() {
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: Number(config.smtpPort || 587),
    secure: String(config.smtpSecure) === 'true',
    auth: config.smtpUser ? { user: config.smtpUser, pass: config.smtpPass } : undefined
  });
}

async function sendMail({ to, subject, html }) {
  const transporter = createTransporter();
  await transporter.sendMail({ from: config.smtpFrom || config.smtpUser, to, subject, html });
}

module.exports = { createTransporter, sendMail };


