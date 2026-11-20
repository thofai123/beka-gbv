import express from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { sendSms, normalizeZambianPhone, buildMapsLink } from "../lib/sms.js";
import { sendEmail } from "../lib/email.js";
import { randomCode, rateLimit } from "../lib/security.js";

const router = express.Router();

// Generate the next GBV-YYYY-NNNN case reference.

async function reverseGeocodeArea(lat, lng) {
  if (lat == null || lng == null) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=17&addressdetails=1`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "BEKA-Safe4All/1.0 (emergency-response)" },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data?.address || {};
    const parts = [
      addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood,
      addr.city_district || addr.town || addr.city || addr.county,
      addr.state,
    ].filter(Boolean);
    const unique = [...new Set(parts)];
    if (unique.length > 0) return unique.join(", ");
    if (data?.display_name) {
      return data.display_name.split(",").slice(0, 3).map((s) => s.trim()).join(", ");
    }
    return null;
  } catch {
    return null;
  }
}

async function nextCaseRef() {
  const year = new Date().getFullYear();
  const latest = await prisma.case.findFirst({
    where: { case_id: { startsWith: `GBV-${year}-` } },
    orderBy: { created_date: "desc" },
  });
  let n = 0;
  if (latest?.case_id) n = parseInt(latest.case_id.split("-")[2] || "0", 10) || 0;
  return `GBV-${year}-${String(n + 1).padStart(4, "0")}`;
}

async function notifyStaff(title, body, type, relatedCaseId) {
  const staff = await prisma.user.findMany({
    where: { role: { in: ["admin", "responder"] } },
  });
  await Promise.all(
    staff.map((s) =>
      prisma.notification.create({
        data: {
          recipient_email: s.email,
          title,
          body,
          type,
          related_case_id: relatedCaseId || null,
        },
      }),
    ),
  );
}

// POST /functions/triggerEmergency
router.post("/triggerEmergency", requireAuth, async (req, res, next) => {
  try {
    const { location_lat, location_lng, is_silent, client_idempotency_key, selected_contact_ids } = req.body || {};

    if (client_idempotency_key) {
      const existing = await prisma.panicAlert.findUnique({
        where: { client_idempotency_key },
      });
      if (existing) {
        return res.json({
          success: true,
          case_id: existing.linked_case_id,
          alert_id: existing.id,
          idempotent: true,
        });
      }
    }

    const sender = await prisma.user.findUnique({ where: { email: req.user.email } }).catch(() => null);
    const senderLabel = sender?.full_name ? `${sender.full_name} (${req.user.email})` : req.user.email;
    const caseRef = await nextCaseRef();
    const mapsLink = buildMapsLink(location_lat, location_lng);
    const areaName = await reverseGeocodeArea(location_lat, location_lng);
    const formattedLocation = areaName
      ? `${areaName} (${Number(location_lat).toFixed(5)}, ${Number(location_lng).toFixed(5)})`
      : mapsLink
      ? `GPS ${Number(location_lat).toFixed(5)}, ${Number(location_lng).toFixed(5)}`
      : "GPS unavailable at trigger time";
    const triggeredAt = new Date().toISOString();

    const panicAlert = await prisma.panicAlert.create({
      data: {
        location_lat: location_lat ?? null,
        location_lng: location_lng ?? null,
        status: "triggered",
        is_silent: !!is_silent,
        client_idempotency_key: client_idempotency_key || null,
        created_by: req.user.email,
      },
    });

    const newCase = await prisma.case.create({
      data: {
        case_id: caseRef,
        incident_type: "other",
        description: `Emergency SOS alert triggered by ${senderLabel} — Area: ${formattedLocation}`,
        status: "dispatched",
        risk_level: "critical",
        report_source: "panic_alert",
        survivor_name: sender?.full_name || null,
        survivor_contact: sender?.phone || req.user.email,
        reporter_email: req.user.email,
        reporter_user_id: req.user.sub,
        location_lat: location_lat ?? null,
        location_lng: location_lng ?? null,
        location_description: formattedLocation,
        channel: "app",
        created_by: req.user.email,
      },
    });

    await prisma.panicAlert.update({
      where: { id: panicAlert.id },
      data: { linked_case_id: newCase.id },
    });

    await notifyStaff(
      `🚨 Emergency Alert (${caseRef})`,
      `${senderLabel} triggered an emergency alert.${mapsLink ? " Location: " + mapsLink : ""}`,
      "panic_alert",
      newCase.id,
    );

    // Notify admins/responders via email as well (best-effort)
    const staff = await prisma.user.findMany({
      where: { role: { in: ["admin", "responder"] } },
    });
    Promise.all(
      staff.map((s) =>
        sendEmail({
          to: s.email,
          subject: `🚨 BEKA EMERGENCY ALERT [${caseRef}] — ${sender?.full_name || req.user.email}`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:16px;border:1px solid #ef4444;border-radius:12px;">
              <h2 style="color:#dc2626;margin-top:0;">🚨 Emergency SOS Triggered</h2>
              <p><strong>Case ID:</strong> ${caseRef}</p>
              <p><strong>User:</strong> ${senderLabel}</p>
              <p><strong>Phone:</strong> ${sender?.phone || "Not on file"}</p>
              <p><strong>Time:</strong> ${triggeredAt}</p>
              <p><strong>Location:</strong> ${mapsLink ? `<a href="${mapsLink}">${mapsLink}</a>` : "GPS unavailable"}</p>
            </div>
          `,
          text: `EMERGENCY SOS [${caseRef}] from ${senderLabel} at ${triggeredAt}. Location: ${mapsLink || "Unavailable"}`,
        }).catch(() => ({ ok: false }))
      )
    );

    // Notify the survivor's emergency contacts by SMS + Email (if email exists)
    const contactWhere = { created_by: req.user.email };
    if (Array.isArray(selected_contact_ids) && selected_contact_ids.length > 0) {
      contactWhere.id = { in: selected_contact_ids };
    }
    const contacts = await prisma.emergencyContact.findMany({
      where: contactWhere,
      orderBy: { priority: "asc" },
    });

    const smsText = `BEKA EMERGENCY [${caseRef}]: ${sender?.full_name || req.user.email} needs urgent help!${areaName ? " Area: " + areaName : ""}${mapsLink ? " Map: " + mapsLink : ""}`;

    const smsResults = await Promise.all(
      contacts.map(async (c) => {
        const msg = `BEKA EMERGENCY [${caseRef}]: ${sender?.full_name || req.user.email} needs urgent help!${c.notify_location && mapsLink ? " Location: " + mapsLink : ""}`;
        const smsRes = c.phone ? await sendSms(c.phone, msg).catch(() => ({ ok: false })) : { ok: false };
        if (c.email) {
          await sendEmail({
            to: c.email,
            subject: `🚨 Emergency Alert from ${sender?.full_name || req.user.email} [${caseRef}]`,
            text: msg,
            html: `<p><strong>🚨 Emergency Alert [${caseRef}]</strong></p><p>${msg}</p>`,
          }).catch(() => ({ ok: false }));
        }
        return smsRes;
      }),
    );

    res.json({
      success: true,
      case_id: newCase.id,
      case_ref: caseRef,
      alert_id: panicAlert.id,
      sms_message: smsText,
      maps_link: mapsLink,
      contacts: contacts.map((c) => ({ id: c.id, name: c.name, phone: c.phone })),
      contacts_notified: smsResults.filter((r) => r.ok).length,
      sms_skipped: smsResults.some((r) => r.skipped),
    });
  } catch (e) { next(e); }
});

