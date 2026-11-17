// Compact operational summary cards for the admin home.
// Keeps the exact same card styling as before — only the metrics are operationally focused:
// Open Cases · Active Panic Alerts · Awaiting Review · Resolved Today.

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, AlertTriangle, Inbox, CheckCircle2, ChevronRight } from "lucide-react";
import moment from "moment";
import { useCases, usePanicAlerts, useLiveEntityInvalidation } from "@/hooks/useEntityQueries";
import { CaseService } from "@/services/CaseService";
import { PanicAlertService } from "@/services/PanicAlertService";
import { CLOSED_CASE_STATUSES, ACTIVE_PANIC_ALERT_STATUSES } from "@/constants/appConstants";

export default function AdminOperationsOverview() {
  const navigate = useNavigate();
  const { data: alerts = [], isLoading: loadingAlerts } = usePanicAlerts({}, { sort: "-created_date", limit: 100 });
  const { data: cases = [], isLoading: loadingCases } = useCases({}, { sort: "-created_date", limit: 500 });

  useLiveEntityInvalidation(CaseService, [["cases"]]);
  useLiveEntityInvalidation(PanicAlertService, [["panicAlerts"]]);

  const loading = loadingAlerts || loadingCases;

  const openCases = cases.filter((c) => !CLOSED_CASE_STATUSES.includes(c.status));
  const activeAlerts = alerts.filter((a) => ACTIVE_PANIC_ALERT_STATUSES.includes(a.status));
  const awaitingReview = cases.filter((c) => ["received", "reported"].includes(c.status));
  const startOfToday = moment().startOf("day");
  const resolvedToday = cases.filter(
    (c) => CLOSED_CASE_STATUSES.includes(c.status) && moment(c.updated_date || c.resolved_at).isSameOrAfter(startOfToday)
  );

  const cards = [
    { label: "Open Cases", value: openCases.length, icon: FileText, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", to: "/cases" },
    { label: "Active Alerts", value: activeAlerts.length, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", to: "/alerts-map" },
    { label: "Awaiting Review", value: awaitingReview.length, icon: Inbox, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", to: "/cases" },
    { label: "Resolved Today", value: resolvedToday.length, icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30", to: "/cases" },
  ];

  return (
    <div className="w-full max-w-sm px-6 py-6 z-10">
      <div className="mb-4">
        <span className="text-[10px] tracking-widest uppercase font-semibold" style={{ color: "rgba(251,146,60,0.7)" }}>
          Admin Console
        </span>
        <h2 className="text-xl font-bold text-white mt-1">Operations Overview</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cards.map((c, i) => (
          <motion.button
            key={c.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(c.to)}
            className={`text-left p-4 rounded-2xl border ${c.border} ${c.bg} backdrop-blur-sm relative overflow-hidden group`}
          >
            <div className="flex items-start justify-between mb-2">
              <c.icon className={`w-5 h-5 ${c.color}`} />
              <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
            </div>
            <div className={`text-2xl font-bold ${c.color}`}>{loading ? "—" : c.value}</div>
            <div className="text-[11px] uppercase tracking-wider text-white/60 mt-0.5">{c.label}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}