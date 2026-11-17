import { apiClient } from "@/api/client";

export const ResourceService = {
  list: (sort = "name", limit, skip) => apiClient.entities.Resource.list(sort, limit, skip),
  filter: (query = {}, sort = "name", limit, skip) => apiClient.entities.Resource.filter(query, sort, limit, skip),
  create: (data) => apiClient.entities.Resource.create(data),
  update: (id, data) => apiClient.entities.Resource.update(id, data),
  delete: (id) => apiClient.entities.Resource.delete(id),
  subscribe: (handler) => apiClient.entities.Resource.subscribe(handler),
};