// POST /functions/submitReport
router.post("/submitReport", requireAuth, async (req, res, next) => {
  try {
    const b = req.body || {};
    const caseRef = await nextCaseRef();
    const submitter = await prisma.user.findUnique({ where: { email: req.user.email } }).catch(() => null);

    const reportArea = !b.location_description && b.location_lat != null && b.location_lng != null
      ? await reverseGeocodeArea(b.location_lat, b.location_lng)
      : null;

    const attachments = Array.isArray(b.attachments) ? b.attachments.filter(Boolean) : [];
    const resolvedName = b.is_anonymous
      ? null
      : (b.survivor_name || submitter?.full_name || [submitter?.first_name, submitter?.last_name].filter(Boolean).join(" ") || null);
    const resolvedContact = b.is_anonymous
      ? null
      : (b.survivor_contact || submitter?.phone || req.user.email || null);
    const resolvedEmail = b.is_anonymous
      ? null
      : (b.reporter_email || req.user.email || null);

    const newCase = await prisma.case.create({
      data: {
        case_id: caseRef,
        incident_type: b.incident_type,
        description: b.description,
        status: "received",
        risk_level: b.risk_level || "medium",
        ai_summary: b.ai_summary || null,
        is_anonymous: !!b.is_anonymous,
        reporter_email: resolvedEmail,
        reporter_user_id: b.is_anonymous ? null : (b.reporter_user_id || req.user.sub),
        survivor_name: resolvedName,
        survivor_contact: resolvedContact,
        location_lat: b.location_lat ?? null,
        location_lng: b.location_lng ?? null,
        location_captured_at: b.location_captured_at || null,
        location_description: b.location_description || reportArea || null,
        attachments,
        report_source: "report",
        channel: b.channel || "app",
        created_by: req.user.email,
      },
    });

    // Also mirror every uploaded attachment into EvidenceVault linked to this case so admins see all scene photos immediately
    if (attachments.length > 0) {
      await Promise.all(
        attachments.map((url, idx) => {
          const isImg = /\.(png|jpe?g|gif|webp|heic)$/i.test(url);
          const isAudio = /\.(mp3|wav|ogg|m4a)$/i.test(url);
          return prisma.evidenceVault.create({
            data: {
              file_url: url,
              file_name: decodeURIComponent(String(url).split("/").pop() || `Attachment-${idx + 1}`),
              file_type: isImg ? "photo" : isAudio ? "audio" : "document",
              description: `Submitted with incident report ${caseRef}`,
              case_id: newCase.id,
              case_ref: caseRef,
              is_sensitive: true,
              created_by: req.user.email,
            },
          }).catch(() => null);
        })
      );
    }

    await notifyStaff(
      "New incident report",
      `A new ${b.incident_type} report (${caseRef}) was submitted${resolvedName ? " by " + resolvedName : ""}.`,
      "case_update",
      newCase.id,
    );

    res.json({
      ...newCase,
      success: true,
      case_id: newCase.id,
      case_ref: caseRef,
    });
  } catch (e) { next(e); }
});

