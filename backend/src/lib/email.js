// Email delivery via Brevo SMTP (Nodemailer).
// If SMTP_HOST/SMTP_USER/SMTP_PASS are not set, sends are logged and
// skipped so the app works in development without live credentials.
import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
  const from = process.env.SMTP_FROM || "BEKA Safe4All <beka.safe4all@gmail.com>";
  const t = getTransporter();
  if (!t) {
    console.warn(`[email] SMTP not configured — skipping email to ${to}: "${subject}"`);
    return { ok: false, skipped: true };
  }
  try {
    const info = await t.sendMail({ from, to, subject, html, text });
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[email] failed to send to ${to}:`, err.message);
    return { ok: false, error: err.message };
  }
}

export function passwordResetEmailHtml(code) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #E84B1D;">BEKA — Password Reset</h2>
      <p>Your password reset code is:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${code}</p>
      <p style="color: #666; font-size: 13px;">This code expires in 15 minutes. If you didn't request this, you can ignore this email.</p>
    </div>
  `;
}

export function otpEmailHtml(code) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #E84B1D;">BEKA — Verify your email</h2>
      <p>Your verification code is:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${code}</p>
      <p style="color: #666; font-size: 13px;">This code expires in 10 minutes.</p>
    </div>
  `;
}
