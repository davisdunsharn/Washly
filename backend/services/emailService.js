// services/emailService.js — SendGrid email notifications
const { sgMail } = require('../config/sendgrid');

const sendBookingConfirmation = async (email, machineId, scheduledStart, duration) => {
  try {
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@washly.local',
      subject: 'Washly — Booking Confirmation',
      html: `
        <h2>Your Laundry Booking is Confirmed</h2>
        <p>Machine ID: ${machineId}</p>
        <p>Scheduled Start: ${new Date(scheduledStart).toLocaleString()}</p>
        <p>Duration: ${duration} minutes</p>
        <p>Track your laundry progress in the Washly app.</p>
      `
    };

    await sgMail.send(msg);
    console.log(`Booking confirmation sent to ${email}`);
  } catch (err) {
    console.error('SendGrid error:', err.message);
  }
};

const sendCompletionNotification = async (email, machineId) => {
  try {
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@washly.local',
      subject: 'Washly — Your Laundry is Done!',
      html: `
        <h2>Your Laundry Cycle is Complete</h2>
        <p>Machine ID: ${machineId}</p>
        <p>Please collect your laundry as soon as possible.</p>
      `
    };

    await sgMail.send(msg);
    console.log(`Completion notification sent to ${email}`);
  } catch (err) {
    console.error('SendGrid error:', err.message);
  }
};

module.exports = { sendBookingConfirmation, sendCompletionNotification };
