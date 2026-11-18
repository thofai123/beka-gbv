import express from "express";
import { prisma } from "../db.js";
import { signToken, hashPassword, comparePassword, requireAuth } from "../auth.js";
import { sendEmail, passwordResetEmailHtml, otpEmailHtml } from "../lib/email.js";
import { randomCode, rateLimit, isLocked, recordFailure, clearFailures } from "../lib/security.js";

const router = express.Router();

function normalizeEmail(raw) {
  return String(raw || "").trim().toLowerCase();
}

function publicUser(u) {
  if (!u) return null;
  const { password_hash, ...rest } = u;
  return rest;
}

// POST /auth/register
router.post("/register", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    const full_name = req.body?.full_name ? String(req.body.full_name).trim() : null;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.email_verified) {
      return res.status(409).json({
        message: "An account with this email already exists. Please sign in instead.",
      });
    }

    let user;
    if (existing && !existing.email_verified) {
      // Incomplete registration: update details & automatically resend fresh verification code
      user = await prisma.user.update({
        where: { email },
        data: {
          password_hash: await hashPassword(password),
          ...(full_name ? { full_name } : {}),
        },
      });
      await prisma.twoFactorCode.updateMany({
        where: { user_email: email, consumed: false, created_by: email },
        data: { consumed: true },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          password_hash: await hashPassword(password),
          full_name,
          role: "survivor",
          created_by: email,
        },
      });
    }

    const code = randomCode();
    await prisma.twoFactorCode.create({
      data: {
        user_email: email,
        code_hash: await hashPassword(code),
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        created_by: email,
      },
    });

    const emailResult = await sendEmail({
      to: email,
      subject: "BEKA — Verify your email",
      html: otpEmailHtml(code),
    });

    if (!emailResult.ok) {
      console.error(`[register] OTP email failed for ${email}:`, emailResult.error || "unknown error");
    }

    res.status(201).json({
      ...publicUser(user),
      email,
      otp_sent: emailResult.ok,
      ...(emailResult.ok ? {} : { email_error: emailResult.error || "Could not send verification email" }),
    });
  } catch (e) { next(e); }
});

// POST /auth/login
router.post("/login", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;
    const loginKey = `login:${email}`;
    if (isLocked(loginKey, 10).locked) {
      return res.status(429).json({ message: "Too many failed sign-in attempts. Please wait a few minutes and try again." });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await comparePassword(password, user.password_hash))) {
      recordFailure(loginKey, 10 * 60 * 1000);
      return res.status(401).json({ message: "Invalid email or password" });
    }
    clearFailures(loginKey);
    const access_token = signToken(user);
    res.json({ access_token, ...publicUser(user) });
  } catch (e) { next(e); }
});

// GET /auth/me
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { email: normalizeEmail(req.user.email) } });
    if (!user) return res.status(404).json({ message: "Not found" });
    res.json(publicUser(user));
  } catch (e) { next(e); }
});

// PATCH /auth/me
router.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const data = { ...req.body };
    delete data.id; delete data.email; delete data.role; delete data.password_hash;
    const user = await prisma.user.update({ where: { email: normalizeEmail(req.user.email) }, data });
    res.json(publicUser(user));
  } catch (e) { next(e); }
});

// POST /auth/logout  (stateless JWT — client drops the token)
router.post("/logout", (_req, res) => res.json({ success: true }));

// POST /auth/verify-otp  (email verification code from /auth/register)
router.post("/verify-otp", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = String(req.body?.otp || "").trim();
    if (!email || !otp) return res.status(400).json({ message: "Email and verification code are required" });

    const record = await prisma.twoFactorCode.findFirst({
      where: { user_email: email, consumed: false, created_by: email },
      orderBy: { created_date: "desc" },
    });
    if (!record) return res.status(400).json({ message: "No active code found — please click Resend" });
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ message: "Code expired — please click Resend" });
    }
    const tried = await prisma.twoFactorCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    if (tried.attempts > 5) {
      await prisma.twoFactorCode.update({ where: { id: record.id }, data: { consumed: true } });
      return res.status(429).json({ message: "Too many wrong attempts — please resend a new code" });
    }
    if (!(await comparePassword(otp, record.code_hash))) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    await prisma.twoFactorCode.update({ where: { id: record.id }, data: { consumed: true } });
    const user = await prisma.user.update({
      where: { email },
      data: { email_verified: true },
    });

    const access_token = signToken(user);
    res.json({ access_token, ...publicUser(user) });
  } catch (e) { next(e); }
});

