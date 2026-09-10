const BREVO_EMAIL_API_URL = "https://api.brevo.com/v3/smtp/email";

function requireEmailConfiguration() {
  const requiredVariables = [
    "BREVO_API_KEY",
    "BREVO_SENDER_EMAIL",
    "BREVO_SENDER_NAME",
  ];
  const missingVariables = requiredVariables.filter((name) => !process.env[name]);

  if (missingVariables.length > 0) {
    throw new Error(`Email service is not configured. Missing: ${missingVariables.join(", ")}`);
  }
}

async function sendEmail({ to, subject, text, html }) {
  requireEmailConfiguration();

  const response = await fetch(BREVO_EMAIL_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: process.env.BREVO_SENDER_NAME,
        email: process.env.BREVO_SENDER_EMAIL,
      },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    let providerCode = "unknown";
    try {
      const providerResponse = await response.json();
      if (typeof providerResponse.code === "string") providerCode = providerResponse.code;
    } catch {
      // The provider did not return a JSON error body.
    }

    console.error(`Brevo email request failed: status ${response.status}, code ${providerCode}.`);
    throw new Error("Email delivery failed. Check the Brevo sender and API key configuration.");
  }
}

export async function sendVerificationOtpEmail({ email, otp }) {
  await sendEmail({
    to: email,
    subject: "Verify your Chatly AI email",
    text: `Your Chatly AI verification code is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`,
    html: `<div style="font-family:Arial,sans-serif;color:#193047"><h2>Verify your email</h2><p>Use this code to finish creating your Chatly AI account:</p><p style="font-size:28px;font-weight:700;letter-spacing:7px;color:#07966f">${otp}</p><p>This code expires in 10 minutes. Do not share it with anyone.</p></div>`,
  });
}

export async function sendPasswordResetOtpEmail({ email, otp }) {
  await sendEmail({
    to: email,
    subject: "Reset your Chatly AI password",
    text: `Your Chatly AI password reset code is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`,
    html: `<div style="font-family:Arial,sans-serif;color:#193047"><h2>Reset your password</h2><p>Use this code to reset your Chatly AI password:</p><p style="font-size:28px;font-weight:700;letter-spacing:7px;color:#07966f">${otp}</p><p>This code expires in 10 minutes. Do not share it with anyone.</p></div>`,
  });
}