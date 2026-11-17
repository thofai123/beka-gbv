import { apiClient } from "@/api/client";
import { PanicAlertService } from "@/services/PanicAlertService";
import { CaseService, CaseUpdateService } from "@/services/CaseService";
import { AuditLogService } from "@/services/AuditLogService";

const caseStatusByAction = {
  acknowledge: "acknowledged",
  startResponse: "in_progress",
  escalate: "escalated",
  resolve: "resolved",
};

const alertStatusByAction = {
  acknowledge: "acknowledged",
  startResponse: "responded",
  escalate: "escalated",
  resolve: "resolved",
};

const updateLinkedCase = async (alert, action, user, assignedResponder, notes) => {
  if (!alert.linked_case_id) return null;

  const currentCase = await CaseService.getById(alert.linked_case_id);
  if (!currentCase) return null;

  const nextStatus = caseStatusByAction[action];
  const update = {
    status: nextStatus,
  };

  if (action === "acknowledge") {
    update.acknowledged_at = new Date().toISOString();
    update.acknowledged_by = user?.email || assignedResponder || "Responder";
    update.assigned_responder = assignedResponder || user?.email;
    update.assigned_responder_name = user?.full_name || user?.email;
  }

  if (action === "startResponse") {
    update.assigned_responder = assignedResponder || user?.email;
    update.assigned_responder_name = user?.full_name || user?.email;
    update.dispatched_at = new Date().toISOString();
  }

  if (action === "escalate") {
    update.escalation_count = (currentCase.escalation_count || 0) + 1;
  }

  if (action === "resolve") {
    update.resolved_at = new Date().toISOString();
    update.resolution_notes = notes || "Panic alert resolved";
  }

  await CaseService.update(currentCase.id, update);

  await CaseUpdateService.create({
    case_id: currentCase.id,
    update_type: action === "resolve" ? "resolution" : "status_change",
    note: notes || `Panic alert ${alertStatusByAction[action]}`,
    old_value: currentCase.status,
    new_value: nextStatus,
    updated_by_name: user?.full_name || user?.email || "System",
  });

  return currentCase;
};

const runWorkflowAction = async (alert, action, assignedResponder, notes) => {
  const user = await apiClient.auth.me();
  const previousStatus = alert.status;
  const nextStatus = alertStatusByAction[action];

  const alertUpdate = { status: nextStatus };
  if (action === "acknowledge" || action === "startResponse") {
    alertUpdate.responder_email = assignedResponder || user?.email;
    alertUpdate.responder_name = user?.full_name || user?.email;
  }

  await PanicAlertService.update(alert.id, alertUpdate);
  const linkedCase = await updateLinkedCase(alert, action, user, assignedResponder, notes);

  await AuditLogService.create({
    actor_id: user?.id,
    actor_email: user?.email,
    actor_role: user?.role,
    action_type: `panic_alert_${action}`,
    entity_type: "PanicAlert",
    entity_id: alert.id,
    related_case_id: alert.linked_case_id || linkedCase?.id || "",
    previous_value: { status: previousStatus },
    new_value: { status: nextStatus },
  });

  return { success: true, status: nextStatus };
};

export const PanicAlertWorkflowService = {
  acknowledge: (alert, assignedResponder) => runWorkflowAction(alert, "acknowledge", assignedResponder),
  startResponse: (alert, assignedResponder) => runWorkflowAction(alert, "startResponse", assignedResponder),
  escalate: (alert, assignedResponder) => runWorkflowAction(alert, "escalate", assignedResponder),
  resolve: (alert, notes) => runWorkflowAction(alert, "resolve", undefined, notes),
};