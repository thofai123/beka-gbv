import { apiClient } from "@/api/client";

export const EmergencyContactService = {
  list: (sort = "priority", limit, skip) => apiClient.entities.EmergencyContact.list(sort, limit, skip),
  filter: (query = {}, sort = "priority", limit, skip) => apiClient.entities.EmergencyContact.filter(query, sort, limit, skip),
  create: (data) => apiClient.entities.EmergencyContact.create(data),
  update: (id, data) => apiClient.entities.EmergencyContact.update(id, data),
  delete: (id) => apiClient.entities.EmergencyContact.delete(id),
  subscribe: (handler) => apiClient.entities.EmergencyContact.subscribe(handler),
};