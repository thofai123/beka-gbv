import { Link } from "react-router-dom";
import { Clock, MapPin, User } from "lucide-react";
import RiskBadge from "./RiskBadge";
import StatusBadge from "./StatusBadge";
import EscalationCountdown from "./EscalationCountdown";
import moment from "moment";
import { motion } from "framer-motion";

const incidentLabels = {
  physical_violence: "Physical Violence",
  sexual_violence: "Sexual Violence",
  emotional_abuse: "Emotional Abuse",
  economic_abuse: "Economic Abuse",
  stalking: "Stalking",
  trafficking: "Trafficking",
  forced_marriage: "Forced Marriage",
  other: "Other",
};

export default function CaseCard({ caseData, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/cases/${caseData.id}`}
        className="block bg-card rounded-2xl border border-border p-4 hover:border-primary/20 active:scale-[0.98] active:bg-muted/30 transition-all duration-150"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-muted-foreground">{caseData.case_id}</span>
              <StatusBadge status={caseData.status} />
              <RiskBadge level={caseData.risk_level} />
              <EscalationCountdown caseData={caseData} compact />
            </div>
            <p className="text-sm font-semibold mt-2">
              {incidentLabels[caseData.incident_type] || caseData.incident_type}
            </p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{caseData.description}</p>
          </div>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
            caseData.is_anonymous ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
          }`}>
            {caseData.is_anonymous ? "Anonymous Reporter" : "Identified"}
          </span>
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {moment(caseData.created_date).fromNow()}
          </div>
          {caseData.location_description && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[120px]">{caseData.location_description}</span>
            </div>
          )}
          {caseData.assigned_responder_name && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {caseData.assigned_responder_name}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}