// config/sendgrid.js — SendGrid email client setup
const sgMail = require('@sendgrid/mail');

const sendgridApiKey = process.env.SENDGRID_API_KEY;

if (!sendgridApiKey) {
  throw new Error('Missing SendGrid API key in .env');
}

sgMail.setApiKey(sendgridApiKey);

module.exports = { sgMail };
