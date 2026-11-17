import { apiClient } from "@/api/client";

export const ResponseUnitService = {
  list: (sort = "-created_date", limit, skip) => apiClient.entities.ResponseUnit.list(sort, limit, skip),
  filter: (query = {}, sort = "-created_date", limit, skip) => apiClient.entities.ResponseUnit.filter(query, sort, limit, skip),
  create: (data) => apiClient.entities.ResponseUnit.create(data),
  update: (id, data) => apiClient.entities.ResponseUnit.update(id, data),
  delete: (id) => apiClient.entities.ResponseUnit.delete(id),
  subscribe: (handler) => apiClient.entities.ResponseUnit.subscribe(handler),
};