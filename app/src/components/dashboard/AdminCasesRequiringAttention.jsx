// Cases Requiring Attention — the most operationally urgent open cases.
// Surfaces Case Reference · Category · Priority · Status · Date Reported.
// Same dark dashboard card styling as the rest of the admin home.

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, ChevronRight, Clock } , Camera from "lucide-react";
import moment from "moment";
import { useCases, useLiveEntityInvalidation } from "@/hooks/useEntityQueries";
import { CaseService } from "@/services/CaseService";
import { ACTIVE_CASE_STATUSES } from "@/constants/appConstants";

const RISK_RANK = { critical: 0, high: 1, medium: 2, low: 3 };

const formatLabel = (value) => (value || "—").replace(/_/g, " ");

export default function AdminCasesRequiringAttention({ tick }) {
  const navigate = useNavigate();
  const { data: cases = [], isLoading: loading } = useCases({}, { sort: "-created_date", limit: 200 });

  useLiveEntityInvalidation(CaseService, [["cases"]]);

  const attention = useMemo(() => {
    return cases
      .filter((c) => ACTIVE_CASE_STATUSES.includes(c.status))
      .sort((a, b) => {
        const r = (RISK_RANK[a.risk_level] ?? 4) - (RISK_RANK[b.risk_level] ?? 4);
        if (r !== 0) return r;
        return new Date(b.created_date) - new Date(a.created_date);
      })
      .slice(0, 5);
  }, [cases]);

  return (
    <div className="w-full max-w-sm px-6 pb-4 z-10">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-[10px] tracking-widest uppercase font-semibold" style={{ color: "rgba(251,146,60,0.7)" }}>
            Priority
          </span>
          <h2 className="text-lg font-bold text-white">Cases Requiring Attention</h2>
        </div>
        <button
          onClick={() => navigate("/beka/cases")}
          className="text-[11px] uppercase tracking-wider text-orange-400 font-semibold flex items-center gap-0.5 active:scale-95"
        >
          View all <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-6 text-white/40 text-xs">Loading…</div>
      ) : attention.length === 0 ? (
        <div className="text-center py-6 text-white/40 text-xs border border-white/10 rounded-xl">
          No cases need attention right now
        </div>
      ) : (
        <div className="space-y-2" key={tick}>
          {attention.map((c, i) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/beka/cases/${c.id}`)}
              className="w-full text-left p-3 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.06] transition-colors flex items-center gap-3"
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  c.risk_level === "critical" ? "bg-red-500/15 text-red-400" : "bg-orange-500/15 text-orange-400"
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white truncate">{c.case_id || "Case"}</span>
                  <span className="text-[9px] uppercase tracking-wider text-white/40 flex items-center gap-0.5 flex-shrink-0">
                    <Clock className="w-2.5 h-2.5" />
                    {moment(c.created_date).fromNow()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="text-[9px] capitalize text-white/55 bg-white/5 px-1.5 py-0.5 rounded">
                    {formatLabel(c.incident_type)}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      c.risk_level === "critical"
                        ? "text-red-300 bg-red-500/15"
                        : c.risk_level === "high"
                        ? "text-orange-300 bg-orange-500/15"
                        : "text-yellow-300 bg-yellow-500/15"
                    }`}
                  >
                    {c.risk_level || "medium"}
                  </span>
                  <span className="text-[9px] capitalize text-blue-300 bg-blue-500/15 px-1.5 py-0.5 rounded">
                    {formatLabel(c.status)}
                  </span>
                  {Array.isArray(c.attachments) && c.attachments.some((u) => /^data:image\//i.test(String(u || "")) || /\.(png|jpe?g|gif|webp|heic)$/i.test(String(u || ""))) && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-sky-300 bg-sky-500/15 border border-sky-500/30 px-1.5 py-0.5 rounded">
                      <Camera className="w-2.5 h-2.5" /> Photo attached
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}