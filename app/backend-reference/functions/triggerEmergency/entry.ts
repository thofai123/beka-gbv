import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

const AFRICALA_ENDPOINT = "https://api2.smsala.com/SendSmsV2";
const SENDER_ID = "AlaTech";

async function sendAfricalaSms(apiToken, destinationAddress, message, messageType) {
  const url = `${AFRICALA_ENDPOINT}?apiToken=${encodeURIComponent(apiToken)}&messageType=${encodeURIComponent(String(messageType))}&messageEncoding=1&destinationAddress=${encodeURIComponent(destinationAddress)}&sourceAddress=${encodeURIComponent(SENDER_ID)}&messageText=${encodeURIComponent(message)}`;
  const response = await fetch(url, { method: "GET" });
  const body = await response.text();
  return { ok: response.ok, status: response.status, body: body.slice(0, 500) };
}

function stripPlus(phone) {
  return String(phone || "").replace(/\s+/g, "").replace(/^\+/, "");
}

function buildMapsLink(lat, lng) {
  if (lat && lng) return `https://maps.google.com/?q=${lat},${lng}`;
  return null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const apiToken = Deno.env.get("AFRICALA_API_TOKEN");
    if (!apiToken) return Response.json({ error: "AFRICALA_API_TOKEN is not configured" }, { status: 500 });

    const body = await req.json();
    const { location_lat, location_lng, is_silent, client_idempotency_key } = body;

    // Idempotency check
    if (client_idempotency_key) {
      const existing = await base44.asServiceRole.entities.PanicAlert.filter({ client_idempotency_key });
      if (existing.length > 0) {
        const existingAlert = existing[0];
        return Response.json({
          success: true,
          case_id: existingAlert.linked_case_id,
          case_ref: null,
          recipients: [],
          delivery: { responders: null, contacts: null },
          idempotent: true,
        });
      }
    }

    // Generate case reference
    const caseCount = await base44.asServiceRole.entities.Case.list("-created_date", 1);
    const caseNumber = String((caseCount.length > 0 ? parseInt(caseCount[0].case_id?.split("-")[2] || "0") : 0) + 1).padStart(4, "0");
    const year = new Date().getFullYear();
    const caseRef = `GBV-${year}-${caseNumber}`;

    // Create PanicAlert
    const panicAlert = await base44.asServiceRole.entities.PanicAlert.create({
      location_lat: location_lat || null,
      location_lng: location_lng || null,
      status: "triggered",
      is_silent: is_silent || false,
      client_idempotency_key: client_idempotency_key || null,
    });

    // Create Case
    const mapsLink = buildMapsLink(location_lat, location_lng);
    const newCase = await base44.asServiceRole.entities.Case.create({
      case_id: caseRef,
      incident_type: "other",
      description: `Emergency panic alert triggered by ${user.full_name || user.email}`,
      status: "dispatched",
      risk_level: "critical",
      report_source: "panic_alert",
      reporter_email: user.email,
      reporter_user_id: user.id,
      survivor_name: user.full_name || null,
      location_lat: location_lat || null,
      location_lng: location_lng || null,
      location_description: mapsLink || null,
      assigned_unit_id: null,
      channel: "app",
      client_idempotency_key: client_idempotency_key || null,
    });

    // Link PanicAlert to Case
    await base44.asServiceRole.entities.PanicAlert.update(panicAlert.id, {
      linked_case_id: newCase.id,
    });

    // Initial audit CaseUpdate
    await base44.asServiceRole.entities.CaseUpdate.create({
      case_id: newCase.id,
      update_type: "status_change",
      old_value: "received",
      new_value: "dispatched",
      note: `Panic alert triggered by ${user.full_name || user.email}. Case created automatically.`,
      updated_by_name: user.full_name || user.email,
    });

    const locationText = mapsLink || "Location unavailable";

    // Step 1 — Notify response units
    const activeUnits = await base44.asServiceRole.entities.ResponseUnit.filter({
      is_active: true,
      on_call_status: "available",
    });

    let smsResult1 = null;
    const responderNumbers = [
      ...new Set(
        activeUnits
          .map((u) => stripPlus(u.contact_phone))
          .filter((p) => p.length >= 9)
      ),
    ];

    if (responderNumbers.length > 0) {
      const destAddr1 = responderNumbers.join(",");
      const msg1 = `BEKA ALERT [CRITICAL]\nCase: ${caseRef}\n${locationText}\nOpen app to respond immediately.`;
      smsResult1 = await sendAfricalaSms(apiToken, destAddr1, msg1, 2);
      await base44.asServiceRole.entities.CaseUpdate.create({
        case_id: newCase.id,
        update_type: "note",
        note: `Responder SMS sent to ${responderNumbers.length} unit(s). Africala status: ${smsResult1.status}. Response: ${smsResult1.body}`,
        updated_by_name: "system",
      });
    } else {
      await base44.asServiceRole.entities.CaseUpdate.create({
        case_id: newCase.id,
        update_type: "note",
        note: "No active available response units found. Responder SMS skipped.",
        updated_by_name: "system",
      });
    }

    // Step 2 — Notify survivor's emergency contacts (fetched from DB)
    const allContacts = await base44.asServiceRole.entities.EmergencyContact.filter({ user_id: user.id });
    const contactNumbers = [
      ...new Set(
        allContacts
          .map((c) => stripPlus(c.phone))
          .filter((p) => p.length >= 9)
      ),
    ];

    let smsResult2 = null;

    if (contactNumbers.length > 0) {
      const destAddr2 = contactNumbers.join(",");
      const msg2 = `EMERGENCY ALERT: ${user.full_name || "A BEKA user"} needs urgent help. Location: ${locationText}. This alert was sent via the BEKA Emergency App.`;
      smsResult2 = await sendAfricalaSms(apiToken, destAddr2, msg2, 2);
      await base44.asServiceRole.entities.CaseUpdate.create({
        case_id: newCase.id,
        update_type: "note",
        note: `Personal emergency contact SMS sent to ${contactNumbers.length} contact(s). Africala status: ${smsResult2.status}. Response: ${smsResult2.body}`,
        updated_by_name: "system",
      });
    } else {
      await base44.asServiceRole.entities.CaseUpdate.create({
        case_id: newCase.id,
        update_type: "note",
        note: "No emergency contacts found in database. Contact SMS skipped.",
        updated_by_name: "system",
      });
    }

    return Response.json({
      success: true,
      case_id: newCase.id,
      case_ref: caseRef,
      recipients: [...responderNumbers, ...contactNumbers],
      delivery: {
        responders: smsResult1,
        contacts: smsResult2,
      },
    });
  } catch (error) {
    console.error("triggerEmergency error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});