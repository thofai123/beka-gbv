import { apiClient } from "@/api/client";

export const EvidenceService = {
  list: (sort = "-created_date", limit, skip) => apiClient.entities.EvidenceVault.list(sort, limit, skip),
  filter: (query = {}, sort = "-created_date", limit, skip) => apiClient.entities.EvidenceVault.filter(query, sort, limit, skip),
  create: (data) => apiClient.entities.EvidenceVault.create(data),
  delete: (id) => apiClient.entities.EvidenceVault.delete(id),
  subscribe: (handler) => apiClient.entities.EvidenceVault.subscribe(handler),
};