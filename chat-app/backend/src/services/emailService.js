import dns from 'node:dns';
import nodemailer from 'nodemailer';

// Some cloud hosts expose no usable IPv6 route. Prefer IPv4 for SMTP hostnames
// so email delivery does not fail before reaching the provider.
dns.setDefaultResultOrder('ipv4first');

function requireEmailConfiguration() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('Email delivery is not configured. Set SMTP_USER and SMTP_PASS.');
  }
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== 'false',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendVerificationOtpEmail({ email, otp }) {
  requireEmailConfiguration();
  await createTransporter().sendMail({
    from: process.env.EMAIL_FROM || `Chatly AI <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Verify your Chatly AI email',
    text: `Your Chatly AI verification code is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`,
    html: `<div style="font-family:Arial,sans-serif;color:#193047"><h2>Verify your email</h2><p>Use this code to finish creating your Chatly AI account:</p><p style="font-size:28px;font-weight:700;letter-spacing:7px;color:#07966f">${otp}</p><p>This code expires in 10 minutes. Do not share it with anyone.</p></div>`,
  });
}
export async function sendPasswordResetOtpEmail({ email, otp }) {
  requireEmailConfiguration();
  await createTransporter().sendMail({
    from: process.env.EMAIL_FROM || `Chatly AI <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Reset your Chatly AI password',
    text: `Your Chatly AI password reset code is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`,
    html: `<div style="font-family:Arial,sans-serif;color:#193047"><h2>Reset your password</h2><p>Use this code to reset your Chatly AI password:</p><p style="font-size:28px;font-weight:700;letter-spacing:7px;color:#07966f">${otp}</p><p>This code expires in 10 minutes. Do not share it with anyone.</p></div>`,
  });
}