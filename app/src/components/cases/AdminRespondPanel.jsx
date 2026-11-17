// Smooth admin-only response panel surfaced at the top of CaseDetail.
// Lets admins acknowledge, change status, and jump to chat in 1 tap.

import { useState } from "react";
import { CaseService, CaseUpdateService } from "@/services/CaseService";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2, MessageSquare, Loader2, ShieldCheck, PlayCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminRespondPanel({ caseData, user, onUpdate, onOpenChat }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(null);

  const isAcknowledged = !!caseData.acknowledged_at;
  const isResolved = caseData.status === "resolved" || caseData.status === "closed";

  const updateStatus = async (status, label) => {
    setBusy(label);
    const payload = { status };
    if (status === "in_progress" && !isAcknowledged) {
      payload.acknowledged_at = new Date().toISOString();
      payload.acknowledged_by = user?.email || "Admin";
    }
    if (status === "resolved") payload.resolved_at = new Date().toISOString();

    await CaseService.update(caseData.id, payload);
    await CaseUpdateService.create({
      case_id: caseData.id,
      update_type: "status_change",
      note: `Admin marked case as ${label}.`,
      old_value: caseData.status,
      new_value: status,
      updated_by_name: user?.full_name || "Admin",
    });
    setBusy(null);
    toast({ title: `Marked as ${label}` });
    onUpdate?.();
  };

  const acknowledge = async () => {
    setBusy("ack");
    await CaseService.update(caseData.id, {
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: user?.email || "Admin",
      status: caseData.status === "received" ? "acknowledged" : caseData.status,
    });
    await CaseUpdateService.create({
      case_id: caseData.id,
      update_type: "status_change",
      note: `Acknowledged by ${user?.full_name || "Admin"}.`,
      new_value: "acknowledged",
      updated_by_name: user?.full_name || "Admin",
    });
    setBusy(null);
    toast({ title: "Case acknowledged" });
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
        <h3 className="text-sm font-bold uppercase tracking-wider text-orange-600">Admin Response</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {!isAcknowledged && (
          <Button
            size="sm"
            onClick={acknowledge}
            disabled={busy === "ack"}
            className="col-span-2 bg-orange-500 hover:bg-orange-600 gap-1.5"
          >
            {busy === "ack" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Acknowledge Case
          </Button>
        )}

        {!isResolved && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateStatus("in_progress", "in progress")}
              disabled={busy !== null || caseData.status === "in_progress"}
              className="gap-1.5"
            >
              {busy === "in progress" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
              In Progress
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateStatus("resolved", "resolved")}
              disabled={busy !== null}
              className="gap-1.5"
            >
              {busy === "resolved" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Resolve
            </Button>
          </>
        )}

        {isResolved && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateStatus("closed", "closed")}
            disabled={busy !== null || caseData.status === "closed"}
            className="col-span-2 gap-1.5"
          >
            {busy === "closed" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
            Close Case
          </Button>
        )}

        <Button
          size="sm"
          variant="secondary"
          onClick={onOpenChat}
          className="col-span-2 gap-1.5"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Message Survivor
        </Button>
      </div>
    </motion.div>
  );
}