// Stable query keys prevent duplicate fetches and keep User/Admin portals in sync.
export const queryKeys = {
  currentUser: ["currentUser"],
  users: (query = {}) => ["users", query],
  cases: (query = {}, options = {}) => ["cases", query, options],
  case: (id) => ["cases", "detail", id],
  caseUpdates: (caseId = "all", options = {}) => ["caseUpdates", caseId, options],
  messages: (caseId = "all", options = {}) => ["messages", caseId, options],
  notifications: (query = {}) => ["notifications", query],
  panicAlerts: (query = {}, options = {}) => ["panicAlerts", query, options],
  responseUnits: (query = {}, options = {}) => ["responseUnits", query, options],
  resources: (query = {}, options = {}) => ["resources", query, options],
  emergencyContacts: (query = {}, options = {}) => ["emergencyContacts", query, options],
  evidence: (query = {}, options = {}) => ["evidence", query, options],
  auditLogs: (query = {}, options = {}) => ["auditLogs", query, options],
  incidentLogs: (query = {}, options = {}) => ["incidentLogs", query, options],
  staffMessages: (query = {}, options = {}) => ["staffMessages", query, options],
};