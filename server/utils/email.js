const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send verification email
const sendVerificationEmail = async (email, verificationToken, name) => {
  const transporter = createTransporter();
  
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
  
  const mailOptions = {
    from: `"Smart Event Tickets" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email - Smart Event Tickets',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Smart Tickets!</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Hi ${name},</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Thank you for registering with Smart Event Tickets! To complete your registration and start booking amazing events, please verify your email address.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            If the button doesn't work, you can copy and paste this link into your browser:
          </p>
          
          <p style="color: #2563eb; word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 4px;">
            ${verificationUrl}
          </p>
          
          <p style="color: #666; line-height: 1.6; margin-top: 30px;">
            This link will expire in 24 hours. If you didn't create an account with us, please ignore this email.
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #666; margin: 0; font-size: 14px;">
            © 2024 Smart Event Tickets. All rights reserved.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, name) => {
  const transporter = createTransporter();
  
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: `"Smart Event Tickets" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset Your Password - Smart Event Tickets',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Hi ${name},</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            We received a request to reset your password for your Smart Event Tickets account. Click the button below to reset your password.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            If the button doesn't work, you can copy and paste this link into your browser:
          </p>
          
          <p style="color: #2563eb; word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 4px;">
            ${resetUrl}
          </p>
          
          <p style="color: #666; line-height: 1.6; margin-top: 30px;">
            This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #666; margin: 0; font-size: 14px;">
            © 2024 Smart Event Tickets. All rights reserved.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send ticket confirmation email
const sendTicketConfirmationEmail = async (email, name, tickets, event) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"Smart Event Tickets" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Your Tickets for ${event.title} - Smart Event Tickets`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎫 Your Tickets Are Ready!</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Hi ${name},</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Great news! Your tickets for <strong>${event.title}</strong> have been confirmed. Here are the details:
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
            <h3 style="color: #333; margin-bottom: 15px;">Event Details</h3>
            <p style="color: #666; margin: 5px 0;"><strong>Event:</strong> ${event.title}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Date:</strong> ${new Date(event.date.startDate).toLocaleDateString()}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Time:</strong> ${event.date.time.startTime}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Venue:</strong> ${event.location.venue}</p>
            <p style="color: #666; margin: 5px 0;"><strong>Address:</strong> ${event.location.address.street}, ${event.location.address.city}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
            <h3 style="color: #333; margin-bottom: 15px;">Your Tickets</h3>
            ${tickets.map(ticket => `
              <div style="border: 2px dashed #2563eb; padding: 15px; margin: 10px 0; border-radius: 8px; background: #f8fafc;">
                <p style="color: #333; margin: 5px 0; font-weight: bold;">Ticket #${ticket.ticketNumber}</p>
                <p style="color: #666; margin: 5px 0;">Category: ${ticket.pricingCategory.name}</p>
                <p style="color: #666; margin: 5px 0;">Price: LKR ${ticket.pricingCategory.price}</p>
                <div style="text-align: center; margin: 10px 0;">
                  <div style="background: #f1f5f9; padding: 10px; border-radius: 4px; display: inline-block;">
                    <p style="color: #666; margin: 0; font-size: 12px;">QR Code will be displayed here</p>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="color: #92400e; margin: 0; font-weight: bold;">📱 Important:</p>
            <p style="color: #92400e; margin: 5px 0 0 0;">
              Please bring your mobile device with these tickets to the event. The QR codes will be scanned for entry.
            </p>
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #666; margin: 0; font-size: 14px;">
            © 2024 Smart Event Tickets. All rights reserved.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendTicketConfirmationEmail
};
