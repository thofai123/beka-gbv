// Accountability log — history of all staff interactions with cases.
// Reads from CaseUpdate (status_change, note, assignment, risk_change, resolution)
// to give admins a clear, filterable audit trail. Lives inside the admin dashboard.

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  ChevronRight,
  ArrowRightLeft,
  StickyNote,
  UserCheck,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import moment from "moment";
import { useCaseUpdates, useCases, useLiveEntityInvalidation } from "@/hooks/useEntityQueries";
import { CaseService, CaseUpdateService } from "@/services/CaseService";

const TYPE_META = {
  status_change: { label: "Status", icon: ArrowRightLeft, color: "text-blue-400 bg-blue-500/15" },
  note: { label: "Note", icon: StickyNote, color: "text-orange-400 bg-orange-500/15" },
  assignment: { label: "Assignment", icon: UserCheck, color: "text-purple-400 bg-purple-500/15" },
  risk_change: { label: "Risk", icon: ShieldAlert, color: "text-red-400 bg-red-500/15" },
  resolution: { label: "Resolution", icon: CheckCircle2, color: "text-green-400 bg-green-500/15" },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "status_change", label: "Status" },
  { key: "note", label: "Notes" },
  { key: "assignment", label: "Assigns" },
  { key: "risk_change", label: "Risk" },
];

export default function AdminAccountabilityLog({ tick }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const { data: updates = [], isLoading: loadingUpdates } = useCaseUpdates(null, { sort: "-created_date", limit: 100 });
  const { data: cases = [], isLoading: loadingCases } = useCases({}, { sort: "-created_date", limit: 200 });

  useLiveEntityInvalidation(CaseUpdateService, [["caseUpdates"], ["cases"]]);
  useLiveEntityInvalidation(CaseService, [["cases"]]);

  const loading = loadingUpdates || loadingCases;
  const caseRefs = useMemo(() => {
    const refs = {};
    cases.forEach((c) => { refs[c.id] = c.case_id || c.id; });
    updates.forEach((u) => { if (u.case_id && !refs[u.case_id]) refs[u.case_id] = u.case_id; });
    return refs;
  }, [cases, updates]);

  const filtered = useMemo(
    () => (filter === "all" ? updates : updates.filter((u) => u.update_type === filter)),
    [updates, filter]
  );

  const describe = (u) => {
    if (u.update_type === "status_change") return `${u.old_value || "—"} → ${u.new_value || "—"}`;
    if (u.update_type === "risk_change") return `${u.old_value || "—"} → ${u.new_value || "—"}`;
    if (u.update_type === "assignment") return u.new_value || u.note || "Reassigned";
    return u.note || "—";
  };

  return (
    <div className="w-full max-w-sm px-6 pb-4 z-10">
      <div className="flex items-center gap-2 mb-2">
        <History className="w-3.5 h-3.5 text-orange-400" />
        <span className="text-[10px] tracking-widest uppercase font-semibold text-orange-400/80">
          Accountability Log
        </span>
      </div>
      <h2 className="text-lg font-bold text-white mb-3">Staff Activity History</h2>

      {/* Filters */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
              filter === f.key
                ? "bg-orange-500 text-black"
                : "bg-white/5 text-white/50 hover:bg-white/10"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-8 text-white/40 text-xs">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-white/40 text-xs">No activity recorded yet</div>
        ) : (
          <div className="max-h-[380px] overflow-y-auto divide-y divide-white/5" key={tick}>
            <AnimatePresence initial={false}>
              {filtered.map((u, i) => {
                const meta = TYPE_META[u.update_type] || TYPE_META.note;
                const Icon = meta.icon;
                return (
                  <motion.button
                    key={u.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.3) }}
                    onClick={() => u.case_id && navigate(`/cases/${u.case_id}`)}
                    className="w-full text-left p-3 flex items-start gap-3 hover:bg-white/[0.04] transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wide font-semibold text-white/70">
                          {meta.label}
                        </span>
                        {u.case_id && (
                          <span className="text-[10px] font-mono text-orange-400/80 truncate">
                            {caseRefs[u.case_id] || u.case_id}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/80 truncate mt-0.5">{describe(u)}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">
                        {u.updated_by_name || "Staff"} · {moment(u.created_date).fromNow()}
                      </p>
                    </div>
                    {u.case_id && <ChevronRight className="w-4 h-4 text-white/25 flex-shrink-0 mt-1" />}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}