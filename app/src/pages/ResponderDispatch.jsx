// Responder dispatch console — single-screen, 3-action emergency control.
// Shows critical/high cases needing action. Each card: Acknowledge / Dispatch / Escalate.

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, MapPin, Clock, AlertTriangle, CheckCircle2, Send, ArrowUpCircle, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import RiskBadge from "../components/RiskBadge";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import SkeletonCard from "../components/SkeletonCard";
import { haptic } from "@/lib/haptics";

const ACTION_STATES = ["received", "dispatched", "acknowledged"];

export default function ResponderDispatch() {
  const { toast } = useToast();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});

  const loadCases = useCallback(async () => {
    // Fetch open critical/high cases
    const data = await apiClient.entities.Case.filter(
      { status: { $in: ACTION_STATES }, risk_level: { $in: ["critical", "high"] } },
      "-created_date",
      30
    );
    setCases(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCases();
    const unsub = apiClient.entities.Case.subscribe(() => loadCases());
    const interval = setInterval(loadCases, 15000); // poll every 15s as belt-and-braces
    return () => {
      try { unsub(); } catch {}
      clearInterval(interval);
    };
  }, [loadCases]);

  const performAction = async (caseId, action) => {
    haptic.medium();
    setBusy((b) => ({ ...b, [caseId]: action }));
    try {
      const res = await apiClient.functions.invoke("acknowledgeAlert", { case_id: caseId, action });
      if (res.data?.success) {
        toast({ title: `Case ${action}d`, description: `Status: ${res.data.status}` });
        haptic.success();
        await loadCases();
      } else {
        throw new Error(res.data?.error || "Failed");
      }
    } catch (err) {
      toast({ title: "Action failed", description: err.message, variant: "destructive" });
      haptic.heavy();
    }
    setBusy((b) => ({ ...b, [caseId]: null }));
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} lines={5} />)}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-600" />
            Dispatch
          </h1>
          <p className="text-sm text-muted-foreground">
            {cases.length} active alert{cases.length !== 1 ? "s" : ""} requiring response
          </p>
        </div>
      </div>

      {cases.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="All clear"
          description="No active critical or high-risk alerts right now."
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {cases.map((c) => (
              <DispatchCard
                key={c.id}
                caseData={c}
                busy={busy[c.id]}
                onAction={(action) => performAction(c.id, action)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function DispatchCard({ caseData, busy, onAction }) {
  const isCritical = caseData.risk_level === "critical";
  const ageMin = moment().diff(moment(caseData.created_date), "minutes");
  const isStale = ageMin >= 3 && caseData.status !== "acknowledged";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`rounded-2xl border p-4 ${
        isCritical
          ? "bg-red-500/5 border-red-300"
          : "bg-card border-border"
      } ${isStale ? "ring-2 ring-red-400 panic-pulse" : ""}`}
    >
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-muted-foreground">{caseData.case_id}</span>
          <RiskBadge level={caseData.risk_level} />
          <StatusBadge status={caseData.status} />
          {isStale && (
            <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> STALE
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" /> {ageMin}m ago
        </div>
      </div>

      <p className="text-sm font-medium mt-2 line-clamp-2">{caseData.description}</p>

      {caseData.location_lat && (
        <a
          href={`https://maps.google.com/?q=${caseData.location_lat},${caseData.location_lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary mt-2 flex items-center gap-1 hover:underline"
        >
          <MapPin className="w-3 h-3" />
          {caseData.location_lat.toFixed(4)}, {caseData.location_lng.toFixed(4)} — Open map
        </a>
      )}

      {caseData.assigned_responder_name && (
        <p className="text-[11px] text-muted-foreground mt-2">
          Assigned: {caseData.assigned_responder_name}
        </p>
      )}

      <div className="grid grid-cols-3 gap-2 mt-3">
        <Button
          size="sm"
          variant="default"
          disabled={!!busy || caseData.status === "acknowledged"}
          onClick={() => onAction("acknowledge")}
          className="bg-green-600 hover:bg-green-700"
        >
          {busy === "acknowledge" ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
          <span className="ml-1 text-xs">Ack</span>
        </Button>
        <Button
          size="sm"
          variant="default"
          disabled={!!busy}
          onClick={() => onAction("dispatch")}
        >
          {busy === "dispatch" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          <span className="ml-1 text-xs">Dispatch</span>
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={!!busy}
          onClick={() => onAction("escalate")}
        >
          {busy === "escalate" ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowUpCircle className="w-3 h-3" />}
          <span className="ml-1 text-xs">Escalate</span>
        </Button>
      </div>
    </motion.div>
  );
}