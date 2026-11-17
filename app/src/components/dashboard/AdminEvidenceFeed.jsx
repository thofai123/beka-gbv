// Real-time stream of incoming survivor evidence for admins.
// Subscribes to EvidenceVault entity changes — new files appear instantly at the top.

import { resolveFileUrl } from "@/lib/file-url";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Image, Mic, FileText, File, Clock, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";
import { useEvidence, useLiveEntityInvalidation } from "@/hooks/useEntityQueries";
import { EvidenceService } from "@/services/EvidenceService";

const fileTypeMeta = {
  photo: { icon: Image, color: "text-blue-400 bg-blue-500/15" },
  audio: { icon: Mic, color: "text-purple-400 bg-purple-500/15" },
  document: { icon: FileText, color: "text-orange-400 bg-orange-500/15" },
  other: { icon: File, color: "text-gray-400 bg-gray-500/15" },
};

export default function AdminEvidenceFeed({ tick }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: items = [], isLoading: loading } = useEvidence({}, { sort: "-created_date", limit: 15 });

  const handleEvidenceEvent = useCallback((event) => {
    if (event.type === "create") toast({ title: "📎 New evidence submitted" });
  }, [toast]);

  useLiveEntityInvalidation(EvidenceService, [["evidence"], ["cases"]], handleEvidenceEvent);

  const open = (item) => {
    if (item.case_id) navigate(`/beka/cases/${item.case_id}`);
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
          <h3 className="text-sm font-bold text-white">Evidence Feed</h3>
          <span className="text-[10px] text-white/40 uppercase tracking-wider">Realtime</span>
        </div>
        <button
          onClick={() => navigate("/beka/evidence")}
          className="text-[11px] uppercase tracking-wider text-orange-400 font-semibold flex items-center gap-0.5 active:scale-95"
        >
          Vault <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="max-h-[280px] overflow-y-auto" key={tick}>
        {loading ? (
          <div className="text-center py-6 text-white/40 text-xs">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-white/40 text-xs flex flex-col items-center gap-2">
            <Lock className="w-6 h-6 opacity-40" />
            <span>No evidence submitted yet.</span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {items.map((item) => {
              const meta = fileTypeMeta[item.file_type] || fileTypeMeta.other;
              const Icon = meta.icon;
              return (
                <motion.button
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: -8, backgroundColor: "rgba(239,68,68,0.2)" }}
                  animate={{ opacity: 1, y: 0, backgroundColor: "rgba(255,255,255,0)" }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.4 }}
                  onClick={() => open(item)}
                  className="w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/[0.04] transition-colors flex items-center gap-3"
                >
                  {item.file_type === "photo" && item.file_url ? (
                    <img
                      src={resolveFileUrl(item.file_url)}
                      alt=""
                      className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white truncate">{item.file_name}</span>
                      {item.case_ref && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-orange-300 bg-orange-500/15 px-1.5 py-0.5 rounded flex-shrink-0">
                          {item.case_ref}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-white/40 flex items-center gap-0.5 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {moment(item.created_date).fromNow()}
                    </span>
                  </div>
                  {item.case_id && <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />}
                </motion.button>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}