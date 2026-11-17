import { apiClient } from "@/api/client";

export const StaffMessageService = {
  list: (sort = "-created_date", limit, skip) => apiClient.entities.StaffMessage.list(sort, limit, skip),
  filter: (query = {}, sort = "-created_date", limit, skip) => apiClient.entities.StaffMessage.filter(query, sort, limit, skip),
  create: (data) => apiClient.entities.StaffMessage.create(data),
  update: (id, data) => apiClient.entities.StaffMessage.update(id, data),
  delete: (id) => apiClient.entities.StaffMessage.delete(id),
  subscribe: (handler) => apiClient.entities.StaffMessage.subscribe(handler),
};