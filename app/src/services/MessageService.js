import { apiClient } from "@/api/client";

export const MessageService = {
  list: (sort = "-created_date", limit, skip) => apiClient.entities.Message.list(sort, limit, skip),
  filter: (query = {}, sort = "-created_date", limit, skip) => apiClient.entities.Message.filter(query, sort, limit, skip),
  create: (data) => apiClient.entities.Message.create(data),
  update: (id, data) => apiClient.entities.Message.update(id, data),
  subscribe: (handler) => apiClient.entities.Message.subscribe(handler),
};