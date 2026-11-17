import { apiClient } from "@/api/client";

export const NotificationService = {
  list: (sort = "-created_date", limit, skip) => apiClient.entities.Notification.list(sort, limit, skip),
  filter: (query = {}, sort = "-created_date", limit, skip) => apiClient.entities.Notification.filter(query, sort, limit, skip),
  create: (data) => apiClient.entities.Notification.create(data),
  update: (id, data) => apiClient.entities.Notification.update(id, data),
  subscribe: (handler) => apiClient.entities.Notification.subscribe(handler),
};

const recentKeys = new Set();
const dedupeWindowMs = 3000;

export const NotificationManager = {
  async createOnce(data, dedupeKey = `${data.type}:${data.recipient_email}:${data.related_case_id || ""}:${data.title}`) {
    if (recentKeys.has(dedupeKey)) return null;
    recentKeys.add(dedupeKey);
    setTimeout(() => recentKeys.delete(dedupeKey), dedupeWindowMs);
    return NotificationService.create(data);
  },
  newCase: (recipient_email, caseData) => NotificationManager.createOnce({
    recipient_email,
    title: "New Case",
    body: `New case ${caseData.case_id || "submitted"}`,
    type: "case_update",
    related_case_id: caseData.id,
    is_read: false,
  }),
  caseAssigned: (recipient_email, caseData) => NotificationManager.createOnce({
    recipient_email,
    title: "New Case Assignment",
    body: `You have been assigned to case ${caseData.case_id}`,
    type: "assignment",
    related_case_id: caseData.id,
    is_read: false,
  }),
  caseUpdated: (recipient_email, caseData, body) => NotificationManager.createOnce({
    recipient_email,
    title: "Case Updated",
    body,
    type: "case_update",
    related_case_id: caseData.id,
    is_read: false,
  }),
  newMessage: (recipient_email, caseData) => NotificationManager.createOnce({
    recipient_email,
    title: "New Message",
    body: `New message on case ${caseData.case_id || ""}`.trim(),
    type: "message",
    related_case_id: caseData.id,
    is_read: false,
  }),
  panicAlert: (recipient_email, alert) => NotificationManager.createOnce({
    recipient_email,
    title: "Panic Alert",
    body: "A panic alert needs attention.",
    type: "panic_alert",
    related_case_id: alert.linked_case_id || "",
    is_read: false,
  }),
  evidenceUploaded: (recipient_email, evidence) => NotificationManager.createOnce({
    recipient_email,
    title: "📎 New Evidence Submitted",
    body: `A survivor uploaded "${evidence.file_name}"${evidence.case_ref ? ` linked to case ${evidence.case_ref}` : " (no linked case)"}.`,
    type: "case_update",
    related_case_id: evidence.case_id || "",
    is_read: false,
  }),
};