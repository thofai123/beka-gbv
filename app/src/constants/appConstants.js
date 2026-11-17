// Centralized domain constants keep portals synchronized without changing stored values.
export const CASE_STATUSES = [
  "received",
  "dispatched",
  "acknowledged",
  "in_progress",
  "resolved",
  "escalated",
  "failed",
  "reported",
  "assigned",
  "closed",
];

export const ACTIVE_CASE_STATUSES = ["received", "dispatched", "acknowledged", "in_progress", "reported", "assigned", "escalated"];
export const CLOSED_CASE_STATUSES = ["resolved", "closed"];

export const RISK_LEVELS = ["low", "medium", "high", "critical"];

export const INCIDENT_TYPES = [
  "physical_violence",
  "sexual_violence",
  "emotional_abuse",
  "economic_abuse",
  "stalking",
  "trafficking",
  "forced_marriage",
  "other",
];

export const PANIC_ALERT_STATUSES = ["triggered", "acknowledged", "responded", "resolved", "escalated"];
export const ACTIVE_PANIC_ALERT_STATUSES = ["triggered", "acknowledged", "responded"];

export const RESPONSE_UNIT_TYPES = ["police", "hospital", "ngo", "social_services", "shelter", "legal_aid", "vsu", "osc", "other"];
export const RESPONSE_UNIT_STATUSES = ["available", "busy", "off_duty"];

export const NOTIFICATION_TYPES = ["panic_alert", "case_update", "assignment", "message", "system"];
export const EVIDENCE_TYPES = ["photo", "audio", "document", "zp_form_32", "other"];

export const CASE_UPDATE_TYPES = ["status_change", "note", "assignment", "risk_change", "resolution"];