const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export function resolveFileUrl(url) {
  if (!url) return "";
  const raw = String(url).trim();
  if (/^(data:|blob:|https?:\/\/)/i.test(raw)) return raw;
  if (raw.startsWith("/")) return API_BASE ? `${API_BASE}${raw}` : raw;
  return raw;
}
