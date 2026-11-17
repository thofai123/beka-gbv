/**
 * Generic REST API client.
 *
 * This replaces the former Base44 SDK. It exposes the exact same surface the
 * app already relies on — `apiClient.entities.<Name>.list/filter/create/...`,
 * `apiClient.auth.*`, `apiClient.functions.invoke(...)` and
 * `apiClient.integrations.Core.*` — so no calling code had to change shape.
 *
 * It talks to YOUR backend over plain HTTP/JSON. Point it at your server with
 * the `VITE_API_BASE_URL` environment variable (see `.env.example`). The
 * backend must implement the REST contract documented in
 * `backend-reference/README.md`.
 */

import { apiConfig, getToken, setToken, clearToken } from "@/lib/app-params";

const BASE_URL = (apiConfig.apiBaseUrl || "/api").replace(/\/$/, "");

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request(method, path, { body, query, headers, isForm } = {}) {
  let url = `${BASE_URL}${path}`;

  if (query && Object.keys(query).length) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      qs.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
    }
    const s = qs.toString();
    if (s) url += `?${s}`;
  }

  const token = getToken();
  const finalHeaders = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(headers || {}),
  };

  let payload;
  if (isForm) {
    payload = body; // FormData — let the browser set the content-type/boundary
  } else if (body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(url, { method, headers: finalHeaders, body: payload });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      (data && data.message) || res.statusText || "Request failed",
      res.status,
      data,
    );
  }
  return data;
}

/**
 * Build a CRUD interface for one entity/collection.
 * Maps to REST routes under /entities/<name>.
 */
function makeEntity(name) {
  const base = `/entities/${name}`;
  return {
    list: (sort, limit, skip) =>
      request("GET", base, { query: { sort, limit, skip } }),
    filter: (query = {}, sort, limit, skip) =>
      request("GET", `${base}/filter`, {
        query: { where: query, sort, limit, skip },
      }),
    get: (id) => request("GET", `${base}/${id}`),
    create: (data) => request("POST", base, { body: data }),
    update: (id, data) => request("PUT", `${base}/${id}`, { body: data }),
    delete: (id) => request("DELETE", `${base}/${id}`),

    /**
     * Realtime subscription fallback.
     *
     * Base44 pushed live updates over a socket. Without that infrastructure we
     * poll the collection on an interval and invoke the handler. Returns an
     * unsubscribe function, matching the previous API. If your backend exposes
     * websockets/SSE, swap this implementation out here — nothing else changes.
     */
    subscribe: (handler, intervalMs = 15000) => {
      let stopped = false;
      const tick = async () => {
        if (stopped) return;
        try {
          const items = await request("GET", base, {
            query: { sort: "-created_date", limit: 50 },
          });
          if (!stopped) handler(items);
        } catch {
          /* swallow polling errors; next tick retries */
        }
      };
      tick();
      const timer = setInterval(tick, intervalMs);
      return () => {
        stopped = true;
        clearInterval(timer);
      };
    },
  };
}

// Entities used across the app. Add to this list if you introduce new ones.
const ENTITY_NAMES = [
  "AccessCode",
  "AuditLog",
  "Case",
  "CaseUpdate",
  "EmergencyContact",
  "EvidenceVault",
  "IncidentLog",
  "Message",
  "Notification",
  "OtpVerification",
  "PanicAlert",
  "Resource",
  "ResponseUnit",
  "StaffMessage",
  "TwoFactorCode",
  "User",
  "WhatsAppSession",
];

const entities = {};
for (const n of ENTITY_NAMES) entities[n] = makeEntity(n);

const auth = {
  me: () => request("GET", "/auth/me"),
  updateMe: (data) => request("PATCH", "/auth/me", { body: data }),

  isAuthenticated: async () => {
    if (!getToken()) return false;
    try {
      await request("GET", "/auth/me");
      return true;
    } catch {
      return false;
    }
  },

  setToken: (t) => setToken(t),

  register: (data) => request("POST", "/auth/register", { body: data }),

  loginViaEmailPassword: async (email, password) => {
    const res = await request("POST", "/auth/login", {
      body: { email, password },
    });
    if (res?.access_token) setToken(res.access_token);
    return res;
  },

  loginWithProvider: (provider, redirectPath = "/") => {
    // Redirect-based OAuth. Your backend handles the provider handshake and
    // returns the user to `redirect` with a token.
    const redirect = encodeURIComponent(
      new URL(redirectPath, window.location.origin).toString(),
    );
    window.location.href = `${BASE_URL}/auth/oauth/${provider}?redirect=${redirect}`;
  },

  verifyOtp: ({ email, otpCode }) =>
    request("POST", "/auth/verify-otp", { body: { email, otp: otpCode } }),

  resendOtp: (email) =>
    request("POST", "/auth/resend-otp", { body: { email } }),

  resetPasswordRequest: (email) =>
    request("POST", "/auth/reset-password/request", { body: { email } }),

  resetPassword: ({ email, resetToken, newPassword }) =>
    request("POST", "/auth/reset-password", {
      body: { email, reset_token: resetToken, new_password: newPassword },
    }),

  logout: (redirectUrl) => {
    clearToken();
    // Remove personal data cached on this device so the next person cannot see it.
    ["safeguard_emergency_contacts", "safeguard_destinations", "safeguard_resources_cache_v2"].forEach((k) => {
      try { localStorage.removeItem(k); } catch { /* ignore */ }
    });
    // Best-effort server-side session teardown; ignore failures.
    request("POST", "/auth/logout").catch(() => {});
    if (redirectUrl) window.location.href = redirectUrl;
  },
};

const functions = {
  /**
   * Invoke a backend function by name. Mirrors Base44's shape: resolves to an
   * object whose `.data` holds the parsed JSON response body.
   */
  invoke: async (name, payload = {}) => {
    const data = await request("POST", `/functions/${name}`, { body: payload });
    return { data, status: 200 };
  },
};

const integrations = {
  Core: {
    UploadFile: async ({ file }) => {
      const fd = new FormData();
      fd.append("file", file);
      return request("POST", "/integrations/upload", { body: fd, isForm: true });
    },
    InvokeLLM: (params) =>
      request("POST", "/integrations/llm", { body: params }),
  },
};

export const apiClient = { entities, auth, functions, integrations };
export { ApiError };
export default apiClient;
