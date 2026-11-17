import { apiConfig } from "@/lib/app-params";

/**
 * Uploaded files are stored with a relative URL such as /uploads/abc.jpg.
 * In the website that resolves against the site itself. Inside the Android
 * app it would resolve against https://localhost, so when the API base is an
 * absolute URL we resolve the file URL against it instead.
 */
export function resolveFileUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (/^(https?:|blob:|data:)/i.test(url)) return url;
  const base = apiConfig.apiBaseUrl || "";
  if (!/^https?:\/\//i.test(base)) return url;
  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
}
