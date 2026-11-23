import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Radio, MapPin, Clock, ChevronRight, CheckCircle2, Loader2, ExternalLink , Camera } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";
import { useCases, useLiveEntityInvalidation, usePanicAlerts } from "@/hooks/useEntityQueries";
import { PanicAlertService } from "@/services/PanicAlertService";
import { PanicAlertWorkflowService } from "@/services/PanicAlertWorkflowService.js";

export default function AdminLiveAlertsFeed({ user, tick }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [acking, setAcking] = useState(null);
  const { data: allAlerts = [], isLoading: loading } = usePanicAlerts({}, { sort: "-created_date", limit: 30 });
  const { data: cases = [] } = useCases({}, { sort: "-created_date", limit: 200 });

  const handleAlertEvent = useCallback((event) => {
    if (event.type === "create" && event.data.status === "triggered") {
      toast({ title: "🚨 New emergency alert", description: "An incoming alert needs response." });
    }
  }, [toast]);

  useLiveEntityInvalidation(PanicAlertService, [["panicAlerts"], ["cases"]], handleAlertEvent);

  const caseById = useMemo(() => {
    const m = new Map();
    for (const c of cases) if (c.id) m.set(c.id, c);
    return m;
  }, [cases]);

  const alerts = allAlerts.filter((x) => x.status === "triggered" || x.status === "escalated");

  const acknowledge = async (e, alert) => {
    e.stopPropagation();
    setAcking(alert.id);
    await PanicAlertWorkflowService.acknowledge(alert, user?.email);
    setAcking(null);
    toast({ title: "Alert acknowledged → Awaiting Review" });
  };

  const openCase = (alert) => {
    if (alert.linked_case_id) navigate(`/beka/cases/${alert.linked_case_id}`);
    else navigate("/beka/alerts-map");
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
          type="button"
          onClick={() => navigate("/beka/alerts-map")}
          className="text-[11px] uppercase tracking-wider text-orange-400 font-semibold flex items-center gap-0.5 active:scale-95"
        >
          Queue <ChevronRight className="w-3 h-3" />
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
          alerts.map((a) => {
            const linked = a.linked_case_id ? caseById.get(a.linked_case_id) : null;
            const caseCode = linked?.case_id || `ALERT-${String(a.id || "").slice(0, 6).toUpperCase()}`;
            const areaText =
              linked?.location_description ||
              (a.location_lat ? `${a.location_lat.toFixed(4)}, ${a.location_lng.toFixed(4)}` : "Location unavailable");
            const alertPhotos = [
              ...(Array.isArray(a.attachments) ? a.attachments : []),
              ...(Array.isArray(linked?.attachments) ? linked.attachments : []),
            ].filter((u) => /^data:image\//i.test(String(u || "")) || /\.(png|jpe?g|gif|webp|heic)$/i.test(String(u || "")));
            const mapsUrl =
              a.location_lat != null && a.location_lng != null
                ? `https://maps.google.com/?q=${a.location_lat},${a.location_lng}`
                : null;

            return (
              <div
                key={a.id}
                onClick={() => openCase(a)}
                className="w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/[0.04] transition-colors flex items-center gap-3 cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0 bg-red-500 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white">{caseCode}</span>
                    <span className="text-[10px] text-white/45 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {moment(a.created_date).fromNow()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-white/70 flex-wrap">
                    <span className="inline-flex items-center gap-1 min-w-0 truncate">
                      <MapPin className="w-2.5 h-2.5 text-orange-400 flex-shrink-0" />
                      <span className="truncate">{areaText}</span>
                    </span>
                    {alertPhotos.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[9px] font-semibold flex-shrink-0">
                        <Camera className="w-2.5 h-2.5" /> Photo ({alertPhotos.length})
                      </span>
                    )}
                  </div>
                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 mt-1 text-[10px] text-blue-400 hover:underline"
                    >
                      <ExternalLink className="w-2.5 h-2.5" /> Open Google Maps
                    </a>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => acknowledge(e, a)}
                  disabled={acking === a.id}
                  className="flex-shrink-0 bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-md flex items-center gap-1"
                >
                  {acking === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                  Ack
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
