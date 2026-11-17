// Real-time stream of incoming panic alerts for admins.
// Subscribes to PanicAlert entity changes — new alerts appear instantly at the top.

import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, MapPin, Clock, ChevronRight, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";
import { useLiveEntityInvalidation, usePanicAlerts } from "@/hooks/useEntityQueries";
import { useUpdateCase, useUpdatePanicAlert } from "@/hooks/useEntityMutations";
import { PanicAlertService } from "@/services/PanicAlertService";
import { PanicAlertWorkflowService } from "@/services/PanicAlertWorkflowService.js";
import { ACTIVE_PANIC_ALERT_STATUSES } from "@/constants/appConstants";

export default function AdminLiveAlertsFeed({ user, tick }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [acking, setAcking] = useState(null);
  const { data: allAlerts = [], isLoading: loading } = usePanicAlerts({}, { sort: "-created_date", limit: 20 });
  const updateAlert = useUpdatePanicAlert();
  const updateCase = useUpdateCase();

  const handleAlertEvent = useCallback((event) => {
    if (event.type === "create" && event.data.status === "triggered") {
      toast({ title: "🚨 New panic alert", description: "An incoming alert needs response." });
    }
  }, [toast]);

  useLiveEntityInvalidation(PanicAlertService, [["panicAlerts"], ["cases"]], handleAlertEvent);

  const alerts = allAlerts.filter((x) => ACTIVE_PANIC_ALERT_STATUSES.includes(x.status));

  const acknowledge = async (e, alert) => {
    e.stopPropagation();
    setAcking(alert.id);
    await PanicAlertWorkflowService.acknowledge(alert);
    setAcking(null);
    toast({ title: "Alert acknowledged" });
  };

  const openCase = (alert) => {
    if (alert.linked_case_id) navigate(`/cases/${alert.linked_case_id}`);
    else navigate("/alerts-map");
  };

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-2xl backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-red-500"
          />
          <h3 className="text-sm font-bold text-white">Live Alerts</h3>
          <span className="text-[10px] text-white/40 uppercase tracking-wider">Realtime</span>
        </div>
        <button
          onClick={() => navigate("/alerts-map")}
          className="text-[11px] uppercase tracking-wider text-orange-400 font-semibold flex items-center gap-0.5 active:scale-95"
        >
          Map <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="max-h-[280px] overflow-y-auto" key={tick}>
        {loading ? (
          <div className="text-center py-6 text-white/40 text-xs">Loading…</div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8 text-white/40 text-xs flex flex-col items-center gap-2">
            <Radio className="w-6 h-6 opacity-40" />
            <span>No active alerts. All quiet.</span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {alerts.map((a) => (
              <motion.button
                key={a.id}
                layout
                initial={{ opacity: 0, y: -8, backgroundColor: "rgba(239,68,68,0.2)" }}
                animate={{ opacity: 1, y: 0, backgroundColor: "rgba(255,255,255,0)" }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.4 }}
                onClick={() => openCase(a)}
                className="w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/[0.04] transition-colors flex items-center gap-3"
              >
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    a.status === "triggered" ? "bg-red-500 animate-pulse" : "bg-orange-400"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      a.status === "triggered" ? "text-red-400" : "text-orange-300"
                    }`}>
                      {a.status === "triggered" ? "LIVE" : a.status}
                    </span>
                    <span className="text-[10px] text-white/40 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {moment(a.created_date).fromNow()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 text-[11px] text-white/60">
                    <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                    <span className="truncate">
                      {a.location_lat
                        ? `${a.location_lat.toFixed(4)}, ${a.location_lng.toFixed(4)}`
                        : "Location unavailable"}
                    </span>
                  </div>
                </div>
                {a.status === "triggered" ? (
                  <button
                    onClick={(e) => acknowledge(e, a)}
                    disabled={acking === a.id}
                    className="flex-shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-md flex items-center gap-1"
                  >
                    {acking === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                    Ack
                  </button>
                ) : (
                  <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}