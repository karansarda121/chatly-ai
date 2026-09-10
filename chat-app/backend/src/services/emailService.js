import dns from "node:dns";
import net from "node:net";
import nodemailer from "nodemailer";

function requireEmailConfiguration() {
  const requiredVariables = ["SMTP_USER", "SMTP_PASS", "EMAIL_FROM"];
  const missingVariables = requiredVariables.filter((name) => !process.env[name]);

  if (missingVariables.length > 0) {
    throw new Error(`Email service is not configured. Missing: ${missingVariables.join(", ")}`);
  }
}

async function resolveSmtpHost() {
  const hostname = process.env.SMTP_HOST || "smtp.gmail.com";

  if (net.isIP(hostname)) {
    return { host: hostname, tls: undefined };
  }

  try {
    // Render instances may not have an IPv6 route to Gmail. Resolve an IPv4
    // address explicitly while retaining the hostname for TLS certificate checks.
    const [ipv4Address] = await dns.promises.resolve4(hostname);
    if (ipv4Address) {
      return {
        host: ipv4Address,
        tls: { servername: hostname },
      };
    }
  } catch {
    // Fall back to the provider hostname for SMTP services without an IPv4 record.
  }

  return { host: hostname, tls: undefined };
}

async function createTransporter() {
  requireEmailConfiguration();

  const smtpConnection = await resolveSmtpHost();

  return nodemailer.createTransport({
    host: smtpConnection.host,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== "false",
    ...(smtpConnection.tls ? { tls: smtpConnection.tls } : {}),
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 60_000,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendVerificationOtpEmail({ email, otp }) {
  const transporter = await createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Verify your Chatly AI email",
    text: `Your Chatly AI verification code is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your Chatly AI verification code is:</p><h1>${otp}</h1><p>It expires in 10 minutes.</p>`,
  });
}

export async function sendPasswordResetOtpEmail({ email, otp }) {
  const transporter = await createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Reset your Chatly AI password",
    text: `Your Chatly AI password reset code is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your Chatly AI password reset code is:</p><h1>${otp}</h1><p>It expires in 10 minutes.</p>`,
  });
}