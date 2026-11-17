import { useState, useEffect } from "react";
import moment from "moment";
import { FileText, ArrowRight, User, AlertTriangle, CheckCircle } from "lucide-react";

function relativeTime(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return "Just now";
  return moment(dateStr).fromNow();
}

const typeIcons = {
  status_change: ArrowRight,
  note: FileText,
  assignment: User,
  risk_change: AlertTriangle,
  resolution: CheckCircle,
};

const typeColors = {
  status_change: "bg-blue-500",
  note: "bg-gray-400",
  assignment: "bg-purple-500",
  risk_change: "bg-orange-500",
  resolution: "bg-green-500",
};

export default function CaseTimeline({ updates }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  if (updates.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center text-sm text-muted-foreground">
        No updates yet
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-sm font-semibold mb-4">Case Timeline</h3>
      <div className="space-y-4">
        {updates.map((update, i) => {
          const Icon = typeIcons[update.update_type] || FileText;
          const dotColor = typeColors[update.update_type] || "bg-gray-400";
          return (
            <div key={update.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full ${dotColor} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-3.5 h-3.5 text-white" />
                </div>
                {i < updates.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">{update.note || `${update.update_type.replace("_", " ")}`}</p>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {relativeTime(update.created_date)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  by {update.updated_by_name || update.created_by}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}