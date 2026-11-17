// Live countdown badge showing time remaining until auto-escalation.
// Auto-escalation fires 3 minutes after created_date for critical un-acknowledged cases.
// Pulses red under 60s; turns gray/escalated when expired.

import { useEffect, useState } from "react";
import { AlarmClock, AlertTriangle } from "lucide-react";

const ESCALATION_WINDOW_MS = 3 * 60 * 1000; // 3 minutes

function formatRemaining(ms) {
  if (ms <= 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function EscalationCountdown({ caseData, compact = false }) {
  const [now, setNow] = useState(Date.now());

  // Only show for critical risk + un-acknowledged statuses
  const eligible =
    caseData?.risk_level === "critical" &&
    (caseData?.status === "received" || caseData?.status === "dispatched");

  useEffect(() => {
    if (!eligible) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [eligible]);

  if (!eligible) return null;

  const created = new Date(caseData.created_date).getTime();
  const remaining = ESCALATION_WINDOW_MS - (now - created);
  const expired = remaining <= 0;
  const urgent = remaining > 0 && remaining < 60_000;

  const base = "inline-flex items-center gap-1 rounded-full font-mono font-semibold border";
  const sizeClass = compact ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5";

  if (expired) {
    return (
      <span className={`${base} ${sizeClass} bg-muted text-muted-foreground border-border`}>
        <AlertTriangle className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} />
        Escalated
      </span>
    );
  }

  if (urgent) {
    return (
      <span className={`${base} ${sizeClass} bg-red-500/15 text-red-600 border-red-500/40 animate-pulse`}>
        <AlarmClock className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} />
        {formatRemaining(remaining)}
      </span>
    );
  }

  return (
    <span className={`${base} ${sizeClass} bg-orange-500/10 text-orange-700 border-orange-500/30`}>
      <AlarmClock className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} />
      {formatRemaining(remaining)}
    </span>
  );
}