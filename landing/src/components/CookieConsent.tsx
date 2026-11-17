import { useEffect, useState } from "react";

const KEY = "beka_cookie_consent_v1";
const POLICY_URL = "/cookies";
const SHOW_ANALYTICS = true; // set false if BEKA uses no analytics

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; }
}

export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const c = read();
    if (c) setAnalytics(!!c.analytics); else setOpen(true);
    const reopen = () => { const s = read(); setAnalytics(!!(s && s.analytics)); setOpen(true); };
    window.addEventListener("beka:cookie-settings", reopen);
    return () => window.removeEventListener("beka:cookie-settings", reopen);
  }, []);

  function save(allow: boolean) {
    try { localStorage.setItem(KEY, JSON.stringify({ necessary: true, analytics: !!allow, ts: new Date().toISOString() })); } catch (e) {}
    setOpen(false);
    if (allow) window.dispatchEvent(new Event("beka:analytics-allowed")); // load your analytics script on this event
  }

  if (!open) return null;
  const btn = { flex: 1, minWidth: 120, padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db", background: "#fff", color: "#1f2937", font: "inherit", fontWeight: 600, cursor: "pointer" };
  const primary = { ...btn, background: "#E84B1D", borderColor: "#E84B1D", color: "#fff" };
  return (
    <div role="dialog" aria-label="Cookie settings" style={{ position: "fixed", left: 12, right: 12, bottom: 12, maxWidth: 520, margin: "0 auto", background: "#fff", color: "#1f2937", border: "1px solid #e5e7eb", borderRadius: 14, boxShadow: "0 8px 30px rgba(0,0,0,.25)", padding: 16, zIndex: 99999, fontSize: 14, lineHeight: 1.45 }}>
      <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700 }}>Cookies on BEKA</h3>
      <p style={{ margin: "0 0 12px" }}>
        We use necessary storage to keep you signed in and make the app work.{SHOW_ANALYTICS ? " Optional analytics stay off unless you allow them." : ""}{" "}
        <a href={POLICY_URL} style={{ color: "#E84B1D", textDecoration: "underline" }}>Learn more</a>
      </p>
      {SHOW_ANALYTICS && (
        <label style={{ display: "flex", gap: 8, alignItems: "center", margin: "0 0 12px" }}>
          <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} /> Analytics (optional)
        </label>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {SHOW_ANALYTICS ? (
          <>
            <button style={btn} onClick={() => save(false)}>Necessary only</button>
            <button style={btn} onClick={() => save(analytics)}>Save choice</button>
            <button style={primary} onClick={() => save(true)}>Accept all</button>
          </>
        ) : (
          <button style={primary} onClick={() => save(false)}>OK</button>
        )}
      </div>
    </div>
  );
}
