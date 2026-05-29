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

const sendCompletionNotification = async (email, machineId, machineName) => {
  try {
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@washly.local',
      subject: 'Washly — Your Laundry is Done! 🎉',
      html: `
        <h2>Your Laundry Cycle is Complete</h2>
        <p><strong>Machine:</strong> ${machineName || machineId}</p>
        <p>Your laundry is ready! Please collect it as soon as possible to free up the machine for other users.</p>
        <p style="margin-top: 20px; font-size: 12px; color: #7A96A0;">Open the Washly app to view your machine details.</p>
      `
    };

    await sgMail.send(msg);
    console.log(`Completion notification sent to ${email}`);
  } catch (err) {
    console.error('SendGrid error:', err.message);
  }
};

const sendAvailabilityNotification = async (email, machineName) => {
  try {
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@washly.local',
      subject: `Washly — ${machineName} is Now Available! ✅`,
      html: `
        <h2>${machineName} is Available</h2>
        <p>The machine you were waiting for is now available and ready to book.</p>
        <p>Open the Washly app to reserve your slot now.</p>
        <p style="margin-top: 20px; font-size: 12px; color: #7A96A0;">Machines fill up quickly during peak hours!</p>
      `
    };

    await sgMail.send(msg);
    console.log(`Availability notification sent to ${email}`);
  } catch (err) {
    console.error('SendGrid error:', err.message);
  }
};

module.exports = { sendBookingConfirmation, sendCompletionNotification, sendAvailabilityNotification };
