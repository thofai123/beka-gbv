// Responder acknowledges an alert — transitions case to "acknowledged"
// and stops the escalation timer for this case.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { case_id, action } = await req.json(); // action: "acknowledge" | "dispatch" | "escalate"
    if (!case_id || !action) {
      return Response.json({ error: "case_id and action are required" }, { status: 400 });
    }

    const cases = await base44.asServiceRole.entities.Case.filter({ id: case_id }, "-created_date", 1);
    const c = cases[0];
    if (!c) return Response.json({ error: "Case not found" }, { status: 404 });

    // Only responders/admins can run these actions
    if (!["responder", "admin"].includes(user.role)) {
      return Response.json({ error: "Forbidden — responders only" }, { status: 403 });
    }

    let nextStatus = c.status;
    let note = "";
    const update = {};

    if (action === "acknowledge") {
      nextStatus = "acknowledged";
      update.acknowledged_at = new Date().toISOString();
      update.acknowledged_by = user.email;
      update.assigned_responder = user.email;
      update.assigned_responder_name = user.full_name || user.email;
      note = `Acknowledged by ${user.full_name || user.email}`;
    } else if (action === "dispatch") {
      nextStatus = "in_progress";
      update.assigned_responder = user.email;
      update.assigned_responder_name = user.full_name || user.email;
      note = `Dispatched — responder ${user.full_name || user.email} en route`;
    } else if (action === "escalate") {
      nextStatus = "escalated";
      update.escalation_count = (c.escalation_count || 0) + 1;
      note = `Manually escalated by ${user.full_name || user.email}`;
    } else {
      return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    update.status = nextStatus;

    await base44.asServiceRole.entities.Case.update(case_id, update);

    await base44.asServiceRole.entities.CaseUpdate.create({
      case_id,
      update_type: "status_change",
      note,
      old_value: c.status,
      new_value: nextStatus,
      updated_by_name: user.full_name || user.email,
    });

    // Notify case owner (the survivor) silently
    if (c.created_by) {
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: c.created_by,
        title: action === "acknowledge" ? "Help is coming" : action === "dispatch" ? "Responder dispatched" : "Case escalated",
        body: `Your case ${c.case_id} is now ${nextStatus.replace("_", " ")}.`,
        type: "case_update",
        related_case_id: case_id,
      });
    }

    return Response.json({ success: true, status: nextStatus });
  } catch (error) {
    console.error("acknowledgeAlert error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});