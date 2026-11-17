import { useCaseUpdates } from "@/hooks/useEntityQueries";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import EmptyState from "../EmptyState";

export default function AuditLog() {
  const { data: events = [], isLoading: loading } = useCaseUpdates(null, { sort: "-created_date", limit: 50 });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        title="No audit events"
        description="System activity will appear here."
      />
    );
  }

  return (
    <div
      className="bg-card border border-border rounded-xl overflow-y-auto"
      style={{ maxHeight: 320 }}
    >
      <ul className="divide-y divide-border">
        {events.map((evt) => (
          <li key={evt.id} className="flex items-start gap-3 p-3">
            <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-[10px]">
                  {evt.update_type}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  {evt.created_date
                    ? format(new Date(evt.created_date), "d MMM yyyy, HH:mm")
                    : ""}
                </span>
              </div>
              <p className="text-xs text-foreground/80 mt-1 break-words">
                {(evt.note || "").slice(0, 80)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}