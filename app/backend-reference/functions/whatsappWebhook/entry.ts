// Public webhook for inbound WhatsApp messages from survivors.
// Implements a conversational intake flow:
//   greeting → incident_type → description → location → anonymous_choice → [name] → submit
//
// Each completed conversation creates a Case (channel="whatsapp"). Survivor phone
// is stored masked for follow-up; raw number kept on the session only while the
// conversation is active so we can reply.
//
// Compatible with Africa's Talking inbound WhatsApp + can be adapted for Meta WA Cloud API.
// AT inbound payload (form-encoded): { from, to, text, ... }
// Meta payload (JSON): { entry: [{ changes: [{ value: { messages: [...] } }] }] }

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

const AT_API_KEY = Deno.env.get("AT_API_KEY");
const AT_USERNAME = Deno.env.get("AT_USERNAME");
// Default to AT's sandbox WhatsApp number; can be overridden via env var if set
const WA_NUMBER = (typeof Deno !== "undefined" && Deno.env.toObject?.()["AT_WA_NUMBER"]) || "+254711082000";

const INCIDENT_OPTIONS = [
  { key: "1", value: "physical_violence", label: "Physical violence" },
  { key: "2", value: "sexual_violence", label: "Sexual violence" },
  { key: "3", value: "emotional_abuse", label: "Emotional abuse" },
  { key: "4", value: "economic_abuse", label: "Economic abuse" },
  { key: "5", value: "stalking", label: "Stalking" },
  { key: "6", value: "trafficking", label: "Trafficking" },
  { key: "7", value: "forced_marriage", label: "Forced marriage" },
  { key: "8", value: "other", label: "Other" },
];

function maskPhone(phone) {
  if (!phone) return "ANON";
  const digits = phone.replace(/\D/g, "");
  return `WA-${digits.slice(0, 3)}***${digits.slice(-2)}`;
}

