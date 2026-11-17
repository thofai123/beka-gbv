import { Link } from "@tanstack/react-router";
import { LEGAL_VARS } from "../lib/legal-config";

const CSS = `
.legal{max-width:760px;margin:0 auto;padding:32px 20px 80px;line-height:1.7;color:#1f2937}
.legal h1{font-size:2rem;font-weight:800;margin:0 0 4px}
.legal h2{font-size:1.2rem;font-weight:700;margin:2rem 0 .5rem}
.legal p,.legal li{margin:.5rem 0}
.legal ul{padding-left:1.25rem;list-style:disc}
.legal a{color:#E84B1D;text-decoration:underline}
.legal table{width:100%;border-collapse:collapse;font-size:.9rem;margin:1rem 0}
.legal th,.legal td{border:1px solid #e5e7eb;padding:8px;text-align:left;vertical-align:top}
.legal th{background:#f9fafb}
.legal .legal-nav{display:flex;gap:16px;flex-wrap:wrap;font-size:.9rem;margin-bottom:24px}
`;

function fill(html: string) {
  return html.replace(/\{\{(\w+)\}\}/g, (_m, k) => (LEGAL_VARS as Record<string, string>)[k] ?? "");
}

export function LegalPage({ title, html }: { title: string; html: string }) {
  return (
    <main className="legal">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="legal-nav">
        <a href="/">← BEKA home</a>
        <Link to="/terms">Terms</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/cookies">Cookies</Link>
      </div>
      <h1>{title}</h1>
      <div dangerouslySetInnerHTML={{ __html: fill(html) }} />
    </main>
  );
}
