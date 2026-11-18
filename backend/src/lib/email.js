// Email delivery via Brevo HTTPS API (preferred on Render) or Brevo/Custom SMTP.
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

function parseFrom(rawFrom) {
  const fallbackName = "BEKA Safe4All";
  const fallbackEmail = "beka.safe4all@gmail.com";
  if (!rawFrom) return { name: fallbackName, email: fallbackEmail };
  const match = rawFrom.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    return {
      name: match[1].replace(/^["']|["']$/g, "").trim() || fallbackName,
      email: match[2].trim(),
    };
  }
  return { name: fallbackName, email: rawFrom.trim() };
}

export async function sendEmail({ to, subject, html, text }) {
  const rawFrom = process.env.SMTP_FROM || "BEKA Safe4All <beka.safe4all@gmail.com>";
  const brevoApiKey = process.env.BREVO_API_KEY;

  // 1. Prefer Brevo HTTP API over HTTPS (port 443 is never blocked by Render)
  if (brevoApiKey) {
    try {
      const sender = parseFrom(rawFrom);
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": brevoApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender,
          to: [{ email: to }],
          subject,
          htmlContent: html,
          ...(text ? { textContent: text } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg = data?.message || `Brevo API HTTP ${res.status}`;
        console.error(`[email] Brevo API failed for ${to}:`, errMsg);
        return { ok: false, error: errMsg };
      }
      return { ok: true, messageId: data?.messageId || "brevo-api" };
    } catch (err) {
      console.error(`[email] Brevo API network error for ${to}:`, err.message);
      return { ok: false, error: err.message };
    }
  }

  // 2. Fallback to Nodemailer SMTP
  const t = getTransporter();
  if (!t) {
    console.warn(`[email] Neither BREVO_API_KEY nor SMTP_* is configured — skipping email to ${to}: "${subject}"`);
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
