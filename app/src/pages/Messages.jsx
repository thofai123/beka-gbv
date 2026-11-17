import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, ArrowRight } from "lucide-react";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";
import moment from "moment";
import { motion } from "framer-motion";
import { useCases, useLiveEntityInvalidation, useMessages } from "@/hooks/useEntityQueries";
import { CaseService } from "@/services/CaseService";
import { MessageService } from "@/services/MessageService";
import { CLOSED_CASE_STATUSES } from "@/constants/appConstants";
import LoadingState from "@/components/LoadingState";

export default function Messages() {
  const navigate = useNavigate();
  const { data: allCases = [], isLoading: loadingCases } = useCases({}, { sort: "-updated_date", limit: 50 });
  const { data: allMessages = [], isLoading: loadingMessages } = useMessages(null, { sort: "-created_date", limit: 500 });

  useLiveEntityInvalidation(CaseService, [["cases"]]);
  useLiveEntityInvalidation(MessageService, [["messages"], ["cases"]]);

  const cases = useMemo(() => allCases.filter((c) => !CLOSED_CASE_STATUSES.includes(c.status)), [allCases]);
  const messageCounts = useMemo(() => {
    const counts = {};
    allMessages.forEach((m) => { counts[m.case_id] = (counts[m.case_id] || 0) + 1; });
    return counts;
  }, [allMessages]);

  if (loadingCases || loadingMessages) return <LoadingState />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-sm text-muted-foreground">Case conversations</p>
      </div>

      {cases.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No active cases"
          description="Messages will appear here for cases with active conversations."
        />
      ) : (
        <div className="space-y-2">
          {cases.map((c, i) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => navigate(`/cases/${c.id}`)}
              className="w-full text-left bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/20 transition-all flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">{c.case_id}</span>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-sm font-medium mt-0.5 truncate">{c.description}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {messageCounts[c.id] || 0} messages · Updated {moment(c.updated_date).fromNow()}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}