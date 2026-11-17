// Scheduled job: auto-escalates critical cases that have been "received" or "dispatched"
// for more than ESCALATION_THRESHOLD_MINUTES without an acknowledgement.
// Admin-only — invoked by the platform scheduler.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

const ESCALATION_THRESHOLD_MINUTES = 3;

const AT_API_KEY = Deno.env.get("AT_API_KEY");
const AT_USERNAME = Deno.env.get("AT_USERNAME");

async function sendSMS(numbers, message) {
  if (!numbers.length) return { ok: true };
  const isSandbox = AT_USERNAME === "sandbox";
  const endpoint = isSandbox
    ? "https://api.sandbox.africastalking.com/version1/messaging"
    : "https://api.africastalking.com/version1/messaging";
  const body = new URLSearchParams({ username: AT_USERNAME, to: numbers.join(","), message });
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "apiKey": AT_API_KEY, "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    // Allow service role invocations (no user) OR admin
    if (user && user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const cutoff = new Date(Date.now() - ESCALATION_THRESHOLD_MINUTES * 60 * 1000).toISOString();
    const candidates = await base44.asServiceRole.entities.Case.filter({
      risk_level: "critical",
      status: { $in: ["received", "dispatched"] },
      created_date: { $lt: cutoff },
    }, "-created_date", 50);

    const escalated = [];
    const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });
    const adminPhones = admins.map((a) => a.phone).filter(Boolean);

    for (const c of candidates) {
      await base44.asServiceRole.entities.Case.update(c.id, {
        status: "escalated",
        escalation_count: (c.escalation_count || 0) + 1,
      });

      await base44.asServiceRole.entities.CaseUpdate.create({
        case_id: c.id,
        update_type: "status_change",
        note: `⚠️ AUTO-ESCALATED: no responder acknowledgement after ${ESCALATION_THRESHOLD_MINUTES} minutes.`,
        old_value: c.status,
        new_value: "escalated",
        updated_by_name: "System (auto-escalation)",
      });

      // Notify admins via SMS + in-app
      const escMsg = `BEKA ⚠️ ESCALATION: Case ${c.case_id} unacknowledged for ${ESCALATION_THRESHOLD_MINUTES}min. Action required.`;
      if (adminPhones.length) await sendSMS([...new Set(adminPhones)], escMsg);

      for (const a of admins) {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: a.email,
          title: "⚠️ Case escalated",
          body: `Case ${c.case_id} was not acknowledged in time. Manual intervention required.`,
          type: "panic_alert",
          related_case_id: c.id,
        });
      }

      // Parallel safety-layer escalation — notify the survivor's emergency contacts.
      // Fire-and-forget, non-blocking.
      if (c.created_by) {
        base44.asServiceRole.functions.invoke("notifyEmergencyContacts", {
          case_id: c.id,
          owner_email: c.created_by,
          reason: "timeout",
        }).catch((e) => console.error("Contact escalation failed:", e.message));
      }

      escalated.push(c.case_id);
    }

    return Response.json({ success: true, escalated_count: escalated.length, escalated });
  } catch (error) {
    console.error("checkEscalations error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});