import { apiClient } from "@/api/client";

export const PanicAlertService = {
  list: (sort = "-created_date", limit, skip) => apiClient.entities.PanicAlert.list(sort, limit, skip),
  filter: (query = {}, sort = "-created_date", limit, skip) => apiClient.entities.PanicAlert.filter(query, sort, limit, skip),
  create: (data) => apiClient.entities.PanicAlert.create(data),
  update: (id, data) => apiClient.entities.PanicAlert.update(id, data),
  subscribe: (handler) => apiClient.entities.PanicAlert.subscribe(handler),
};