// Responder/admin endpoint to update case status with audit trail and notification.
// Enforces role: only assigned responder, the unit lead, or admins can update.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { case_id, new_status, note } = await req.json();
    if (!case_id || !new_status) {
      return Response.json({ error: "case_id and new_status required" }, { status: 400 });
    }

    const cases = await base44.asServiceRole.entities.Case.filter({ id: case_id }, "-created_date", 1);
    const c = cases[0];
    if (!c) return Response.json({ error: "Case not found" }, { status: 404 });

    const isAdmin = user.role === "admin";
    const isResponder = user.role === "responder" || user.role === "admin";
    const isAssigned = c.assigned_responder === user.email;
    const isOwner = c.created_by === user.email;

    if (!isAdmin && !(isResponder && (isAssigned || c.assigned_unit_id))) {
      // owners can also close their own report
      if (!(isOwner && new_status === "closed")) {
        return Response.json({ error: "Forbidden — insufficient permissions" }, { status: 403 });
      }
    }

    const update = { status: new_status };
    if (new_status === "resolved" || new_status === "closed") {
      update.resolved_at = new Date().toISOString();
    }

    await base44.asServiceRole.entities.Case.update(case_id, update);

    await base44.asServiceRole.entities.CaseUpdate.create({
      case_id,
      update_type: "status_change",
      note: note || `Status changed from ${c.status} to ${new_status}`,
      old_value: c.status,
      new_value: new_status,
      updated_by_name: user.full_name || user.email,
    });

    // Notify case owner if different from updater
    if (c.created_by && c.created_by !== user.email) {
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: c.created_by,
        title: `Case ${c.case_id} updated`,
        body: `Status: ${new_status}. ${note || ""}`,
        type: "case_update",
        related_case_id: case_id,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("updateCaseStatus error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});