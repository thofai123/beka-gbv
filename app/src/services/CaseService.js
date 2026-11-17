import { apiClient } from "@/api/client";

export const CaseService = {
  list: (sort = "-created_date", limit, skip) => apiClient.entities.Case.list(sort, limit, skip),
  filter: (query = {}, sort = "-created_date", limit, skip) => apiClient.entities.Case.filter(query, sort, limit, skip),
  getById: async (id) => {
    const results = await apiClient.entities.Case.filter({ id }, "-created_date", 1);
    return results?.[0] || null;
  },
  create: (data) => apiClient.entities.Case.create(data),
  update: (id, data) => apiClient.entities.Case.update(id, data),
  delete: (id) => apiClient.entities.Case.delete(id),
  subscribe: (handler) => apiClient.entities.Case.subscribe(handler),
};

export const CaseUpdateService = {
  list: (sort = "-created_date", limit, skip) => apiClient.entities.CaseUpdate.list(sort, limit, skip),
  filter: (query = {}, sort = "-created_date", limit, skip) => apiClient.entities.CaseUpdate.filter(query, sort, limit, skip),
  create: (data) => apiClient.entities.CaseUpdate.create(data),
  subscribe: (handler) => apiClient.entities.CaseUpdate.subscribe(handler),
};