// POST /functions/sendOTP
router.post("/sendOTP", requireAuth, async (req, res, next) => {
  try {
    const phone = normalizeZambianPhone(req.body?.phoneNumber);
    const rlUser = rateLimit(`sendotp:${req.user.email}`, 3, 10 * 60 * 1000);
    const rlPhone = rateLimit(`sendotp-phone:${phone}`, 3, 10 * 60 * 1000);
    if (!rlUser.ok || !rlPhone.ok) {
      return res.status(429).json({ error: "Too many code requests. Please wait a few minutes and try again." });
    }
    const otp = randomCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await prisma.otpVerification.deleteMany({ where: { phone, verified: false } });
    await prisma.otpVerification.create({
      data: { phone, otp, expires_at: expiresAt, verified: false, created_by: req.user.email },
    });

    const result = await sendSms(phone, `Your BEKA verification code is ${otp}. It expires in 10 minutes.`);
    console.log(`[otp] sms to ***${phone.slice(-4)} ok=${result.ok} status=${result.status} skipped=${!!result.skipped} body=${result.body}`);
    if (!result.ok && !(result.skipped && process.env.NODE_ENV !== "production")) {
      return res.status(502).json({ error: "We couldn't send the code to that number. Please try again shortly." });
    }
    res.json({ success: true, delivered: !!result.ok, skipped: !!result.skipped });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /functions/verifyOTP
router.post("/verifyOTP", requireAuth, async (req, res, next) => {
  try {
    const phone = normalizeZambianPhone(req.body?.phoneNumber);
    const otp = String(req.body?.otp || "");

    const rl = rateLimit(`verifyotp:${req.user.email}:${phone}`, 5, 10 * 60 * 1000);
    if (!rl.ok) {
      return res.status(429).json({ error: "Too many attempts. Please wait a few minutes and try again." });
    }
    const record = await prisma.otpVerification.findFirst({
      where: { phone, otp, verified: false, created_by: req.user.email },
      orderBy: { created_date: "desc" },
    });
    if (!record) return res.status(400).json({ error: "Invalid code" });
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ error: "Code expired" });
    }

    await prisma.otpVerification.update({ where: { id: record.id }, data: { verified: true } });
    await prisma.user.update({
      where: { email: req.user.email },
      data: { phone, phone_verified: true },
    });

    res.json({ success: true, verified: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /functions/redeemAccessCode
router.post("/redeemAccessCode", requireAuth, async (req, res, next) => {
  try {
    const code = String(req.body?.code || "").trim().toUpperCase();
    const access = await prisma.accessCode.findFirst({ where: { code, is_active: true } });
    if (!access) return res.status(400).json({ error: "Invalid or inactive code" });

    const updated = await prisma.user.update({
      where: { email: req.user.email },
      data: { role: access.role },
    });
    res.json({ success: true, role: updated.role });
  } catch (e) { next(e); }
});

// POST /functions/acknowledgeAlert
router.post("/acknowledgeAlert", requireAuth, requireRole("admin", "responder"), async (req, res, next) => {
  try {
    const { alert_id } = req.body || {};
    const alert = await prisma.panicAlert.update({
      where: { id: alert_id },
      data: {
        status: "acknowledged",
        responder_email: req.user.email,
      },
    });
    if (alert.linked_case_id) {
      await prisma.case.update({
        where: { id: alert.linked_case_id },
        data: { status: "acknowledged", acknowledged_at: new Date().toISOString(), acknowledged_by: req.user.email },
      });
    }
    res.json({ success: true, alert });
  } catch (e) { next(e); }
});

// POST /functions/updateCaseStatus
router.post("/updateCaseStatus", requireAuth, requireRole("admin", "responder"), async (req, res, next) => {
  try {
    const { case_id, status, note } = req.body || {};
    const before = await prisma.case.findUnique({ where: { id: case_id } });
    if (!before) return res.status(404).json({ error: "Case not found" });

    const updated = await prisma.case.update({ where: { id: case_id }, data: { status } });
    await prisma.caseUpdate.create({
      data: {
        case_id,
        update_type: "status_change",
        note: note || null,
        old_value: before.status,
        new_value: status,
        updated_by_name: req.user.email,
        created_by: req.user.email,
      },
    });
    res.json({ success: true, case: updated });
  } catch (e) { next(e); }
});

// POST /functions/updateLiveLocation
router.post("/updateLiveLocation", requireAuth, async (req, res, next) => {
  try {
    const { location_lat, location_lng } = req.body || {};
    await prisma.user.update({
      where: { email: req.user.email },
      data: { location_lat, location_lng, location_updated_at: new Date().toISOString() },
    });
    res.json({ success: true });
  } catch (e) { next(e); }
});

// POST /functions/getLivePosition
router.post("/getLivePosition", requireAuth, requireRole("admin", "responder"), async (req, res, next) => {
  try {
    const { email } = req.body || {};
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "Not found" });
    res.json({
      location_lat: user.location_lat,
      location_lng: user.location_lng,
      location_updated_at: user.location_updated_at,
    });
  } catch (e) { next(e); }
});

// POST /functions/notifyEmergencyContacts
router.post("/notifyEmergencyContacts", requireAuth, async (req, res, next) => {
  try {
    const { message } = req.body || {};
    const contacts = await prisma.emergencyContact.findMany({ where: { created_by: req.user.email } });
    const results = await Promise.all(
      contacts.map((c) => sendSms(c.phone, message || "Emergency: please check on me.").catch(() => ({ ok: false }))),
    );
    res.json({ success: true, notified: results.filter((r) => r.ok).length, total: contacts.length });
  } catch (e) { next(e); }
});

// POST /functions/checkEscalations  (intended to run on a schedule)
router.post("/checkEscalations", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000);
    const stale = await prisma.case.findMany({
      where: { status: { in: ["received", "dispatched"] }, created_date: { lt: cutoff } },
    });
    await Promise.all(
      stale.map((c) =>
        prisma.case.update({
          where: { id: c.id },
          data: { status: "escalated", escalation_count: (c.escalation_count || 0) + 1 },
        }),
      ),
    );
    res.json({ success: true, escalated: stale.length });
  } catch (e) { next(e); }
});

