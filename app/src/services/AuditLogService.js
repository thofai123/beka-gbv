import { apiClient } from "@/api/client";

export const AuditLogService = {
  list: (sort = "-created_date", limit, skip) => apiClient.entities.AuditLog.list(sort, limit, skip),
  filter: (query = {}, sort = "-created_date", limit, skip) => apiClient.entities.AuditLog.filter(query, sort, limit, skip),
  create: (data) => apiClient.entities.AuditLog.create({
    ...data,
    timestamp: data.timestamp || new Date().toISOString(),
  }),
  subscribe: (handler) => apiClient.entities.AuditLog.subscribe(handler),
};