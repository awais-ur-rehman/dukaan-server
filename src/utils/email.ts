import nodemailer from 'nodemailer';
import { config } from '../config/env';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

export const sendOTPEmail = async (email: string, otp: string, otpId: string): Promise<void> => {
  const mailOptions = {
    from: config.smtp.from,
    to: email,
    subject: 'Your Dukaan OTP Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your OTP Code</h2>
        <p>Your verification code is:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 5px; margin: 20px 0;">
          <strong>${otp}</strong>
        </div>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendNotificationEmail = async (
  email: string,
  subject: string,
  html: string
): Promise<void> => {
  const mailOptions = {
    from: config.smtp.from,
    to: email,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