// POST /functions/sendAlertSMS
router.post("/sendAlertSMS", requireAuth, requireRole("admin", "responder"), async (req, res, next) => {
  try {
    const { phone, message } = req.body || {};
    const result = await sendSms(phone, message);
    res.json({ success: result.ok, skipped: !!result.skipped });
  } catch (e) { next(e); }
});

// POST /functions/testSMS
router.post("/testSMS", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const { phone } = req.body || {};
    const result = await sendSms(phone, "BEKA test message — SMS delivery is working.");
    res.json({ success: result.ok, status: result.status, skipped: !!result.skipped });
  } catch (e) { next(e); }
});

// POST /functions/whatsappWebhook  (inbound WhatsApp — provider posts here)
router.post("/whatsappWebhook", async (req, res) => {
  // Verify your WhatsApp provider's signature here before trusting the payload.
  console.log("[whatsappWebhook] received:", JSON.stringify(req.body).slice(0, 300));
  res.json({ received: true });
});


// POST /functions/verifyAdminPin
router.post("/verifyAdminPin", requireAuth, requireRole("admin"), (req, res) => {
  const expectedPin = process.env.ADMIN_TEAM_PIN || "1126";
  const provided = String(req.body?.pin || "").trim();
  if (provided !== expectedPin) {
    return res.status(403).json({ valid: false, message: "Incorrect Admin PIN." });
  }
  return res.json({ valid: true });
});

