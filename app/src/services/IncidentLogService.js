import { apiClient } from "@/api/client";

export const IncidentLogService = {
  list: (sort = "-created_date", limit, skip) => apiClient.entities.IncidentLog.list(sort, limit, skip),
  filter: (query = {}, sort = "-created_date", limit, skip) => apiClient.entities.IncidentLog.filter(query, sort, limit, skip),
  create: (data) => apiClient.entities.IncidentLog.create(data),
  update: (id, data) => apiClient.entities.IncidentLog.update(id, data),
  delete: (id) => apiClient.entities.IncidentLog.delete(id),
  subscribe: (handler) => apiClient.entities.IncidentLog.subscribe(handler),
};