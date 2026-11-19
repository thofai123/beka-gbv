// Email delivery via Gmail HTTPS Bridge (Google Apps Script) or SMTP fallback.
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
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
  const rawFrom = process.env.SMTP_FROM || "BEKA Safe4All <mthofai@gmail.com>";

  // 1. Gmail HTTPS Bridge (Google Apps Script Web App — sends over HTTPS 443, never blocked by Render)
  const gmailWebhookUrl = process.env.GMAIL_WEBHOOK_URL;
  const gmailWebhookSecret = process.env.GMAIL_WEBHOOK_SECRET;
  if (gmailWebhookUrl && gmailWebhookSecret) {
    try {
      const res = await fetch(gmailWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        redirect: "follow",
        body: JSON.stringify({
          secret: gmailWebhookSecret,
          to,
          subject,
          html: html || text,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        const errMsg = data?.error || `Gmail bridge HTTP ${res.status}`;
        console.error(`[email] Gmail bridge failed for ${to}:`, errMsg);
        return { ok: false, error: errMsg };
      }
      return { ok: true, messageId: "gmail-bridge" };
    } catch (err) {
      console.error(`[email] Gmail bridge network error for ${to}:`, err.message);
      return { ok: false, error: err.message };
    }
  }

  // 2. Fallback to Nodemailer SMTP
  const t = getTransporter();
  if (!t) {
    console.warn(`[email] No email provider configured — skipping email to ${to}: "${subject}"`);
    return { ok: false, skipped: true, error: "Email service not configured on server" };
  }
  try {
    const info = await t.sendMail({ from: rawFrom, to, subject, html, text });
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[email] SMTP failed to send to ${to}:`, err.message);
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
