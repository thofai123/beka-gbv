// Banner shown to responders/admins on Dashboard listing critical un-acknowledged cases
// with their live escalation countdown. Tap a row to jump to the case.

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import EscalationCountdown from "./EscalationCountdown";
import { useCases, useLiveEntityInvalidation } from "@/hooks/useEntityQueries";
import { CaseService } from "@/services/CaseService";

export default function CriticalEscalationBanner({ user }) {
  const navigate = useNavigate();
  const canView = user?.role === "admin" || user?.role === "responder";
  const { data: criticalCases = [] } = useCases({ risk_level: "critical" }, { sort: "-created_date", limit: 20, enabled: !!canView });

  useLiveEntityInvalidation(CaseService, [["cases"]]);

  const cases = useMemo(
    () => criticalCases.filter((c) => c.status === "received" || c.status === "dispatched"),
    [criticalCases]
  );

  if (!cases.length) return null;

  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3 mb-3 z-10 relative">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-red-600" />
        <p className="text-xs font-bold text-red-700 uppercase tracking-wider">
          {cases.length} critical case{cases.length > 1 ? "s" : ""} awaiting acknowledgement
        </p>
      </div>
      <div className="space-y-1.5">
        {cases.slice(0, 3).map((c) => (
          <button
            key={c.id}
            onClick={() => navigate(`/cases/${c.id}`)}
            className="w-full flex items-center justify-between gap-2 bg-card/60 hover:bg-card rounded-lg px-2.5 py-1.5 text-left transition-colors"
          >
            <span className="font-mono text-[11px] font-semibold truncate">{c.case_id}</span>
            <EscalationCountdown caseData={c} />
          </button>
        ))}
      </div>
    </div>
  );
}