// Email delivery via Brevo HTTPS API, Gmail HTTPS Bridge, or SMTP fallback.
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
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });
  return transporter;
}

function parseFrom(rawFrom) {
  const match = String(rawFrom || "").match(/^(.*?)<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim().replace(/^"|"$/g, "") || "BEKA Safe4All", email: match[2].trim() };
  }
  return { name: "BEKA Safe4All", email: String(rawFrom || "mthofai@gmail.com").trim() };
}

export async function sendEmail({ to, subject, html, text }) {
  const rawFrom = process.env.SMTP_FROM || "BEKA Safe4All <mthofai@gmail.com>";
  const sender = parseFrom(rawFrom);

  // 1. Brevo Transactional Email HTTP API (HTTPS 443 — fast & reliable on Render)
  if (process.env.BREVO_API_KEY) {
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        signal: AbortSignal.timeout(8000),
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender,
          to: [{ email: to }],
          subject,
          htmlContent: html || `<p>${text || ""}</p>`,
          ...(text ? { textContent: text } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg = data?.message || `Brevo HTTP ${res.status}`;
        console.error(`[email] Brevo failed for ${to}:`, errMsg);
        return { ok: false, error: errMsg };
      }
      return { ok: true, messageId: data?.messageId || "brevo-api" };
    } catch (err) {
      console.error(`[email] Brevo network error for ${to}:`, err.message);
      return { ok: false, error: err.message };
    }
  }

  // 2. Gmail HTTPS Bridge (Google Apps Script Web App)
  const gmailWebhookUrl = process.env.GMAIL_WEBHOOK_URL;
  const gmailWebhookSecret = process.env.GMAIL_WEBHOOK_SECRET;
  if (gmailWebhookUrl && gmailWebhookSecret) {
    try {
      const res = await fetch(gmailWebhookUrl, {
        method: "POST",
        signal: AbortSignal.timeout(8000),
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

  // 3. Fallback to Nodemailer SMTP
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