async function sendWA(toPhone, message) {
  if (AT_USERNAME === "sandbox" || !AT_API_KEY) {
    console.log(`[WA-SANDBOX] -> ${toPhone}: ${message}`);
    return { ok: true, simulated: true };
  }
  try {
    const res = await fetch("https://content.africastalking.com/whatsapp/message/send", {
      method: "POST",
      headers: {
        "apiKey": AT_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        username: AT_USERNAME,
        waNumber: WA_NUMBER,
        phoneNumber: toPhone,
        body: { message },
      }),
    });
    const text = await res.text();
    return { ok: res.ok, body: text.slice(0, 200) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Parse inbound message — supports both AT (form) and Meta (JSON) shapes
async function parseInbound(req) {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const body = await req.json();
    // Meta WhatsApp Cloud API
    if (body.entry) {
      const msg = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if (msg) return { from: `+${msg.from}`, text: msg.text?.body || "" };
    }
    // Generic JSON
    if (body.from && (body.text || body.body)) {
      return { from: body.from, text: body.text || body.body };
    }
  }
  // Africa's Talking form-encoded
  const form = await req.formData();
  return {
    from: form.get("from") || "",
    text: (form.get("text") || form.get("message") || "").toString().trim(),
  };
}

const greeting = `🙏 Hello, you've reached BEKA.
You are not alone. This is a free, confidential service under the Anti-GBV Act.

Reply *HELP* anytime to restart, or *STOP* to end.

What kind of incident would you like to report?
${INCIDENT_OPTIONS.map((o) => `${o.key}. ${o.label}`).join("\n")}

Reply with the number (1-8).`;

function nextPrompt(step) {
  switch (step) {
    case "description":
      return "Thank you. Please describe what happened in your own words. Include as much or as little detail as you feel safe sharing.";
    case "location":
      return "Where did this happen? You can share the area, district, or address (e.g. 'Kabwata, Lusaka').";
    case "anonymous_choice":
      return "Would you like to report this *anonymously* or share your name?\n\nReply *1* for Anonymous\nReply *2* to share your name";
    case "name":
      return "Please share your first name (or how you'd like to be called):";
    default:
      return greeting;
  }
}

async function getOrCreateSession(base44, phone) {
  const existing = await base44.asServiceRole.entities.WhatsAppSession.filter(
    { phone, is_active: true },
    "-created_date",
    1
  );
  if (existing.length > 0) return existing[0];
  return base44.asServiceRole.entities.WhatsAppSession.create({
    phone,
    phone_masked: maskPhone(phone),
    step: "greeting",
    draft: {},
    is_active: true,
  });
}

async function submitCase(base44, session) {
  const masked = session.phone_masked;
  const d = session.draft || {};
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const caseRef = `GBV-${year}-${rand}`;

  // Find a default response unit
  const units = await base44.asServiceRole.entities.ResponseUnit.filter({ is_active: true }, "-created_date", 1);
  const unit = units[0];

  const newCase = await base44.asServiceRole.entities.Case.create({
    case_id: caseRef,
    incident_type: d.incident_type || "other",
    description: d.description || "(no description)",
    status: "received",
    risk_level: "high",
    is_anonymous: !!d.is_anonymous,
    survivor_name: d.is_anonymous ? "" : (d.name || masked),
    survivor_contact: masked, // store masked WA ref, never raw
    location_description: d.location || "",
    channel: "whatsapp",
    report_source: "report",
    assigned_unit_id: unit?.id || null,
    assigned_unit_name: unit?.name || null,
  });

  await base44.asServiceRole.entities.CaseUpdate.create({
    case_id: newCase.id,
    update_type: "status_change",
    note: `Report received via WhatsApp from ${masked}.`,
    new_value: "received",
    updated_by_name: "WhatsApp Bot",
  });

  // Notify responders + admins (in-app)
  const [responders, admins] = await Promise.all([
    base44.asServiceRole.entities.User.filter({ role: "responder" }),
    base44.asServiceRole.entities.User.filter({ role: "admin" }),
  ]);
  for (const u of [...responders, ...admins]) {
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: u.email,
      title: `📱 New WhatsApp report`,
      body: `Case ${caseRef} from ${masked}. ${(d.incident_type || "other").replace(/_/g, " ")}.`,
      type: "case_update",
      related_case_id: newCase.id,
    });
  }

  await base44.asServiceRole.entities.WhatsAppSession.update(session.id, {
    step: "submitted",
    is_active: false,
    linked_case_id: newCase.id,
  });

  return caseRef;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    if (req.method === "GET") {
      // Webhook verification (Meta-style)
      const url = new URL(req.url);
      const challenge = url.searchParams.get("hub.challenge");
      if (challenge) return new Response(challenge, { status: 200 });
      return Response.json({ ok: true });
    }

    const { from, text } = await parseInbound(req);
    if (!from || !text) {
      return Response.json({ ok: true, ignored: true });
    }

    const lower = text.toLowerCase().trim();

    // Quick "report ..." intent — single-message report via WhatsApp
    if (lower.startsWith("report")) {
      const year = new Date().getFullYear();
      const rand = Math.floor(1000 + Math.random() * 9000);
      const caseRef = `GBV-${year}-${rand}`;
      const newCase = await base44.asServiceRole.entities.Case.create({
        case_id: caseRef,
        incident_type: "other",
        status: "open",
        channel: "whatsapp",
        reporter_phone: from,
        description: text,
        is_anonymous: false,
      });
      await sendWA(from, `Thank you. Your report has been received. A case worker will follow up shortly. Reference: ${newCase.case_id}`);
      return Response.json({ ok: true, reported: newCase.case_id });
    }

    const session = await getOrCreateSession(base44, from);

    // Restart command
    if (lower === "help" || lower === "restart") {
      await base44.asServiceRole.entities.WhatsAppSession.update(session.id, {
        step: "incident_type",
        draft: {},
      });
      await sendWA(from, greeting);
      return Response.json({ ok: true, action: "restart" });
    }
    if (lower === "stop") {
      await base44.asServiceRole.entities.WhatsAppSession.update(session.id, { is_active: false });
      await sendWA(from, "You've ended the session. Reply anytime to start again. Stay safe. 🙏");
      return Response.json({ ok: true, action: "stop" });
    }

    let step = session.step;
    const draft = { ...(session.draft || {}) };

    // First contact → send greeting and move to incident_type
    if (step === "greeting") {
      await base44.asServiceRole.entities.WhatsAppSession.update(session.id, { step: "incident_type" });
      await sendWA(from, greeting);
      return Response.json({ ok: true, step: "incident_type" });
    }

    if (step === "incident_type") {
      const opt = INCIDENT_OPTIONS.find((o) => o.key === lower);
      if (!opt) {
        await sendWA(from, `Please reply with a number from 1 to 8.\n\n${INCIDENT_OPTIONS.map((o) => `${o.key}. ${o.label}`).join("\n")}`);
        return Response.json({ ok: true, retry: true });
      }
      draft.incident_type = opt.value;
      step = "description";
      await base44.asServiceRole.entities.WhatsAppSession.update(session.id, { step, draft });
      await sendWA(from, nextPrompt(step));
      return Response.json({ ok: true, step });
    }

    if (step === "description") {
      draft.description = text.slice(0, 2000);
      step = "location";
      await base44.asServiceRole.entities.WhatsAppSession.update(session.id, { step, draft });
      await sendWA(from, nextPrompt(step));
      return Response.json({ ok: true, step });
    }

    if (step === "location") {
      draft.location = text.slice(0, 500);
      step = "anonymous_choice";
      await base44.asServiceRole.entities.WhatsAppSession.update(session.id, { step, draft });
      await sendWA(from, nextPrompt(step));
      return Response.json({ ok: true, step });
    }

    if (step === "anonymous_choice") {
      if (lower === "1") {
        draft.is_anonymous = true;
        const updated = await base44.asServiceRole.entities.WhatsAppSession.update(session.id, { step: "anonymous_choice", draft });
        const caseRef = await submitCase(base44, { ...updated, draft });
        await sendWA(from, `✅ Your report has been received.\n\nCase reference: *${caseRef}*\n\nA responder will follow up. If you are in immediate danger, call *116* (VSU hotline) or *991*.`);
        return Response.json({ ok: true, submitted: caseRef });
      }
      if (lower === "2") {
        draft.is_anonymous = false;
        step = "name";
        await base44.asServiceRole.entities.WhatsAppSession.update(session.id, { step, draft });
        await sendWA(from, nextPrompt(step));
        return Response.json({ ok: true, step });
      }
      await sendWA(from, "Please reply *1* for Anonymous or *2* to share your name.");
      return Response.json({ ok: true, retry: true });
    }

    if (step === "name") {
      draft.name = text.slice(0, 100);
      const updated = await base44.asServiceRole.entities.WhatsAppSession.update(session.id, { step: "name", draft });
      const caseRef = await submitCase(base44, { ...updated, draft });
      await sendWA(from, `✅ Thank you, ${draft.name}. Your report has been received.\n\nCase reference: *${caseRef}*\n\nA responder will follow up. If you are in immediate danger, call *116* (VSU hotline) or *991*.`);
      return Response.json({ ok: true, submitted: caseRef });
    }

    // submitted or unknown — restart
    await sendWA(from, "Reply *HELP* to start a new report.");
    return Response.json({ ok: true, idle: true });
  } catch (error) {
    console.error("whatsappWebhook error:", error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});