// Notifies a survivor's registered emergency contacts via SMS when their critical
// case escalates (e.g. unacknowledged timeout). Invoked by checkEscalations via the
// service role. Uses the same SMSala provider as sendAlertSMS.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

const AFRICALA_ENDPOINT = "https://api2.smsala.com/SendSmsV2";
const SENDER_ID = "AlaTech";

function normalizePhone(phoneNumber) {
  const phone = String(phoneNumber || "").replace(/\s+/g, "").replace(/-/g, "");
  if (!/^\+2609\d{8}$/.test(phone)) return null;
  return phone;
}

async function sendAfricalaSms(destinationAddress, message) {
  const apiToken = Deno.env.get("AFRICALA_API_TOKEN");
  if (!apiToken) throw new Error("AFRICALA_API_TOKEN is not configured");

  const url = `${AFRICALA_ENDPOINT}?apiToken=${encodeURIComponent(apiToken)}&messageType=2&messageEncoding=1&destinationAddress=${encodeURIComponent(destinationAddress)}&sourceAddress=${encodeURIComponent(SENDER_ID)}&messageText=${encodeURIComponent(message)}`;
  const response = await fetch(url, { method: "GET" });
  const text = await response.text();
  return { ok: response.ok, status: response.status, body: text.slice(0, 500) };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { case_id, owner_email, reason } = await req.json();
    if (!owner_email) {
      return Response.json({ error: "owner_email is required" }, { status: 400 });
    }

    // Pull the survivor's registered emergency contacts.
    const contacts = await base44.asServiceRole.entities.EmergencyContact.filter({
      created_by: owner_email,
    });

    const numbers = [
      ...new Set(contacts.map((c) => normalizePhone(c.phone)).filter(Boolean)),
    ];

    if (!numbers.length) {
      return Response.json({ success: true, notified: 0, note: "No valid emergency contacts on file." });
    }

    // Look up the case reference for a clearer message.
    let caseRef = "";
    if (case_id) {
      const c = await base44.asServiceRole.entities.Case.get(case_id).catch(() => null);
      if (c?.case_id) caseRef = ` (Ref: ${c.case_id})`;
    }

    const reasonText = reason === "timeout"
      ? "an emergency alert has gone unanswered"
      : "an emergency alert was triggered";
    const message = `BEKA ALERT: Someone who listed you as an emergency contact may be in danger — ${reasonText}${caseRef}. Please try to reach them and contact authorities (Police 991 / VSU 116) if needed.`;

    const destinationAddress = numbers.map((p) => p.replace(/^\+/, "")).join(",");
    const result = await sendAfricalaSms(destinationAddress, message);

    return Response.json({
      success: result.ok,
      notified: numbers.length,
      status: result.status,
      response: result.body,
    });
  } catch (error) {
    console.error("notifyEmergencyContacts error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});