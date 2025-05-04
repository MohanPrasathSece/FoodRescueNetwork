const nodemailer = require('nodemailer');
require('dotenv').config();

// Validate and trim email credentials
const rawEmailUser = process.env.EMAIL_USER;
const rawEmailPass = process.env.EMAIL_PASS;
if (!rawEmailUser || !rawEmailPass) {
  console.error('Missing EMAIL_USER or EMAIL_PASS in environment variables');
}
const emailUser = String(rawEmailUser).trim();
const emailPass = String(rawEmailPass).trim();

// Create a transporter object
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass
  }
});

// Verify SMTP configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter verification failed:', error);
  } else {
    console.log('Email transporter is ready');
  }
});

// Email templates
const emailTemplates = {
  donationRequest: (donorName, foodName, requesterName) => ({
    subject: `New Request for Your Donation: ${foodName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">New Food Donation Request</h2>
        <p>Hello ${donorName},</p>
        <p><strong>${requesterName}</strong> has requested your donation of <strong>${foodName}</strong>.</p>
        <p>Please log in to your account to accept or decline this request.</p>
        <a href="${process.env.FRONTEND_URL}/donor/dashboard" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 15px;">View Request</a>
        <p style="margin-top: 20px;">Thank you for being part of our food rescue community!</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated message from Food Rescue Hub. Please do not reply to this email.</p>
      </div>
    `
  }),
  
  donationAccepted: (requesterName, foodName, donorName, pickupDetails) => ({
    subject: `Your Food Request Has Been Accepted: ${foodName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Food Request Accepted</h2>
        <p>Hello ${requesterName},</p>
        <p>Good news! <strong>${donorName}</strong> has accepted your request for <strong>${foodName}</strong>.</p>
        <h3>Pickup Details:</h3>
        <p>${pickupDetails}</p>
        <p>Please log in to your account to view the complete details and confirm pickup.</p>
        <a href="${process.env.FRONTEND_URL}/volunteer/dashboard" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 15px;">View Details</a>
        <p style="margin-top: 20px;">Thank you for being part of our food rescue community!</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated message from Food Rescue Hub. Please do not reply to this email.</p>
      </div>
    `
  }),
  
  pickupScheduled: (donorName, foodName, requesterName, pickupTime) => ({
    subject: `Pickup Scheduled for ${foodName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Pickup Scheduled</h2>
        <p>Hello ${donorName},</p>
        <p><strong>${requesterName}</strong> has scheduled a pickup for <strong>${foodName}</strong>.</p>
        <h3>Scheduled Time:</h3>
        <p>${new Date(pickupTime).toLocaleString()}</p>
        <p>Please ensure the donation is ready for pickup at the scheduled time.</p>
        <a href="${process.env.FRONTEND_URL}/donor/dashboard" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 15px;">View Details</a>
        <p style="margin-top: 20px;">Thank you for your contribution to reducing food waste!</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated message from Food Rescue Hub. Please do not reply to this email.</p>
      </div>
    `
  }),
  
  pickupCompleted: (recipientName, foodName, thankYouMessage) => ({
    subject: `Pickup Completed for ${foodName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Pickup Completed</h2>
        <p>Hello ${recipientName},</p>
        <p>The pickup for <strong>${foodName}</strong> has been successfully completed.</p>
        ${thankYouMessage ? `<p>Message from recipient: "${thankYouMessage}"</p>` : ''}
        <p>Thank you for your contribution to reducing food waste and helping those in need!</p>
        <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 15px;">View Dashboard</a>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated message from Food Rescue Hub. Please do not reply to this email.</p>
      </div>
    `
  }),
  
  donationRemovedByAdmin: (donorName, foodName, adminName) => ({
    subject: `Your Donation Has Been Removed: ${foodName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e53e3e;">Donation Removed by Admin</h2>
        <p>Hello ${donorName},</p>
        <p>Your donation <strong>${foodName}</strong> has been removed by an administrator (${adminName}) due to policy or moderation reasons.</p>
        <p>If you have any questions, please contact support.</p>
        <p style="margin-top: 20px;">Thank you for being part of our food rescue community.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated message from Food Rescue Hub. Please do not reply to this email.</p>
      </div>
    `
  }),
  
  userBannedByAdmin: (userName, adminName) => ({
    subject: `Account Action: You Have Been Banned`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e53e3e;">Account Banned</h2>
        <p>Hello ${userName},</p>
        <p>Your account has been banned by an administrator (${adminName}) due to a violation of our community guidelines or terms of service.</p>
        <p>If you believe this is a mistake, please contact support for further clarification.</p>
        <p style="margin-top: 20px;">Thank you for your understanding.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">This is an automated message from Food Rescue Hub. Please do not reply to this email.</p>
      </div>
    `
  }),
};

// Send email function
const sendEmail = async (to, template, data) => {
  try {
    const { subject, html } = emailTemplates[template](...data);
    
    const mailOptions = {
      from: `"Food Rescue Hub" <${emailUser}>`,
      to,
      subject,
      html
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email: ', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
  templates: Object.keys(emailTemplates)
};
