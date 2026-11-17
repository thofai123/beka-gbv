import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CaseService } from "@/services/CaseService";
import { motion } from "framer-motion";
import { Clock, ChevronRight, AlertTriangle } from "lucide-react";
import moment from "moment";

export default function AdminRecentActivity({ tick }) {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => CaseService.list("-created_date", 5)
      .then((c) => setCases(c || []))
      .catch(() => setCases([]))
      .finally(() => setLoading(false));
    load();
    const unsubscribe = CaseService.subscribe(() => load());
    return () => unsubscribe?.();
  }, []);

  return (
    <div className="w-full max-w-sm px-6 pb-8 z-10">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-[10px] tracking-widest uppercase font-semibold" style={{ color: "rgba(251,146,60,0.7)" }}>
            Recent
          </span>
          <h2 className="text-lg font-bold text-white">Latest Cases</h2>
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
      ) : cases.length === 0 ? (
        <div className="text-center py-6 text-white/40 text-xs border border-white/10 rounded-xl">
          No recent cases
        </div>
      ) : (
        <div className="space-y-2" key={tick}>
          {cases.map((c, i) => (
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
                  <span className="text-[9px] uppercase tracking-wider text-white/40 flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {moment(c.created_date).fromNow()}
                  </span>
                </div>
                <p className="text-[11px] text-white/50 truncate mt-0.5">{c.description || "No description"}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30" />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}