// POST /auth/resend-otp
router.post("/resend-otp", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await prisma.user.findUnique({ where: { email } });
    const rl = rateLimit(`resend:${email}`, 5, 10 * 60 * 1000);
    if (!rl.ok) return res.status(429).json({ message: "Too many requests. Please wait a few minutes and try again." });
    if (!user) return res.status(404).json({ message: "No pending registration found for this email" });

    await prisma.twoFactorCode.updateMany({ where: { user_email: email, consumed: false, created_by: email }, data: { consumed: true } });
    const code = randomCode();
    await prisma.twoFactorCode.create({
      data: {
        user_email: email,
        code_hash: await hashPassword(code),
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        created_by: email,
      },
    });
    const emailResult = await sendEmail({
      to: email,
      subject: "BEKA — Verify your email",
      html: otpEmailHtml(code),
    });
    if (!emailResult.ok) {
      console.error(`[resend-otp] email failed for ${email}:`, emailResult.error || "unknown error");
      return res.status(502).json({
        success: false,
        delivered: false,
        message: `Failed to send email: ${emailResult.error || "Email delivery error"}`,
      });
    }
    res.json({ success: true, delivered: true });
  } catch (e) { next(e); }
});

// --- Password reset ---
router.post("/reset-password/request", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const user = await prisma.user.findUnique({ where: { email } });
    const rl = rateLimit(`reset:${email}`, 3, 15 * 60 * 1000);
    if (!rl.ok) return res.status(429).json({ message: "Too many requests. Please wait a few minutes and try again." });
    if (user) {
      await prisma.twoFactorCode.updateMany({ where: { user_email: email, consumed: false, created_by: "password-reset" }, data: { consumed: true } });
      const code = randomCode();
      await prisma.twoFactorCode.create({
        data: {
          user_email: email,
          code_hash: await hashPassword(code),
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          created_by: "password-reset",
        },
      });
      await sendEmail({
        to: email,
        subject: "BEKA — Password Reset Code",
        html: passwordResetEmailHtml(code),
      });
    }
    res.json({ success: true });
  } catch (e) { next(e); }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const { reset_token, new_password } = req.body || {};
    if (!email || !reset_token || !new_password) {
      return res.status(400).json({ message: "email, reset_token and new_password required" });
    }
    const record = await prisma.twoFactorCode.findFirst({
      where: { user_email: email, consumed: false, created_by: "password-reset" },
      orderBy: { created_date: "desc" },
    });
    if (!record || new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }
    const tried = await prisma.twoFactorCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    if (tried.attempts > 5) {
      await prisma.twoFactorCode.update({ where: { id: record.id }, data: { consumed: true } });
      return res.status(429).json({ message: "Too many wrong attempts. Please request a new code." });
    }
    if (!(await comparePassword(reset_token, record.code_hash))) {
      return res.status(400).json({ message: "Invalid token" });
    }
    await prisma.user.update({
      where: { email },
      data: { password_hash: await hashPassword(new_password) },
    });
    await prisma.twoFactorCode.update({ where: { id: record.id }, data: { consumed: true } });
    res.json({ success: true });
  } catch (e) { next(e); }
});

router.get("/oauth/:provider", (req, res) => {
  const redirect = req.query.redirect || "/";
  res
    .status(501)
    .send(
      `OAuth provider "${req.params.provider}" is not configured. ` +
      `Implement the handshake here and redirect back to ${redirect} with ?access_token=...`,
    );
});

export default router;
