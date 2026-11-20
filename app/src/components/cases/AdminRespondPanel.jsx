import { useState } from "react";
import { CaseService, CaseUpdateService } from "@/services/CaseService";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2, MessageSquare, Loader2, ShieldCheck, ArrowRight, XCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminRespondPanel({ caseData, user, onUpdate, onOpenChat }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(null);

  const isOpen = caseData.status === "received" || caseData.status === "dispatched";
  const isResolved = caseData.status === "resolved" || caseData.status === "closed";

  const putUnderAwaitingReview = async () => {
    setBusy("review");
    await CaseService.update(caseData.id, {
      acknowledged_at: caseData.acknowledged_at || new Date().toISOString(),
      acknowledged_by: user?.email || "Admin",
      status: "acknowledged",
    });
    await CaseUpdateService.create({
      case_id: caseData.id,
      update_type: "status_change",
      note: `Put under Awaiting Review by ${user?.full_name || user?.email || "Admin"}.`,
      old_value: caseData.status,
      new_value: "acknowledged",
      updated_by_name: user?.full_name || "Admin",
    });
    setBusy(null);
    toast({ title: `${caseData.case_id} → Awaiting Review` });
    onUpdate?.();
  };

  const markResolved = async () => {
    setBusy("resolved");
    const resolvedAt = new Date().toISOString();
    await CaseService.update(caseData.id, {
      status: "resolved",
      resolved_at: resolvedAt,
    });
    await CaseUpdateService.create({
      case_id: caseData.id,
      update_type: "resolution",
      note: `Marked Resolved & recorded in Evidence Archive by ${user?.full_name || user?.email || "Admin"}.`,
      old_value: caseData.status,
      new_value: "resolved",
      updated_by_name: user?.full_name || "Admin",
    });
    setBusy(null);
    toast({ title: `${caseData.case_id} → Resolved Today` });
    onUpdate?.();
  };

  const closeCase = async () => {
    setBusy("closed");
    await CaseService.update(caseData.id, { status: "closed" });
    await CaseUpdateService.create({
      case_id: caseData.id,
      update_type: "status_change",
      note: `Case closed by ${user?.full_name || "Admin"}.`,
      old_value: caseData.status,
      new_value: "closed",
      updated_by_name: user?.full_name || "Admin",
    });
    setBusy(null);
    toast({ title: "Case closed" });
    onUpdate?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/30 rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="w-4 h-4 text-orange-500" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-orange-500">
          Admin Case Workflow
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {isOpen && (
          <Button
            size="sm"
            onClick={putUnderAwaitingReview}
            disabled={busy !== null}
            className="bg-amber-500 hover:bg-amber-600 text-black font-bold gap-1.5"
          >
            {busy === "review" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
            Put Under Awaiting Review
          </Button>
        )}

        {!isResolved && (
          <Button
            size="sm"
            onClick={markResolved}
            disabled={busy !== null}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
          >
            {busy === "resolved" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Mark Resolved (Archive Record)
          </Button>
        )}

        {isResolved && caseData.status !== "closed" && (
          <Button
            size="sm"
            variant="outline"
            onClick={closeCase}
            disabled={busy !== null}
            className="gap-1.5"
          >
            {busy === "closed" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
            Archive &amp; Close Case
          </Button>
        )}

        <Button
          size="sm"
          variant="secondary"
          onClick={onOpenChat}
          className="gap-1.5"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Message Survivor
        </Button>
      </div>
    </motion.div>
  );
}
