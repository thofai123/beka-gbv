/**
 * Application configuration and auth-token storage.
 *
 * Replaces the former Base44 "app params" module. Base44 pulled an appId /
 * access_token out of the URL and its own storage keys; we now just read a
 * single API base URL from the build-time environment and keep the user's
 * bearer token in localStorage.
 */

const isBrowser = typeof window !== "undefined";
const TOKEN_KEY = "auth_token";

export const apiConfig = {
  // Where the backend lives. Set VITE_API_BASE_URL at build time.
  // Defaults to a same-origin "/api" prefix (handy behind an nginx reverse proxy).
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "/api",
};

export function getToken() {
  if (!isBrowser) return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (!isBrowser) return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (!isBrowser) return;
  window.localStorage.removeItem(TOKEN_KEY);
}

/**
 * On first load, capture a token handed back via the URL (e.g. after an OAuth
 * redirect: `?access_token=...`) and strip it from the address bar.
 */
export function captureTokenFromUrl() {
  if (!isBrowser) return;
  const params = new URLSearchParams(window.location.search);
  const token = params.get("access_token");
  if (token) {
    setToken(token);
    params.delete("access_token");
    const qs = params.toString();
    const newUrl = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
    window.history.replaceState({}, document.title, newUrl);
  }
}
