import express from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { sendSms, normalizeZambianPhone, buildMapsLink } from "../lib/sms.js";
import { randomCode, rateLimit } from "../lib/security.js";

const router = express.Router();

// Generate the next GBV-YYYY-NNNN case reference.
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
          idempotent: true,
        });
      }
    }

    const caseRef = await nextCaseRef();
    const mapsLink = buildMapsLink(location_lat, location_lng);

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
        description: `Emergency panic alert triggered by ${req.user.email}`,
        status: "dispatched",
        risk_level: "critical",
        report_source: "panic_alert",
        reporter_email: req.user.email,
        reporter_user_id: req.user.sub,
        location_lat: location_lat ?? null,
        location_lng: location_lng ?? null,
        location_description: mapsLink || null,
        channel: "app",
        created_by: req.user.email,
      },
    });

    await prisma.panicAlert.update({
      where: { id: panicAlert.id },
      data: { linked_case_id: newCase.id },
    });

    await notifyStaff(
      "🚨 Panic alert",
      `A panic alert (${caseRef}) was triggered.${mapsLink ? " Location: " + mapsLink : ""}`,
      "panic_alert",
      newCase.id,
    );

    // Notify the survivor's emergency contacts by SMS (best-effort).
    const contactWhere = { created_by: req.user.email };
    if (Array.isArray(selected_contact_ids)) {
      contactWhere.id = { in: selected_contact_ids };
    }
    const contacts = await prisma.emergencyContact.findMany({
      where: contactWhere,
    });
    const smsResults = await Promise.all(
      contacts.map((c) =>
        sendSms(
          c.phone,
          `Emergency alert: ${req.user.email} may need help.${
            c.notify_location && mapsLink ? " Location: " + mapsLink : ""
          }`,
        ).catch(() => ({ ok: false })),
      ),
    );

    res.json({
      success: true,
      case_id: newCase.id,
      case_ref: caseRef,
      alert_id: panicAlert.id,
      contacts_notified: smsResults.filter((r) => r.ok).length,
    });
  } catch (e) { next(e); }
});

// POST /functions/submitReport
router.post("/submitReport", requireAuth, async (req, res, next) => {
  try {
    const b = req.body || {};
    const caseRef = await nextCaseRef();

    const newCase = await prisma.case.create({
      data: {
        case_id: caseRef,
        incident_type: b.incident_type,
        description: b.description,
        status: "received",
        risk_level: b.risk_level || "medium",
        ai_summary: b.ai_summary || null,
        is_anonymous: !!b.is_anonymous,
        reporter_email: b.is_anonymous ? null : (b.reporter_email || req.user.email),
        reporter_user_id: b.is_anonymous ? null : (b.reporter_user_id || req.user.sub),
        survivor_name: b.survivor_name || null,
        survivor_contact: b.survivor_contact || null,
        location_lat: b.location_lat ?? null,
        location_lng: b.location_lng ?? null,
        location_captured_at: b.location_captured_at || null,
        location_description: b.location_description || null,
        attachments: Array.isArray(b.attachments) ? b.attachments : [],
        report_source: "report",
        channel: b.channel || "app",
        created_by: req.user.email,
      },
    });

    await notifyStaff(
      "New incident report",
      `A new ${b.incident_type} report (${caseRef}) was submitted.`,
      "case_update",
      newCase.id,
    );

    res.json(newCase);
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

export default router;