// POST /functions/inviteAdmin
router.post("/inviteAdmin", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const expectedPin = process.env.ADMIN_TEAM_PIN || "1126";
    const pin = String(req.body?.pin || "").trim();
    if (pin !== expectedPin) {
      return res.status(403).json({ message: "Invalid Admin PIN (1126 required)." });
    }

    const email = String(req.body?.email || "").trim().toLowerCase();
    const fullName = String(req.body?.full_name || "").trim();
    const phone = String(req.body?.phone || "").trim();
    const profilePicture = req.body?.profile_picture ? String(req.body.profile_picture).trim() : null;

    if (!email || !email.includes("@")) {
      return res.status(400).json({ message: "A valid email address is required." });
    }
    if (!fullName) {
      return res.status(400).json({ message: "Full name is required." });
    }
    if (!phone) {
      return res.status(400).json({ message: "Contact phone line is required." });
    }

    const tempPassword = "BEKA-" + Math.random().toString(36).slice(2, 8).toUpperCase() + "!";
    const { hashPassword } = await import("../auth.js");
    const existing = await prisma.user.findUnique({ where: { email } });

    let adminUser;
    if (existing) {
      adminUser = await prisma.user.update({
        where: { email },
        data: {
          role: "admin",
          full_name: fullName,
          phone,
          email_verified: true,
          ...(profilePicture ? { profile_picture: profilePicture } : {}),
          ...(!existing.password_hash ? { password_hash: await hashPassword(tempPassword) } : {}),
        },
      });
    } else {
      adminUser = await prisma.user.create({
        data: {
          email,
          full_name: fullName,
          phone,
          role: "admin",
          email_verified: true,
          password_hash: await hashPassword(tempPassword),
          profile_picture: profilePicture,
          created_by: req.user.email,
        },
      });
    }

    const appUrl = process.env.FRONTEND_URL || "https://beka-app.onrender.com/beka/login";
    const inviter = req.user.email;
    const credsHtml = existing?.password_hash
      ? "<p>Sign in with your existing BEKA account password to access the Admin Console immediately.</p>"
      : `<p><strong>Temporary Password:</strong> <code style="background:#f3f4f6;padding:4px 8px;border-radius:6px;font-size:14px;">${tempPassword}</code></p><p>Use this email and temporary password to sign in (you can reset your password anytime from the login screen).</p>`;

    const emailRes = await sendEmail({
      to: email,
      subject: "BEKA — You have been assigned Admin Console Access",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="color:#e05028;margin-top:0;">BEKA Admin Access Granted</h2>
          <p>Hello <strong>${fullName}</strong>,</p>
          <p><strong>${inviter}</strong> has added you as an <strong>Administrator</strong> on the BEKA Emergency Response Platform.</p>
          <p><strong>Assigned Details:</strong><br/>Email: ${email}<br/>Phone: ${phone}</p>
          ${credsHtml}
          <p style="margin-top:20px;">
            <a href="${appUrl}" style="display:inline-block;background:#e05028;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700;">
              Open BEKA Admin Console
            </a>
          </p>
        </div>
      `,
      text: `Hello ${fullName}, you have been granted BEKA Admin access by ${inviter}. Login at ${appUrl} with email ${email}${existing?.password_hash ? "" : " and temporary password: " + tempPassword}`,
    }).catch((err) => ({ ok: false, error: err?.message || "SMTP error" }));

    const { password_hash, ...safeUser } = adminUser;
    res.status(201).json({
      success: true,
      user: safeUser,
      email_sent: !!emailRes?.ok,
      email_error: emailRes?.ok ? null : (emailRes?.error || "Email notification could not be delivered"),
    });
  } catch (e) { next(e); }
});


// POST /functions/deleteTeamMember
router.post("/deleteTeamMember", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const expectedPin = process.env.ADMIN_TEAM_PIN || "1126";
    const pin = String(req.body?.pin || "").trim();
    if (pin !== expectedPin) {
      return res.status(403).json({ message: "Invalid Admin PIN (1126 required to delete)." });
    }

    const userId = String(req.body?.user_id || "").trim();
    if (!userId) {
      return res.status(400).json({ message: "user_id is required." });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      return res.status(404).json({ message: "Team member not found." });
    }

    if (target.email.toLowerCase() === req.user.email.toLowerCase()) {
      return res.status(400).json({ message: "You cannot delete your own active admin account." });
    }

    if (target.role === "admin") {
      const adminCount = await prisma.user.count({ where: { role: "admin" } });
      if (adminCount <= 1) {
        return res.status(400).json({ message: "Cannot delete the last remaining administrator." });
      }
    }

    await prisma.user.delete({ where: { id: userId } });
    return res.json({ success: true, deleted_id: userId, deleted_email: target.email });
  } catch (e) { next(e); }
});


// POST /functions/updateTeamMember
router.post("/updateTeamMember", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const userId = String(req.body?.user_id || "").trim();
    if (!userId) {
      return res.status(400).json({ message: "user_id is required." });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      return res.status(404).json({ message: "Team member not found." });
    }

    const allowedRoles = ["admin", "responder", "survivor"];
    const nextRole = allowedRoles.includes(req.body?.role) ? req.body.role : target.role;

    if (target.role === "admin" && nextRole !== "admin") {
      const adminCount = await prisma.user.count({ where: { role: "admin" } });
      if (adminCount <= 1) {
        return res.status(400).json({ message: "Cannot remove admin role from the last remaining administrator." });
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(req.body?.full_name !== undefined ? { full_name: String(req.body.full_name || "").trim() || target.full_name } : {}),
        role: nextRole,
        ...(req.body?.phone !== undefined ? { phone: String(req.body.phone || "").trim() || null } : {}),
        ...(req.body?.profile_picture !== undefined ? { profile_picture: req.body.profile_picture || null } : {}),
      },
    });

    const { password_hash, ...safeUser } = updated;
    return res.json({ success: true, user: safeUser });
  } catch (e) { next(e); }
});

export default router;
