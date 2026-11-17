import { apiClient } from "@/api/client";

export const UserService = {
  me: () => apiClient.auth.me(),
  list: (sort, limit, skip) => apiClient.entities.User.list(sort, limit, skip),
  filter: (query = {}, sort, limit, skip) => apiClient.entities.User.filter(query, sort, limit, skip),
  updateMe: (data) => apiClient.auth.updateMe(data),
  logout: (redirectUrl) => apiClient.auth.logout(redirectUrl),
};